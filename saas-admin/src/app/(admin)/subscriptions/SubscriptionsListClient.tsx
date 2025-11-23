"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { SubscriptionDto } from "@/types/subscription";
import type { AppDto } from "@/types/app";
import type { PlanDto } from "@/types/plan";
import type { UserDto } from "@/types/user";
import type { SubscriptionItemDto } from "@/types/subscriptionItem";
import type { InvoiceDto, InvoiceLineDto } from "@/types/invoice";
import type { FeatureDto } from "@/types/feature";
import type { PlanPriceDto } from "@/types/planPrice";
import { Status, CurrencyCode, BillingPeriod } from "@/types/app";
import { RenewalPolicy } from "@/types/plan";
import { 
  ShoppingCart, Edit, ChevronDown, ChevronUp, 
  Users, Zap, TrendingUp, Calendar, FileText, Package, DollarSign
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getSubscriptionItems } from "@/lib/subscriptionItemsService";
import { getInvoicesByApp, getInvoiceLines } from "@/lib/invoicesService";
import { getAllFeatures } from "@/lib/featuresService";
import { getAllPlanPrices } from "@/lib/planPricesService";
import Pagination from "@/components/filters/Pagination";
import type { PaginationInfo } from "@/lib/filterUtils";

// Status değerini Türkçe label'a çeviren fonksiyon
function getStatusLabel(status: Status | number): string {
  const statusNum = typeof status === 'number' ? status : Number(status);
  
  switch (statusNum) {
    case Status.Active:
    case 1:
      return "Aktif";
    case Status.DeActive:
    case 2:
      return "Pasif";
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
    case Status.DeActive:
    case 2:
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/20",
        dot: "bg-orange-400"
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

// Renewal Policy label
function getRenewalPolicyLabel(policy: RenewalPolicy | number): string {
  const policyNum = typeof policy === 'number' ? policy : Number(policy);
  switch (policyNum) {
    case RenewalPolicy.None:
      return "Yok";
    case RenewalPolicy.Manual:
      return "Manuel";
    case RenewalPolicy.Auto:
      return "Otomatik";
    default:
      return "Bilinmeyen";
  }
}

// Billing Period label
function getBillingPeriodLabel(period: BillingPeriod | number): string {
  const periodNum = typeof period === 'number' ? period : Number(period);
  switch (periodNum) {
    case BillingPeriod.Monthly:
      return "Aylık";
    case BillingPeriod.Yearly:
      return "Yıllık";
    case BillingPeriod.Weekly:
      return "Haftalık";
    case BillingPeriod.Daily:
      return "Günlük";
    default:
      return "Bilinmeyen";
  }
}

// SubscriptionCard Component
function SubscriptionCard({
  subscription,
  app,
  plan,
  user,
}: {
  subscription: SubscriptionDto;
  app: AppDto | undefined;
  plan: PlanDto | undefined;
  user: UserDto | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionItemDto[]>([]);
  const [features, setFeatures] = useState<FeatureDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDto[]>([]);
  const [prices, setPrices] = useState<PlanPriceDto[]>([]);
  const hasLoadedRef = useRef(false);

  const statusStyles = getStatusStyles(subscription.status);
  const statusLabel = getStatusLabel(subscription.status);
  const isActive = !subscription.endAt || new Date(subscription.endAt) > new Date();

  // Detayları lazy load et
  useEffect(() => {
    if (!expanded) {
      hasLoadedRef.current = false;
      return;
    }
    
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    setLoading(true);
    
    Promise.all([
      getSubscriptionItems(subscription.id).catch(() => []),
      getAllFeatures().catch(() => []),
      getInvoicesByApp(subscription.appId).catch(() => []),
      getAllPlanPrices(plan?.id).catch(() => []),
    ])
      .then(async ([itemsData, featuresData, invoicesData, pricesData]) => {
        setSubscriptionItems(itemsData);
        setFeatures(featuresData);
        setPrices(pricesData);
        setInvoices(invoicesData.filter(inv => 
          inv.userId === subscription.userId && 
          inv.appId === subscription.appId
        ).slice(0, 10));
        
        // Invoice line'ları çek
        const allInvoiceLines: InvoiceLineDto[] = [];
        for (const invoice of invoicesData.filter(inv => 
          inv.userId === subscription.userId && 
          inv.appId === subscription.appId
        ).slice(0, 10)) {
          try {
            const lines = await getInvoiceLines(invoice.id);
            allInvoiceLines.push(...lines.filter(line => 
              line.planId === subscription.planId
            ));
          } catch {}
        }
        setInvoiceLines(allInvoiceLines);
        
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [expanded, subscription.id, subscription.appId, subscription.userId, subscription.planId, plan?.id]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatCurrency = (amount: number | null | undefined, currency: CurrencyCode | number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "-";
    }
    const currencyNum = typeof currency === 'number' ? currency : (currency ? Number(currency) : CurrencyCode.TRY);
    const currencySymbol = 
      currencyNum === CurrencyCode.TRY ? "₺" : 
      currencyNum === CurrencyCode.USD ? "$" : 
      currencyNum === CurrencyCode.EUR ? "€" : 
      currencyNum === CurrencyCode.GBP ? "£" : "";
    return `${currencySymbol}${Number(amount).toFixed(2)}`;
  };

  // Kalan gün hesaplama
  const getDaysRemaining = (): number | null => {
    if (subscription.endAt) {
      const end = new Date(subscription.endAt);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    if (subscription.renewAt) {
      const renew = new Date(subscription.renewAt);
      const now = new Date();
      const diff = renew.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();
  const currentPrice = prices.find(p => p.isCurrent);

  // Subscription item'ları feature'larla eşleştir
  const itemsWithFeatures = subscriptionItems.map(item => {
    const feature = features.find(f => f.id === item.featureId);
    return { item, feature };
  });

  // Toplam ödeme
  const totalPaid = invoiceLines.reduce((sum, line) => sum + (line.amount || 0), 0);
  const subscriptionInvoices = invoices.filter(inv => 
    inv.userId === subscription.userId && 
    inv.appId === subscription.appId
  );

  return (
    <article
      className={cn(
        components.card,
        "p-5 sm:p-6",
        "flex flex-col gap-4"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* App ve Plan Bilgisi */}
          <div className="mb-2">
            <div className={cn("text-xs mb-1", text.muted)}>
              {app?.name} ({app?.code})
            </div>
            <h3 className={cn("text-lg font-bold mb-1 truncate", text.primary)}>
              {plan?.name || "Plan Bilinmiyor"}
            </h3>
            <div className={cn("text-sm", text.secondary)}>
              {user?.email || user?.userName || "Kullanıcı Bilinmiyor"}
            </div>
          </div>

          {/* Status ve Policy */}
          <div className="flex items-center gap-2 flex-wrap">
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
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-md bg-neutral-700/50 text-neutral-300"
            )}>
              {getRenewalPolicyLabel(subscription.renewalPolicy)}
            </span>
            {plan && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-md bg-neutral-700/50 text-neutral-300"
              )}>
                {getBillingPeriodLabel(plan.billingPeriod)}
              </span>
            )}
            {daysRemaining !== null && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-md",
                daysRemaining <= 0 ? "bg-red-500/10 text-red-400" :
                daysRemaining <= 2 ? "bg-orange-500/10 text-orange-400" :
                daysRemaining <= 7 ? "bg-yellow-500/10 text-yellow-400" :
                "bg-neutral-700/50 text-neutral-300"
              )}>
                {daysRemaining <= 0 
                  ? "Süresi Dolmuş" 
                  : daysRemaining === 1 
                    ? "1 gün kaldı" 
                    : `${daysRemaining} gün kaldı`}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/subscriptions/${subscription.id}`}
          className={cn(
            "p-2 rounded-lg",
            "bg-neutral-800/50 hover:bg-neutral-800/70",
            "border border-neutral-700/50 hover:border-blue-500/50",
            "text-neutral-400 hover:text-blue-400",
            "transition-all duration-200",
            "flex items-center justify-center",
            "flex-shrink-0"
          )}
          title="Aboneliği düzenle"
        >
          <Edit className="w-4 h-4" />
        </Link>
      </div>

      {/* Tarih Bilgileri */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <div>
          <span className={cn(text.muted)}>Başlangıç: </span>
          <span className={text.secondary}>{formatDate(subscription.startAt)}</span>
        </div>
        {subscription.endAt && (
          <div>
            <span className={cn(text.muted)}>Bitiş: </span>
            <span className={text.secondary}>{formatDate(subscription.endAt)}</span>
          </div>
        )}
        {subscription.renewAt && (
          <div>
            <span className={cn(text.muted)}>Yenileme: </span>
            <span className={text.secondary}>{formatDate(subscription.renewAt)}</span>
          </div>
        )}
      </div>

      {/* Fiyat Bilgisi */}
      {currentPrice && (
        <div className={cn("text-sm", text.secondary)}>
          <DollarSign className="w-4 h-4 inline mr-1" />
          <span className={text.muted}>Fiyat: </span>
          <span className="font-semibold">
            {formatCurrency(currentPrice.amount, currentPrice.currency)}
          </span>
          <span className={cn("text-xs ml-1", text.muted)}>
            / {getBillingPeriodLabel(plan?.billingPeriod || BillingPeriod.Monthly)}
          </span>
        </div>
      )}

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
          <ShoppingCart className="w-4 h-4" />
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
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-emerald-400")}>Özellikler</div>
                  <div className={cn("text-xl font-bold text-emerald-400")}>
                    {subscriptionItems.length}
                  </div>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-blue-400")}>Faturalar</div>
                  <div className={cn("text-xl font-bold text-blue-400")}>
                    {subscriptionInvoices.length}
                  </div>
                </div>
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-purple-400")}>Toplam Ödeme</div>
                  <div className={cn("text-xl font-bold text-purple-400")}>
                    {formatCurrency(totalPaid, currentPrice?.currency || CurrencyCode.TRY)}
                  </div>
                </div>
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-orange-400")}>Fiyat</div>
                  <div className={cn("text-xl font-bold text-orange-400")}>
                    {currentPrice ? formatCurrency(currentPrice.amount, currentPrice.currency) : "-"}
                  </div>
                </div>
              </div>

              {/* Subscription Items (Feature Limits) */}
              {itemsWithFeatures.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Zap className="w-4 h-4" />
                    Özellik Limitleri ve Kullanımları ({itemsWithFeatures.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {itemsWithFeatures.map(({ item, feature }) => {
                      if (!feature) return null;
                      const usagePercent = item.allotted && item.allotted > 0 
                        ? Math.min(100, (item.used / item.allotted) * 100)
                        : 0;
                      return (
                        <div key={item.id} className={cn("rounded-lg border p-3 bg-neutral-800/50", "border-neutral-700/30")}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              {feature.name || feature.key}
                            </div>
                            {item.allotted && item.allotted > 0 && (
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                usagePercent >= 90 ? "bg-red-500/10 text-red-400" :
                                usagePercent >= 70 ? "bg-orange-500/10 text-orange-400" :
                                "bg-emerald-500/10 text-emerald-400"
                              )}>
                                %{usagePercent.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={text.muted}>Kullanılan:</span>
                              <span className={text.secondary}>
                                {item.used.toFixed(2)} {feature.unit}
                              </span>
                            </div>
                            {item.allotted && item.allotted > 0 ? (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className={text.muted}>Limit:</span>
                                  <span className={text.secondary}>
                                    {item.allotted.toFixed(2)} {feature.unit}
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-700/30 rounded-full h-1.5 overflow-hidden mt-1">
                                  <div 
                                    className={cn(
                                      "h-full transition-all",
                                      usagePercent >= 90 ? "bg-red-500" :
                                      usagePercent >= 70 ? "bg-orange-500" :
                                      usagePercent >= 50 ? "bg-yellow-500" :
                                      "bg-emerald-500"
                                    )}
                                    style={{ width: `${usagePercent}%` }}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className={cn("text-xs", text.muted)}>
                                Sınırsız kullanım
                              </div>
                            )}
                            {item.resetsAt && (
                              <div className={cn("text-xs mt-1", text.muted)}>
                                Sıfırlanma: {formatDate(item.resetsAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {subscriptionInvoices.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <FileText className="w-4 h-4" />
                    Faturalar ({subscriptionInvoices.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subscriptionInvoices.map((invoice) => {
                      const invoiceTotal = invoiceLines
                        .filter(line => line.invoiceId === invoice.id)
                        .reduce((sum, line) => sum + (line.amount || 0), 0);
                      const displayAmount = invoiceTotal > 0 ? invoiceTotal : (invoice.total || 0);
                      return (
                        <div key={invoice.id} className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          "border-neutral-700/30"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              Fatura #{invoice.autoID}
                            </div>
                            <span className={cn("text-sm font-bold", text.primary)}>
                              {formatCurrency(displayAmount, invoice.currency)}
                            </span>
                          </div>
                          <div className={cn("text-xs", text.muted)}>
                            {formatDate(invoice.createdDate)} • 
                            {invoice.status === Status.Active ? " Ödendi" : " Beklemede"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Plan Details */}
              {plan && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Package className="w-4 h-4" />
                    Plan Detayları
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={cn(text.muted)}>Plan Kodu: </span>
                      <span className={text.secondary}>{plan.code}</span>
                    </div>
                    <div>
                      <span className={cn(text.muted)}>Faturalama: </span>
                      <span className={text.secondary}>{getBillingPeriodLabel(plan.billingPeriod)}</span>
                    </div>
                    {plan.trialDays > 0 && (
                      <div>
                        <span className={cn(text.muted)}>Deneme Süresi: </span>
                        <span className={text.secondary}>{plan.trialDays} gün</span>
                      </div>
                    )}
                    <div>
                      <span className={cn(text.muted)}>Ücretsiz Plan: </span>
                      <span className={text.secondary}>{plan.isFree ? "Evet" : "Hayır"}</span>
                    </div>
                    {plan.description && (
                      <div className="sm:col-span-2">
                        <span className={cn(text.muted)}>Açıklama: </span>
                        <span className={text.secondary}>{plan.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default function SubscriptionsListClient({ 
  subscriptions, 
  apps, 
  plans, 
  users,
  searchQuery,
  appId,
  userId,
  pagination
}: { 
  subscriptions: SubscriptionDto[];
  apps: AppDto[];
  plans: PlanDto[];
  users: UserDto[];
  searchQuery: string;
  appId?: string;
  userId?: string;
  pagination: PaginationInfo;
}) {
  if (subscriptions.length === 0) {
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
            <ShoppingCart className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId || userId
              ? "Arama kriterlerinize uygun abonelik bulunamadı"
              : "Henüz abonelik yok"}
          </h3>
          <p className={cn("text-sm mb-6", text.muted)}>
            {searchQuery || appId || userId
              ? "Farklı arama terimleri deneyin veya filtreleri temizleyin"
              : "İlk aboneliğinizi oluşturmak için yukarıdaki butona tıklayın"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subscriptions.map((subscription) => {
        const app = apps.find(a => a.id === subscription.appId);
        const plan = plans.find(p => p.id === subscription.planId);
        const user = users.find(u => u.userId === subscription.userId);
        return (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            app={app}
            plan={plan}
            user={user}
          />
        );
      })}
    </div>
  );
}
