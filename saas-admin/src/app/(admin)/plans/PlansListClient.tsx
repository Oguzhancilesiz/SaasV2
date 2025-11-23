"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { PlanDto } from "@/types/plan";
import type { AppDto } from "@/types/app";
import type { PlanPriceDto } from "@/types/planPrice";
import type { PlanFeatureDto } from "@/lib/planFeaturesService";
import type { SubscriptionDto } from "@/types/subscription";
import type { FeatureDto } from "@/types/feature";
import { Status, CurrencyCode, BillingPeriod } from "@/types/app";
import { RenewalPolicy } from "@/types/plan";
import { 
  Package, Edit, Eye, EyeOff, DollarSign, ChevronDown, ChevronUp, 
  Users, Zap, TrendingUp, Calendar, FileText, AppWindow
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getAllPlanPrices } from "@/lib/planPricesService";
import { getAllPlanFeatures } from "@/lib/planFeaturesService";
import { getAllSubscriptions } from "@/lib/subscriptionsService";
import { getAllFeatures } from "@/lib/featuresService";
import { getInvoicesByApp } from "@/lib/invoicesService";
import { getInvoiceLines } from "@/lib/invoicesService";
import { getSubscriptionItems } from "@/lib/subscriptionItemsService";
import { getAllUsers } from "@/lib/usersService";
import type { InvoiceDto, InvoiceLineDto } from "@/types/invoice";
import type { SubscriptionItemDto } from "@/types/subscriptionItem";
import type { UserDto } from "@/types/user";
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

// PlanCard Component
function PlanCard({
  plan,
  app,
}: {
  plan: PlanDto;
  app: AppDto | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<PlanPriceDto[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureDto[]>([]);
  const [features, setFeatures] = useState<FeatureDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDto[]>([]);
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionItemDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const hasLoadedRef = useRef(false);

  const statusNum = Number(plan.status);
  const statusStyles = getStatusStyles(plan.status);
  const statusLabel = getStatusLabel(plan.status);

  // Dashboard bilgilerini lazy load et
  useEffect(() => {
    if (!expanded) {
      hasLoadedRef.current = false;
      return;
    }
    
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    setLoading(true);
    
    Promise.all([
      getAllPlanPrices(plan.id),
      getAllPlanFeatures(plan.id),
      getAllFeatures(),
      getAllSubscriptions(plan.appId).then(subs => subs.filter(s => s.planId === plan.id)),
      getInvoicesByApp(plan.appId).catch(() => []),
      getAllUsers().catch(() => []),
    ])
      .then(async ([pricesData, planFeaturesData, featuresData, subsData, invoicesData, usersData]) => {
        setPrices(pricesData);
        setPlanFeatures(planFeaturesData);
        setFeatures(featuresData);
        setSubscriptions(subsData);
        setUsers(usersData);
        setInvoices(invoicesData.slice(0, 10)); // Daha fazla invoice al
        
        // Invoice line'ları çek ve plan bazında filtrele
        const allInvoiceLines: InvoiceLineDto[] = [];
        for (const invoice of invoicesData) {
          try {
            const lines = await getInvoiceLines(invoice.id);
            allInvoiceLines.push(...lines.filter(line => line.planId === plan.id));
          } catch {}
        }
        setInvoiceLines(allInvoiceLines);
        
        // Subscription item'ları çek
        const allSubscriptionItems: SubscriptionItemDto[] = [];
        for (const sub of subsData) {
          try {
            const items = await getSubscriptionItems(sub.id);
            allSubscriptionItems.push(...items);
          } catch {}
        }
        setSubscriptionItems(allSubscriptionItems);
        
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [expanded, plan.id, plan.appId]);

  const formatCurrency = (amount: number | null, currency: string | number | null): string => {
    if (!amount) return "Ücretsiz";
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

  const getBillingPeriodLabel = (period: number): string => {
    switch (period) {
      case BillingPeriod.OneTime: return "Tek Seferlik";
      case BillingPeriod.Daily: return "Günlük";
      case BillingPeriod.Weekly: return "Haftalık";
      case BillingPeriod.Monthly: return "Aylık";
      case BillingPeriod.Yearly: return "Yıllık";
      default: return String(period);
    }
  };

  const getRenewalPolicyLabel = (policy: number): string => {
    switch (policy) {
      case RenewalPolicy.None: return "Yok";
      case RenewalPolicy.Manual: return "Manuel";
      case RenewalPolicy.Auto: return "Otomatik";
      default: return String(policy);
    }
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === Status.Active).length;
  const cancelledSubscriptions = subscriptions.filter(s => s.status === Status.Cancel).length;
  const currentPrice = prices.find(p => p.isCurrent && p.status === Status.Active);
  const allPrices = prices
    .filter(p => p.status === Status.Active)
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());
  
  // Gelir istatistikleri (plan bazında invoice line'lardan)
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const planInvoiceLines = invoiceLines.filter(line => line.planId === plan.id);
  const totalRevenue = planInvoiceLines.reduce((sum, line) => sum + line.amount, 0);
  const revenue30 = planInvoiceLines
    .filter(line => new Date(line.createdDate) >= since30)
    .reduce((sum, line) => sum + line.amount, 0);
  const revenue7 = planInvoiceLines
    .filter(line => new Date(line.createdDate) >= since7)
    .reduce((sum, line) => sum + line.amount, 0);
  
  // Plan'a abone olan kullanıcılar
  const planUsers = subscriptions
    .map(sub => users.find(u => u.userId === sub.userId))
    .filter((u): u is UserDto => u !== undefined);
  const uniqueUsers = Array.from(new Map(planUsers.map(u => [u.userId, u])).values());
  
  // Feature kullanım istatistikleri
  const featureUsageStats = subscriptionItems.reduce((acc, item) => {
    const feature = features.find(f => f.id === item.featureId);
    if (!feature) return acc;
    
    if (!acc[feature.id]) {
      acc[feature.id] = {
        feature,
        totalUsed: 0,
        totalAllotted: 0,
        subscriptionCount: 0,
      };
    }
    acc[feature.id].totalUsed += item.used;
    acc[feature.id].totalAllotted += (item.allotted || 0);
    acc[feature.id].subscriptionCount += 1;
    return acc;
  }, {} as Record<string, { feature: FeatureDto; totalUsed: number; totalAllotted: number; subscriptionCount: number }>);
  
  const featureUsageArray = Object.values(featureUsageStats);

  return (
    <article
      className={cn(
        components.card,
        "p-5 sm:p-6",
        "flex flex-col gap-4",
        "hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
      )}
    >
      {/* App Header - En Üst */}
      {app && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-blue-500/10 border border-blue-500/20",
          "mb-2"
        )}>
          <AppWindow className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className={cn("text-sm font-semibold truncate", text.primary)}>
              {app.name}
            </div>
            <div className={cn("text-xs font-mono truncate", text.muted)}>
              {app.code}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br from-purple-500/20 to-blue-500/20",
            "border border-purple-500/30"
          )}>
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-lg font-bold mb-0.5 truncate", text.primary)}>
              {plan.name}
            </h3>
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
                "font-mono text-xs px-2 py-0.5 rounded-md",
                bg.button,
                text.tertiary,
                border.default,
                "border"
              )}>
                {plan.code}
              </span>
              {plan.isFree && (
                <span className={cn("text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20")}>
                  Ücretsiz
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/plans/${plan.id}`}
          className={cn(
            "p-2 rounded-lg",
            "bg-neutral-800/50 hover:bg-neutral-800/70",
            "border border-neutral-700/50 hover:border-blue-500/50",
            "text-neutral-400 hover:text-blue-400",
            "transition-all duration-200",
            "flex items-center justify-center",
            "flex-shrink-0"
          )}
          title="Planı düzenle"
        >
          <Edit className="w-4 h-4" />
        </Link>
      </div>

      {/* Description */}
      {plan.description && (
        <p className={cn("text-sm line-clamp-2 leading-relaxed", text.muted)}>
          {plan.description}
        </p>
      )}

      {/* Plan Info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <div className={cn("text-xs mb-1 text-blue-400")}>Faturalama</div>
          <div className={cn("text-sm font-bold text-blue-400")}>
            {getBillingPeriodLabel(plan.billingPeriod)}
          </div>
        </div>
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
          <div className={cn("text-xs mb-1 text-purple-400")}>Yenileme</div>
          <div className={cn("text-sm font-bold text-purple-400")}>
            {getRenewalPolicyLabel(plan.renewalPolicy)}
          </div>
        </div>
        {plan.trialDays > 0 && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <div className={cn("text-xs mb-1 text-orange-400")}>Deneme</div>
            <div className={cn("text-sm font-bold text-orange-400")}>
              {plan.trialDays} gün
            </div>
          </div>
        )}
      </div>

      {/* Current Price */}
      {currentPrice && (
        <div className={cn(
          "p-3 rounded-lg",
          "bg-gradient-to-r from-emerald-500/10 to-blue-500/10",
          "border border-emerald-500/20"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className={cn("text-xs font-medium", text.muted)}>Güncel Fiyat</div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              Aktif
            </span>
          </div>
          <div className={cn("text-lg font-bold mb-1", text.primary)}>
            {formatCurrency(currentPrice.amount, currentPrice.currency)}
          </div>
          <div className={cn("text-xs", text.muted)}>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(currentPrice.effectiveFrom)} - {currentPrice.effectiveTo ? formatDate(currentPrice.effectiveTo) : "Süresiz"}</span>
            </div>
          </div>
          {allPrices.length > 1 && (
            <div className={cn("text-xs mt-2 pt-2 border-t border-emerald-500/20", text.muted)}>
              {allPrices.length - 1} eski fiyat daha var
            </div>
          )}
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
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-green-400")}>Abonelik</div>
                  <div className={cn("text-xl font-bold text-green-400")}>
                    {subscriptions.length}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    {activeSubscriptions} aktif, {cancelledSubscriptions} iptal
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-emerald-400")}>Kullanıcı</div>
                  <div className={cn("text-xl font-bold text-emerald-400")}>
                    {uniqueUsers.length}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    Benzersiz kullanıcı
                  </div>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-blue-400")}>Fiyat</div>
                  <div className={cn("text-xl font-bold text-blue-400")}>
                    {prices.length}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    Fiyat geçmişi
                  </div>
                </div>
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-purple-400")}>Özellik</div>
                  <div className={cn("text-xl font-bold text-purple-400")}>
                    {planFeatures.length}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    Plan özellikleri
                  </div>
                </div>
              </div>

              {/* Revenue Statistics */}
              {totalRevenue > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Gelir İstatistikleri
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className={cn("text-xs mb-1", text.muted)}>Toplam Gelir</div>
                      <div className={cn("text-lg font-bold text-emerald-400")}>
                        {formatCurrency(totalRevenue, currentPrice?.currency || CurrencyCode.TRY)}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs mb-1", text.muted)}>Son 30 Gün</div>
                      <div className={cn("text-lg font-bold text-blue-400")}>
                        {formatCurrency(revenue30, currentPrice?.currency || CurrencyCode.TRY)}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs mb-1", text.muted)}>Son 7 Gün</div>
                      <div className={cn("text-lg font-bold text-purple-400")}>
                        {formatCurrency(revenue7, currentPrice?.currency || CurrencyCode.TRY)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscribed Users */}
              {uniqueUsers.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Users className="w-4 h-4" />
                    Abone Olan Kullanıcılar ({uniqueUsers.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {uniqueUsers.slice(0, 10).map((user) => {
                      const userSubs = subscriptions.filter(s => s.userId === user.userId);
                      const activeUserSubs = userSubs.filter(s => s.status === Status.Active).length;
                      return (
                        <div key={user.userId} className={cn("flex items-center justify-between text-sm p-2 rounded-lg bg-neutral-800/50", text.secondary)}>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{user.userName || user.email}</div>
                            <div className={cn("text-xs", text.muted)}>{user.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", activeUserSubs > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-700/50 text-neutral-400")}>
                              {activeUserSubs}/{userSubs.length} aktif
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {uniqueUsers.length > 10 && (
                      <div className={cn("text-xs text-center pt-2 border-t border-neutral-700/30", text.muted)}>
                        +{uniqueUsers.length - 10} kullanıcı daha...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feature Usage Statistics */}
              {featureUsageArray.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Zap className="w-4 h-4" />
                    Özellik Kullanım İstatistikleri ({featureUsageArray.length})
                  </h4>
                  <div className="space-y-2">
                    {featureUsageArray.map((stat) => {
                      const usagePercent = stat.totalAllotted > 0 
                        ? Math.min(100, (stat.totalUsed / stat.totalAllotted) * 100)
                        : 0;
                      return (
                        <div key={stat.feature.id} className={cn("rounded-lg border p-3 bg-neutral-800/50", "border-neutral-700/30")}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              {stat.feature.name || stat.feature.key}
                            </div>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400")}>
                              {stat.subscriptionCount} abonelik
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={text.muted}>Kullanılan:</span>
                              <span className={text.secondary}>
                                {stat.totalUsed.toFixed(2)} {stat.feature.unit}
                              </span>
                            </div>
                            {stat.totalAllotted > 0 ? (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className={text.muted}>Tahsis Edilen:</span>
                                  <span className={text.secondary}>
                                    {stat.totalAllotted.toFixed(2)} {stat.feature.unit}
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-700/30 rounded-full h-1.5 overflow-hidden">
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
                                <div className={cn("text-xs text-right", text.muted)}>
                                  %{usagePercent.toFixed(1)} kullanım
                                </div>
                              </>
                            ) : (
                              <div className={cn("text-xs", text.muted)}>
                                Sınırsız kullanım
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prices */}
              {allPrices.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <DollarSign className="w-4 h-4" />
                    Fiyat Geçmişi ({allPrices.length})
                  </h4>
                  <div className="space-y-2">
                    {allPrices.map((price, index) => {
                      const isCurrent = price.isCurrent;
                      const isOld = !isCurrent || index > 0;
                      return (
                        <div
                          key={price.id}
                          className={cn(
                            "rounded-lg border p-3",
                            "bg-neutral-800/30",
                            isCurrent 
                              ? "border-emerald-500/30 bg-emerald-500/5" 
                              : "border-neutral-700/30 opacity-75"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={cn("font-medium text-sm", isCurrent ? text.primary : text.muted)}>
                                  {formatCurrency(price.amount, price.currency)}
                                </div>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                                    Güncel
                                  </span>
                                )}
                                {isOld && (
                                  <span className="px-2 py-0.5 rounded-full bg-neutral-700/50 text-neutral-400 text-xs font-medium">
                                    Eski
                                  </span>
                                )}
                              </div>
                              <div className={cn("text-xs", text.muted)}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Başlangıç: {formatDate(price.effectiveFrom)}</span>
                                </div>
                                {price.effectiveTo && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>Bitiş: {formatDate(price.effectiveTo)}</span>
                                  </div>
                                )}
                                {!price.effectiveTo && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>Bitiş: Süresiz</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Plan Features */}
              {planFeatures.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Zap className="w-4 h-4" />
                    Özellik Limitleri ({planFeatures.length})
                  </h4>
                  <div className="space-y-2">
                    {planFeatures.map((pf) => {
                      const feature = features.find(f => f.id === pf.featureId);
                      return (
                        <div
                          key={pf.id}
                          className={cn(
                            "rounded-lg border p-3",
                            "bg-neutral-800/30",
                            "border-neutral-700/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={cn("font-medium text-sm", text.secondary)}>
                                {feature?.name || feature?.key || "Bilinmeyen Özellik"}
                              </div>
                              <div className={cn("text-xs mt-1", text.muted)}>
                                Limit: {pf.limit ?? "Sınırsız"} {feature?.unit || ""}
                                {pf.allowOverage && ` | Aşım: ${formatCurrency(pf.overusePrice, CurrencyCode.TRY)}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subscriptions */}
              {subscriptions.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Users className="w-4 h-4" />
                    Abonelikler ({subscriptions.length})
                  </h4>
                  <div className="space-y-2">
                    {subscriptions.slice(0, 5).map((sub) => (
                      <div
                        key={sub.id}
                        className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          sub.status === Status.Active ? "border-green-500/30" : "border-neutral-700/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              Abonelik #{sub.id.slice(0, 8)}
                            </div>
                            <div className={cn("text-xs mt-1", text.muted)}>
                              Başlangıç: {formatDate(sub.startAt)} | Bitiş: {formatDate(sub.endAt)}
                            </div>
                          </div>
                          {sub.status === Status.Active && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {subscriptions.length > 5 && (
                      <p className={cn("text-xs text-center", text.muted)}>
                        +{subscriptions.length - 5} abonelik daha
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Invoice Lines */}
              {planInvoiceLines.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <FileText className="w-4 h-4" />
                    Plan Fatura Detayları ({planInvoiceLines.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {planInvoiceLines.slice(0, 10).map((line) => {
                      const invoice = invoices.find(inv => inv.id === line.invoiceId);
                      return (
                        <div key={line.id} className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          "border-neutral-700/30"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              {line.description || "Fatura Kalemi"}
                            </div>
                            <span className={cn("text-sm font-bold", text.primary)}>
                              {formatCurrency(line.amount, invoice?.currency || CurrencyCode.TRY)}
                            </span>
                          </div>
                          <div className={cn("text-xs", text.muted)}>
                            {invoice && (
                              <>
                                Fatura #{invoice.autoID} • 
                                {formatCurrency(line.unitPrice, invoice.currency)} × {line.quantity} • 
                                {formatDate(invoice.createdDate)}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {planInvoiceLines.length > 10 && (
                      <div className={cn("text-xs text-center pt-2 border-t border-neutral-700/30", text.muted)}>
                        +{planInvoiceLines.length - 10} kalem daha...
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

export default function PlansListClient({ 
  plans, 
  apps, 
  searchQuery, 
  appId,
  pagination
}: { 
  plans: PlanDto[]; 
  apps: AppDto[]; 
  searchQuery: string;
  appId?: string;
  pagination: PaginationInfo;
}) {
  if (plans.length === 0) {
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
            <Package className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId
              ? "Arama kriterlerinize uygun plan bulunamadı"
              : "Henüz plan yok"}
          </h3>
          <p className={cn("text-sm mb-6", text.muted)}>
            {searchQuery || appId
              ? "Farklı arama terimleri deneyin veya filtreleri temizleyin"
              : "İlk planınızı oluşturmak için yukarıdaki butona tıklayın"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const app = apps.find(a => a.id === plan.appId);
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              app={app}
            />
          );
        })}
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
    </>
  );
}
