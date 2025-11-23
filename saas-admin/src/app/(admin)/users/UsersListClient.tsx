"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import type { UserDto } from "@/types/user";
import type { UserDashboardDto } from "@/types/dashboard";
import type { SubscriptionDto } from "@/types/subscription";
import type { PlanDto } from "@/types/plan";
import type { AppDto } from "@/types/app";
import type { PlanPriceDto } from "@/types/planPrice";
import { Status, CurrencyCode } from "@/types/app";
import { User, Mail, Phone, Trash2, CheckCircle2, XCircle, Package, CreditCard, Calendar, ChevronDown, ChevronUp, Activity, TrendingUp, FileText, Zap, Eye } from "lucide-react";
import Link from "next/link";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { deleteUserAction, activateUserAction, unapproveUserAction } from "./actions";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import Pagination from "@/components/filters/Pagination";
import type { PaginationInfo } from "@/lib/filterUtils";
import { getUserDashboard } from "@/lib/dashboardService";
import { getSubscriptionsByUser } from "@/lib/subscriptionsService";
import { getPlanById } from "@/lib/plansService";
import { getAllApps } from "@/lib/appsService";
import { getAllPlanPrices } from "@/lib/planPricesService";
import { getSubscriptionItems } from "@/lib/subscriptionItemsService";
import { getInvoicesByUser } from "@/lib/invoicesService";
import { getAllFeatures } from "@/lib/featuresService";
import type { SubscriptionItemDto } from "@/types/subscriptionItem";
import type { InvoiceDto } from "@/types/invoice";
import type { FeatureDto } from "@/types/feature";

// Status değerini Türkçe label'a çeviren fonksiyon
function getStatusLabel(status: Status | number): string {
  // Status değerini sayıya çevir (JSON'dan gelen sayı veya enum değeri olabilir)
  const statusNum = typeof status === 'number' ? status : Number(status);
  
  switch (statusNum) {
    case Status.Active:
    case 1:
      return "Aktif";
    case Status.DeActive:
    case 2:
      return "Pasif";
    case Status.UnApproved:
    case 3:
      return "Onay Bekliyor";
    case Status.Deleted:
    case 4:
      return "Silindi";
    case Status.Approved:
    case 6:
      return "Onaylandı";
    case Status.Cancel:
    case 7:
      return "İptal";
    case Status.Commit:
    case 14:
      return "Onaylandı";
    default:
      return `Bilinmeyen (${statusNum})`;
  }
}

// Status'e göre renk ve stil belirleyen fonksiyon
function getStatusStyles(status: Status | number) {
  const statusNum = typeof status === 'number' ? status : Number(status);
  
  switch (statusNum) {
    case Status.Active:
    case 1:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400"
      };
    case Status.Approved:
    case 6:
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
        dot: "bg-blue-400"
      };
    case Status.DeActive:
    case 2:
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/20",
        dot: "bg-orange-400"
      };
    case Status.UnApproved:
    case 3:
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        border: "border-yellow-500/20",
        dot: "bg-yellow-400"
      };
    case Status.Deleted:
    case 4:
    case Status.Cancel:
    case 7:
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/20",
        dot: "bg-red-400"
      };
    case Status.Commit:
    case 14:
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/20",
        dot: "bg-purple-400"
      };
    default:
      return {
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        border: "border-neutral-700/50",
        dot: "bg-neutral-500"
      };
  }
}

// UserCard Component
type AlternativeData = {
  subscriptions: (SubscriptionDto & { plan?: PlanDto; app?: AppDto; prices?: PlanPriceDto[] })[];
  apps: Map<string, AppDto>;
};

function UserCard({
  user,
  isPending,
  onDelete,
  onActivate,
  onUnapprove,
}: {
  user: UserDto;
  isPending: boolean;
  onDelete: () => void;
  onActivate: () => void;
  onUnapprove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dashboardData, setDashboardData] = useState<UserDashboardDto | null>(null);
  const [alternativeData, setAlternativeData] = useState<AlternativeData | null>(null);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false); // Tekrar yükleme engelleme
  const [subscriptionItemsMap, setSubscriptionItemsMap] = useState<Map<string, SubscriptionItemDto[]>>(new Map());
  const [featuresMap, setFeaturesMap] = useState<Map<string, FeatureDto>>(new Map());
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);

  const statusNum = Number(user.status);
  const isActive = statusNum === Status.Active || statusNum === 1;
  const statusStyles = getStatusStyles(user.status);
  const statusLabel = getStatusLabel(user.status);

  // Alternatif veri yükleme helper fonksiyonu - useRef ile stable reference
  const loadSubscriptionsDataRef = useRef<(() => Promise<void>) | null>(null);
  
  loadSubscriptionsDataRef.current = async () => {
    try {
      const subscriptions = await getSubscriptionsByUser(user.userId);
      
      if (subscriptions.length === 0) {
        setLoading(false);
        return;
      }

      // Tüm apps'i çek
      const allApps = await getAllApps();
      const appsMap = new Map<string, AppDto>();
      allApps.forEach(app => appsMap.set(app.id, app));

      // Her subscription için plan ve price bilgilerini çek
      const enrichedSubscriptions = await Promise.all(
        subscriptions.map(async (sub) => {
          try {
            const plan = await getPlanById(sub.planId);
            const prices = await getAllPlanPrices(sub.planId);
            const app = appsMap.get(sub.appId);
            
            return {
              ...sub,
              plan,
              app,
              prices: prices.filter(p => p.isCurrent && p.status === Status.Active),
            };
          } catch (err) {
            return {
              ...sub,
              plan: undefined,
              app: appsMap.get(sub.appId),
              prices: [],
            };
          }
        })
      );

      setAlternativeData({
        subscriptions: enrichedSubscriptions,
        apps: appsMap,
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // Dashboard bilgilerini lazy load et - eğer boşsa alternatif endpoint'lerden çek
  useEffect(() => {
    // Sadece expanded olduğunda ve veri yoksa çalışsın
    if (!expanded) {
      hasLoadedRef.current = false; // Kapandığında ref'i sıfırla
      return;
    }
    
    if (hasLoadedRef.current) return; // Zaten yüklenmişse tekrar yükleme
    if (dashboardData || alternativeData) return; // Veri varsa yükleme
    
    hasLoadedRef.current = true; // Yükleme başladığını işaretle
    setLoading(true);
    
    Promise.all([
      getUserDashboard(user.userId),
      getInvoicesByUser(user.userId),
      getAllFeatures(),
    ])
      .then(([data, invoicesData, featuresData]) => {
        // Eğer dashboard verisi boşsa, alternatif endpoint'lerden çek
        if ((!data.subscriptions || data.subscriptions.length === 0) && (!data.appRegistrations || data.appRegistrations.length === 0)) {
          loadSubscriptionsDataRef.current?.();
        } else {
          setDashboardData(data);
          setInvoices(invoicesData.slice(0, 5)); // Son 5 fatura
          
          // Features map oluştur
          const featMap = new Map<string, FeatureDto>();
          featuresData.forEach(f => featMap.set(f.id, f));
          setFeaturesMap(featMap);
          
          // Subscription items'ları yükle
          if (data.subscriptions.length > 0) {
            Promise.all(
              data.subscriptions.map(sub => 
                getSubscriptionItems(sub.subscriptionId)
                  .then(items => ({ subscriptionId: sub.subscriptionId, items }))
                  .catch(() => ({ subscriptionId: sub.subscriptionId, items: [] as SubscriptionItemDto[] }))
              )
            ).then(results => {
              const itemsMap = new Map<string, SubscriptionItemDto[]>();
              results.forEach(r => itemsMap.set(r.subscriptionId, r.items));
              setSubscriptionItemsMap(itemsMap);
            });
          }
          
          setLoading(false);
        }
      })
      .catch(() => {
        loadSubscriptionsDataRef.current?.();
      });
  }, [expanded, user.userId]); // Sadece expanded ve userId değiştiğinde

  const formatCurrency = (amount: number | null, currency: string | number | null): string => {
    if (!amount) return "Ücretsiz";
    // CurrencyCode enum: TRY=949, USD=840, EUR=978, GBP=826
    const currencyNum = typeof currency === 'string' ? parseInt(currency) : (currency as number);
    const currencySymbol = 
      currencyNum === CurrencyCode.TRY ? "₺" : 
      currencyNum === CurrencyCode.USD ? "$" : 
      currencyNum === CurrencyCode.EUR ? "€" : 
      currencyNum === CurrencyCode.GBP ? "£" : "";
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const calculateDaysBetween = (startDate: string, endDate: string | null): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBillingPeriodLabel = (period: string): string => {
    switch (period) {
      case "Monthly": return "Aylık";
      case "Yearly": return "Yıllık";
      case "Weekly": return "Haftalık";
      case "Daily": return "Günlük";
      default: return period;
    }
  };

  return (
    <article
      className={cn(
        components.card,
        "p-5 sm:p-6",
        "flex flex-col gap-4",
        "hover:shadow-lg hover:shadow-black/20 transition-all duration-200",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
            "border border-blue-500/30"
          )}>
            <User className="w-6 h-6 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-lg font-bold mb-0.5 truncate", text.primary)}>
              {user.userName}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                statusStyles.bg,
                statusStyles.text,
                statusStyles.border
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", statusStyles.dot)} />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <span className={cn(text.muted, "truncate")} title={user.email}>
            {user.email}
          </span>
        </div>
        {user.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span className={cn(text.muted, "truncate")} title={user.phone}>
              {user.phone}
            </span>
          </div>
        )}
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-lg",
          "bg-neutral-800/50 hover:bg-neutral-800/70 transition-colors",
          "text-sm font-medium",
          text.secondary
        )}
      >
        <span className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Detayları Göster
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="space-y-4 pt-2 border-t border-neutral-800/50">
          {loading ? (
            <div className="text-center py-4">
              <div className={cn("text-sm", text.muted)}>Yükleniyor...</div>
            </div>
          ) : dashboardData ? (
            <>
              {/* Finansal Özet */}
              {(dashboardData.totalSpent != null || dashboardData.spentLast30Days != null) && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <CreditCard className="w-4 h-4" />
                    Finansal Özet
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {dashboardData.totalSpent != null && (
                      <div>
                        <div className={cn("text-xs mb-1", text.muted)}>Toplam Harcama</div>
                        <div className={cn("text-lg font-bold", text.primary)}>
                          {formatCurrency(dashboardData.totalSpent, dashboardData.totalSpentCurrency)}
                        </div>
                      </div>
                    )}
                    {dashboardData.spentLast30Days != null && (
                      <div>
                        <div className={cn("text-xs mb-1", text.muted)}>Son 30 Gün</div>
                        <div className={cn("text-lg font-bold", text.primary)}>
                          {formatCurrency(dashboardData.spentLast30Days, dashboardData.spentLast30DaysCurrency)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* İstatistikler */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-3">
                  <div className={cn("text-xs mb-1", text.muted)}>Toplam Abonelik</div>
                  <div className={cn("text-xl font-bold", text.primary)}>{dashboardData.totalSubscriptions}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-emerald-400")}>Aktif Abonelik</div>
                  <div className={cn("text-xl font-bold text-emerald-400")}>{dashboardData.activeSubscriptions}</div>
                </div>
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-orange-400")}>İptal Edilen</div>
                  <div className={cn("text-xl font-bold text-orange-400")}>{dashboardData.cancelledSubscriptions}</div>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-blue-400")}>Uygulama</div>
                  <div className={cn("text-xl font-bold text-blue-400")}>{dashboardData.totalAppsRegistered}</div>
                </div>
              </div>

              {/* Uygulamalar ve Abonelikleri (İç İçe) */}
              <div>
                <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                  <Package className="w-4 h-4" />
                  Uygulamalar ({dashboardData.appRegistrations.length})
                </h4>
                {dashboardData.appRegistrations.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.appRegistrations.map((reg) => {
                      // Bu uygulamaya ait subscription'ı bul
                      const appSubscription = dashboardData.subscriptions.find(
                        (sub) => sub.appId === reg.appId
                      );
                      
                      return (
                        <div
                          key={reg.appId}
                          className={cn(
                            "rounded-lg border",
                            "bg-neutral-800/30",
                            reg.hasActiveSubscription
                              ? "border-emerald-500/30"
                              : "border-neutral-700/30"
                          )}
                        >
                          {/* Uygulama Başlığı */}
                          <div className="p-3 border-b border-neutral-700/30">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("font-semibold text-sm", text.primary)}>
                                    {reg.appName}
                                  </span>
                                  {reg.hasActiveSubscription && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                      Aktif Abonelik
                                    </span>
                                  )}
                                </div>
                                <div className={cn("text-xs", text.muted)}>
                                  Kayıt Tarihi: {formatDate(reg.registeredAt)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Abonelik Bilgileri */}
                          <div className="p-3">
                            {appSubscription ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={cn("font-medium text-sm mb-1", text.secondary)}>
                                      {appSubscription.planName}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-2">
                                      <span className={cn("flex items-center gap-1 text-xs", text.muted)}>
                                        <Calendar className="w-3 h-3" />
                                        {getBillingPeriodLabel(appSubscription.billingPeriod)}
                                      </span>
                                      {!appSubscription.isFreePlan && appSubscription.planPrice != null && (
                                        <span className={cn("font-medium text-xs", text.secondary)}>
                                          {formatCurrency(appSubscription.planPrice, appSubscription.planPriceCurrency)}
                                        </span>
                                      )}
                                      {appSubscription.isFreePlan && (
                                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-medium">
                                          Ücretsiz Plan
                                        </span>
                                      )}
                                      {appSubscription.trialDays && appSubscription.trialDays > 0 && (
                                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
                                          {appSubscription.trialDays} gün deneme
                                        </span>
                                      )}
                                      {!appSubscription.isActive && (
                                        <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-xs font-medium">
                                          Pasif
                                        </span>
                                      )}
                                    </div>
                                    <div className={cn("text-xs mt-2", text.muted)}>
                                      Başlangıç: {formatDate(appSubscription.startAt)}
                                      {appSubscription.endAt && ` • Bitiş: ${formatDate(appSubscription.endAt)}`}
                                      {!appSubscription.endAt && appSubscription.isActive && (
                                        ` • ${calculateDaysBetween(appSubscription.startAt, appSubscription.endAt)} gündür aktif`
                                      )}
                                    </div>
                                    
                                    {/* Feature Limitleri */}
                                    {subscriptionItemsMap.has(appSubscription.subscriptionId) && (
                                      <div className="mt-3 pt-3 border-t border-neutral-700/30">
                                        <div className={cn("text-xs font-semibold mb-2", text.secondary)}>
                                          <Zap className="w-3 h-3 inline mr-1" />
                                          Özellik Limitleri
                                        </div>
                                        <div className="space-y-2">
                                          {subscriptionItemsMap.get(appSubscription.subscriptionId)?.map((item) => {
                                            const feature = featuresMap.get(item.featureId);
                                            const percentage = item.allotted ? (item.used / item.allotted) * 100 : 0;
                                            const isOverLimit = item.allotted && item.used > item.allotted;
                                            
                                            return (
                                              <div key={item.id} className="text-xs">
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className={cn(text.muted)}>
                                                    {feature?.name || feature?.key || "Bilinmeyen Özellik"}
                                                  </span>
                                                  <span className={cn(
                                                    isOverLimit ? "text-red-400" : percentage > 80 ? "text-orange-400" : text.secondary
                                                  )}>
                                                    {item.used.toFixed(2)} / {item.allotted ? item.allotted.toFixed(2) : "∞"} {feature?.unit || ""}
                                                  </span>
                                                </div>
                                                {item.allotted && (
                                                  <div className="w-full bg-neutral-700/30 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                      className={cn(
                                                        "h-full transition-all",
                                                        isOverLimit ? "bg-red-500" : percentage > 80 ? "bg-orange-500" : "bg-emerald-500"
                                                      )}
                                                      style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    />
                                                  </div>
                                                )}
                                                {item.resetsAt && (
                                                  <div className={cn("text-xs mt-0.5", text.muted)}>
                                                    Sıfırlanma: {formatDate(item.resetsAt)}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={cn("text-xs text-center py-2 italic", text.muted)}>
                                <div className="flex items-center gap-2 justify-center">
                                  <XCircle className="w-4 h-4" />
                                  <span>Bu uygulamaya abone değil</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={cn("text-xs text-center py-2 italic", text.muted)}>
                    Bu kullanıcı henüz hiçbir uygulamaya kayıt olmamış
                  </div>
                )}
              </div>

              {/* Son Faturalar */}
              {invoices.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <FileText className="w-4 h-4" />
                    Son Faturalar ({invoices.length})
                  </h4>
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-2 rounded bg-neutral-900/50 hover:bg-neutral-900/70 transition-colors"
                      >
                        <div className="flex-1">
                          <div className={cn("text-xs font-medium mb-0.5", text.secondary)}>
                            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                          </div>
                          <div className={cn("text-xs", text.muted)}>
                            {formatDate(invoice.createdDate)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn("text-sm font-bold", text.primary)}>
                            {formatCurrency(invoice.total, invoice.currency)}
                          </div>
                          <div className={cn("text-xs", text.muted)}>
                            {formatCurrency(invoice.subtotal, invoice.currency)} + {formatCurrency(invoice.tax, invoice.currency)} KDV
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Son Aktiviteler */}
              {(dashboardData.lastSubscriptionCreated || dashboardData.lastSubscriptionCancelled || dashboardData.lastAppRegistered) && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Activity className="w-4 h-4" />
                    Son Aktiviteler
                  </h4>
                  <div className="space-y-2">
                    {dashboardData.lastSubscriptionCreated && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className={cn(text.muted)}>Son abonelik oluşturma:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastSubscriptionCreated)}</span>
                      </div>
                    )}
                    {dashboardData.lastSubscriptionCancelled && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className={cn(text.muted)}>Son abonelik iptali:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastSubscriptionCancelled)}</span>
                      </div>
                    )}
                    {dashboardData.lastAppRegistered && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className={cn(text.muted)}>Son uygulama kaydı:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastAppRegistered)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : alternativeData ? (
            <>
              {/* Alternative Data - Uygulamalar ve Abonelikleri (İç İçe) */}
              <div>
                <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                  <Package className="w-4 h-4" />
                  Uygulamalar ve Abonelikleri
                </h4>
                {alternativeData.subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {/* Her unique app için bir kart oluştur */}
                    {Array.from(alternativeData.apps.values()).map((app) => {
                      // Bu app'e ait subscription'ı bul
                      const appSubscription = alternativeData.subscriptions.find(
                        (sub) => sub.appId === app.id
                      );
                      const isActiveSub = appSubscription && 
                        appSubscription.status === Status.Active && 
                        (!appSubscription.endAt || new Date(appSubscription.endAt) > new Date());
                      
                      return (
                        <div
                          key={app.id}
                          className={cn(
                            "rounded-lg border",
                            "bg-neutral-800/30",
                            isActiveSub
                              ? "border-emerald-500/30"
                              : "border-neutral-700/30"
                          )}
                        >
                          {/* Uygulama Başlığı */}
                          <div className="p-3 border-b border-neutral-700/30">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn("font-semibold text-sm", text.primary)}>
                                    {app.name}
                                  </span>
                                  {isActiveSub && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                      Aktif Abonelik
                                    </span>
                                  )}
                                </div>
                                <div className={cn("text-xs", text.muted)}>
                                  Uygulama Kodu: {app.code}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Abonelik Bilgileri */}
                          <div className="p-3">
                            {appSubscription ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={cn("font-medium text-sm mb-1", text.secondary)}>
                                      {appSubscription.plan?.name || "Plan bilgisi yüklenemedi"}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap mt-2">
                                      {appSubscription.plan && (
                                        <>
                                          <span className={cn("flex items-center gap-1 text-xs", text.muted)}>
                                            <Calendar className="w-3 h-3" />
                                            {appSubscription.plan.billingPeriod === 3 ? "Aylık" : 
                                             appSubscription.plan.billingPeriod === 4 ? "Yıllık" :
                                             appSubscription.plan.billingPeriod === 2 ? "Haftalık" :
                                             appSubscription.plan.billingPeriod === 1 ? "Günlük" : "Tek seferlik"}
                                          </span>
                                          {appSubscription.prices && appSubscription.prices.length > 0 && (
                                            <span className={cn("font-medium text-xs", text.secondary)}>
                                              {formatCurrency(appSubscription.prices[0].amount, appSubscription.prices[0].currency)}
                                            </span>
                                          )}
                                          {appSubscription.plan.isFree && (
                                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-medium">
                                              Ücretsiz Plan
                                            </span>
                                          )}
                                          {appSubscription.plan.trialDays > 0 && (
                                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
                                              {appSubscription.plan.trialDays} gün deneme
                                            </span>
                                          )}
                                          {!isActiveSub && (
                                            <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-xs font-medium">
                                              Pasif
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <div className={cn("text-xs mt-2", text.muted)}>
                                      Başlangıç: {formatDate(appSubscription.startAt)}
                                      {appSubscription.endAt && ` • Bitiş: ${formatDate(appSubscription.endAt)}`}
                                      {!appSubscription.endAt && isActiveSub && (
                                        ` • ${calculateDaysBetween(appSubscription.startAt, appSubscription.endAt)} gündür aktif`
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={cn("text-xs text-center py-2 italic", text.muted)}>
                                <div className="flex items-center gap-2 justify-center">
                                  <XCircle className="w-4 h-4" />
                                  <span>Bu uygulamaya abone değil</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={cn("text-xs text-center py-2 italic", text.muted)}>
                    Bu kullanıcının aktif veya geçmiş aboneliği bulunmuyor
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={cn("text-sm text-center py-4", text.muted)}>
              <div className="mb-2">Bu kullanıcı için veri bulunamadı</div>
              <div className="text-xs">
                {loading ? "Yükleniyor..." : "Kullanıcının kayıt olduğu uygulama veya aboneliği bulunmuyor. Lütfen browser console'u kontrol edin (F12)"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/50">
        <Link
          href={`/users/${user.userId}`}
          className={cn(
            components.buttonSecondary,
            "px-3 py-2 text-xs sm:text-sm",
            "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
            "transition-all duration-200",
            "flex items-center gap-1.5"
          )}
          title="Detayları Görüntüle"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Detaylar</span>
        </Link>

        {!isActive ? (
          <button
            onClick={onActivate}
            disabled={isPending}
            className={cn(
              components.buttonSecondary,
              "flex-1 px-3 py-2 text-xs sm:text-sm",
              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
              "transition-all duration-200",
              isPending && "opacity-50 cursor-not-allowed"
            )}
            title="Aktif Et"
          >
            <CheckCircle2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Aktif Et</span>
          </button>
        ) : (
          <button
            onClick={onUnapprove}
            disabled={isPending}
            className={cn(
              components.buttonSecondary,
              "flex-1 px-3 py-2 text-xs sm:text-sm",
              "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
              "transition-all duration-200",
              isPending && "opacity-50 cursor-not-allowed"
            )}
            title="Pasife Al"
          >
            <XCircle className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Pasife Al</span>
          </button>
        )}

        <button
          onClick={onDelete}
          disabled={isPending}
          className={cn(
            components.buttonSecondary,
            "px-3 py-2 text-xs sm:text-sm",
            "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
            "transition-all duration-200",
            isPending && "opacity-50 cursor-not-allowed"
          )}
          title="Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

export default function UsersListClient({ 
  users, 
  searchQuery,
  pagination 
}: { 
  users: UserDto[]; 
  searchQuery: string;
  pagination: PaginationInfo;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; email: string } | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    setPendingId(id);
    startTransition(() => deleteUserAction(id));
  };

  const handleActivate = (id: string) => {
    setPendingId(id);
    startTransition(() => activateUserAction(id));
  };

  const handleUnapprove = (id: string) => {
    setPendingId(id);
    startTransition(() => unapproveUserAction(id));
  };

  if (users.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 sm:py-16 px-4",
        bg.card,
        "border",
        "rounded-2xl"
      )}>
        <div className="max-w-md mx-auto">
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            bg.button
          )}>
            <User className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery
              ? "Arama kriterlerinize uygun kullanıcı bulunamadı"
              : "Henüz kullanıcı yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard
              key={user.userId}
            user={user}
            isPending={pendingId === user.userId}
            onDelete={() => setShowDeleteDialog({ id: user.userId, email: user.email })}
            onActivate={() => handleActivate(user.userId)}
            onUnapprove={() => handleUnapprove(user.userId)}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Kullanıcıyı Sil"
          message={`"${showDeleteDialog.email}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
          onConfirm={() => {
            handleDelete(showDeleteDialog.id);
            setShowDeleteDialog(null);
          }}
          onCancel={() => setShowDeleteDialog(null)}
        />
      )}
    </>
  );
}

