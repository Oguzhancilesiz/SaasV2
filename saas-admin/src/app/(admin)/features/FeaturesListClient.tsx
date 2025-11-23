"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { FeatureDto } from "@/types/feature";
import type { AppDto } from "@/types/app";
import type { PlanDto } from "@/types/plan";
import type { PlanFeatureDto } from "@/lib/planFeaturesService";
import type { SubscriptionItemDto } from "@/types/subscriptionItem";
import { Status, CurrencyCode } from "@/types/app";
import { 
  Zap, Edit, ChevronDown, ChevronUp, 
  Package, Users, TrendingUp, AppWindow, FileText
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getAllPlanFeatures } from "@/lib/planFeaturesService";
import { getAllPlans } from "@/lib/plansService";
import { getAllSubscriptions } from "@/lib/subscriptionsService";
import { getSubscriptionItems } from "@/lib/subscriptionItemsService";
import { getInvoicesByApp, getInvoiceLines } from "@/lib/invoicesService";
import { getAllUsers } from "@/lib/usersService";
import type { InvoiceDto, InvoiceLineDto } from "@/types/invoice";
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

// FeatureCard Component
function FeatureCard({
  feature,
  app,
}: {
  feature: FeatureDto;
  app: AppDto | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [subscriptionItems, setSubscriptionItems] = useState<SubscriptionItemDto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const hasLoadedRef = useRef(false);

  const statusStyles = getStatusStyles(feature.status);
  const statusLabel = getStatusLabel(feature.status);

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
      getAllPlanFeatures(undefined, feature.id), // Feature'a ait plan features
      getAllPlans(feature.appId), // App'e ait planlar
      getAllSubscriptions(feature.appId).catch(() => []), // App'e ait abonelikler
      getInvoicesByApp(feature.appId).catch(() => []), // App'e ait faturalar
      getAllUsers().catch(() => []), // Tüm kullanıcılar
    ])
      .then(async ([planFeaturesData, plansData, subsData, invoicesData, usersData]) => {
        setPlanFeatures(planFeaturesData);
        setPlans(plansData);
        setUsers(usersData);
        setInvoices(invoicesData.slice(0, 10)); // Daha fazla invoice al
        
        // Subscription item'ları çek
        const allSubscriptionItems: SubscriptionItemDto[] = [];
        for (const sub of subsData) {
          try {
            const items = await getSubscriptionItems(sub.id);
            allSubscriptionItems.push(...items.filter(item => item.featureId === feature.id));
          } catch {}
        }
        setSubscriptionItems(allSubscriptionItems);
        
        // Invoice line'ları çek ve feature bazında filtrele
        const allInvoiceLines: InvoiceLineDto[] = [];
        for (const invoice of invoicesData) {
          try {
            const lines = await getInvoiceLines(invoice.id);
            allInvoiceLines.push(...lines.filter(line => line.featureId === feature.id));
          } catch {}
        }
        setInvoiceLines(allInvoiceLines);
        
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [expanded, feature.id, feature.appId]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatCurrency = (amount: number, currency: CurrencyCode | number): string => {
    const currencyNum = typeof currency === 'number' ? currency : Number(currency);
    const currencySymbol = 
      currencyNum === CurrencyCode.TRY ? "₺" : 
      currencyNum === CurrencyCode.USD ? "$" : 
      currencyNum === CurrencyCode.EUR ? "€" : 
      currencyNum === CurrencyCode.GBP ? "£" : "";
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  // Plan'larda kullanım istatistikleri - subscription'ları plan'a göre filtrele
  const planUsageStats = planFeatures.reduce((acc, pf) => {
    const plan = plans.find(p => p.id === pf.planId);
    if (!plan) return acc;
    
    // Bu plan'a ait subscription item'ları bul
    const planSubscriptionItems = subscriptionItems; // Tüm item'lar zaten feature'a göre filtrelenmiş
    
    if (!acc[plan.id]) {
      acc[plan.id] = {
        plan,
        planFeature: pf,
        subscriptionCount: planSubscriptionItems.length,
        totalUsed: planSubscriptionItems.reduce((sum, item) => sum + item.used, 0),
        totalAllotted: planSubscriptionItems.reduce((sum, item) => sum + (item.allotted || 0), 0),
      };
    }
    
    return acc;
  }, {} as Record<string, { plan: PlanDto; planFeature: PlanFeatureDto; subscriptionCount: number; totalUsed: number; totalAllotted: number }>);

  const planUsageArray = Object.values(planUsageStats);
  
  // Toplam kullanım istatistikleri
  const totalUsed = subscriptionItems.reduce((sum, item) => sum + item.used, 0);
  const totalAllotted = subscriptionItems.reduce((sum, item) => sum + (item.allotted || 0), 0);
  const activeSubscriptions = subscriptionItems.length;
  
  // Feature bazında invoice lines
  const featureInvoiceLines = invoiceLines.filter(line => line.featureId === feature.id);
  const totalRevenue = featureInvoiceLines.reduce((sum, line) => sum + line.amount, 0);

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
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-lg font-bold mb-0.5 truncate", text.primary)}>
              {feature.name}
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
                {feature.key}
              </span>
              {feature.unit && (
                <span className={cn("text-xs px-2 py-0.5 rounded-md bg-neutral-700/50 text-neutral-300")}>
                  {feature.unit}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/features/${feature.id}`}
          className={cn(
            "p-2 rounded-lg",
            "bg-neutral-800/50 hover:bg-neutral-800/70",
            "border border-neutral-700/50 hover:border-blue-500/50",
            "text-neutral-400 hover:text-blue-400",
            "transition-all duration-200",
            "flex items-center justify-center",
            "flex-shrink-0"
          )}
          title="Özelliği düzenle"
        >
          <Edit className="w-4 h-4" />
        </Link>
      </div>

      {/* Description */}
      {feature.description && (
        <p className={cn("text-sm line-clamp-2 leading-relaxed", text.muted)}>
          {feature.description}
        </p>
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
          <Zap className="w-4 h-4" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-green-400")}>Planlar</div>
                  <div className={cn("text-xl font-bold text-green-400")}>
                    {planFeatures.length}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    Kullanılan plan sayısı
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-emerald-400")}>Abonelik</div>
                  <div className={cn("text-xl font-bold text-emerald-400")}>
                    {activeSubscriptions}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    Aktif kullanım
                  </div>
                </div>
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-blue-400")}>Kullanılan</div>
                  <div className={cn("text-xl font-bold text-blue-400")}>
                    {totalUsed.toFixed(2)}
                  </div>
                  <div className={cn("text-[10px] mt-0.5", text.muted)}>
                    {feature.unit || "birim"}
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              {planUsageArray.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Package className="w-4 h-4" />
                    Plan'larda Kullanım ({planUsageArray.length})
                  </h4>
                  <div className="space-y-2">
                    {planUsageArray.map((stat) => {
                      const usagePercent = stat.totalAllotted > 0 
                        ? Math.min(100, (stat.totalUsed / stat.totalAllotted) * 100)
                        : 0;
                      return (
                        <div key={stat.plan.id} className={cn("rounded-lg border p-3 bg-neutral-800/50", "border-neutral-700/30")}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              {stat.plan.name}
                            </div>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400")}>
                              {stat.subscriptionCount} abonelik
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={text.muted}>Limit:</span>
                              <span className={text.secondary}>
                                {stat.planFeature.limit ?? "Sınırsız"} {feature.unit}
                              </span>
                            </div>
                            {stat.totalAllotted > 0 ? (
                              <>
                                <div className="flex items-center justify-between text-xs">
                                  <span className={text.muted}>Kullanılan:</span>
                                  <span className={text.secondary}>
                                    {stat.totalUsed.toFixed(2)} {feature.unit}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className={text.muted}>Tahsis Edilen:</span>
                                  <span className={text.secondary}>
                                    {stat.totalAllotted.toFixed(2)} {feature.unit}
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
                                <div className={cn("text-xs text-right", text.muted)}>
                                  %{usagePercent.toFixed(1)} kullanım
                                </div>
                              </>
                            ) : (
                              <div className={cn("text-xs", text.muted)}>
                                Sınırsız kullanım
                              </div>
                            )}
                            {stat.planFeature.allowOverage && (
                              <div className={cn("text-xs mt-1", text.muted)}>
                                Aşım izni: {stat.planFeature.overusePrice ? `₺${stat.planFeature.overusePrice.toFixed(2)}` : "Ücretsiz"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Overall Usage Statistics */}
              {totalAllotted > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Toplam Kullanım İstatistikleri
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className={cn("text-xs mb-1", text.muted)}>Toplam Kullanılan</div>
                      <div className={cn("text-lg font-bold text-emerald-400")}>
                        {totalUsed.toFixed(2)} {feature.unit}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs mb-1", text.muted)}>Toplam Tahsis Edilen</div>
                      <div className={cn("text-lg font-bold text-blue-400")}>
                        {totalAllotted.toFixed(2)} {feature.unit}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-700/30 rounded-full h-2 overflow-hidden mt-3">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        (totalUsed / totalAllotted) >= 0.9 ? "bg-red-500" :
                        (totalUsed / totalAllotted) >= 0.7 ? "bg-orange-500" :
                        (totalUsed / totalAllotted) >= 0.5 ? "bg-yellow-500" :
                        "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, (totalUsed / totalAllotted) * 100)}%` }}
                    />
                  </div>
                  <div className={cn("text-xs text-right mt-1", text.muted)}>
                    %{((totalUsed / totalAllotted) * 100).toFixed(1)} genel kullanım
                  </div>
                </div>
              )}

              {/* Subscription Items Details */}
              {subscriptionItems.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Users className="w-4 h-4" />
                    Abonelik Kullanımları ({subscriptionItems.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subscriptionItems.slice(0, 10).map((item) => {
                      const usagePercent = item.allotted && item.allotted > 0 
                        ? Math.min(100, (item.used / item.allotted) * 100)
                        : 0;
                      return (
                        <div key={item.id} className={cn("rounded-lg border p-3 bg-neutral-800/50", "border-neutral-700/30")}>
                          <div className="flex items-center justify-between mb-2">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              Abonelik #{item.subscriptionId.slice(0, 8)}
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
                                  <span className={text.muted}>Tahsis Edilen:</span>
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
                    {subscriptionItems.length > 10 && (
                      <div className={cn("text-xs text-center pt-2 border-t border-neutral-700/30", text.muted)}>
                        +{subscriptionItems.length - 10} kullanım daha...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feature Invoice Lines */}
              {featureInvoiceLines.length > 0 && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <FileText className="w-4 h-4" />
                    Feature Fatura Detayları ({featureInvoiceLines.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {featureInvoiceLines.slice(0, 10).map((line) => {
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
                    {featureInvoiceLines.length > 10 && (
                      <div className={cn("text-xs text-center pt-2 border-t border-neutral-700/30", text.muted)}>
                        +{featureInvoiceLines.length - 10} kalem daha...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Revenue Statistics */}
              {totalRevenue > 0 && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Feature Gelir İstatistikleri
                  </h4>
                  <div>
                    <div className={cn("text-xs mb-1", text.muted)}>Toplam Gelir</div>
                    <div className={cn("text-lg font-bold text-blue-400")}>
                      {formatCurrency(totalRevenue, CurrencyCode.TRY)}
                    </div>
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

export default function FeaturesListClient({ 
  features, 
  apps, 
  searchQuery, 
  appId,
  pagination
}: { 
  features: FeatureDto[]; 
  apps: AppDto[]; 
  searchQuery: string;
  appId?: string;
  pagination: PaginationInfo;
}) {
  if (features.length === 0) {
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
            <Zap className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId
              ? "Arama kriterlerinize uygun özellik bulunamadı"
              : "Henüz özellik yok"}
          </h3>
          <p className={cn("text-sm mb-6", text.muted)}>
            {searchQuery || appId
              ? "Farklı arama terimleri deneyin veya filtreleri temizleyin"
              : "İlk özelliğinizi oluşturmak için yukarıdaki butona tıklayın"}
          </p>
          {!searchQuery && !appId && (
            <a
              href="/features/yeni"
              className={components.buttonPrimary}
            >
              <Zap className="w-4 h-4" />
              İlk Özelliği Oluştur
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => {
          const app = apps.find(a => a.id === feature.appId);
          return (
            <FeatureCard
              key={feature.id}
              feature={feature}
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

