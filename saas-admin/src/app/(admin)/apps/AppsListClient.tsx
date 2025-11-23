"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import type { AppDto } from "@/types/app";
import type { AppDashboardDto } from "@/types/dashboard";
import { Status, CurrencyCode, AppEnvironment } from "@/types/app";
import { Package, CreditCard, Calendar, ChevronDown, ChevronUp, Activity, FileText, Zap, Key, Webhook, Users, TrendingUp, DollarSign, Edit } from "lucide-react";
import Link from "next/link";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import Pagination from "@/components/filters/Pagination";
import type { PaginationInfo } from "@/lib/filterUtils";
import { getAppDashboard } from "@/lib/dashboardService";
import { getInvoicesByApp } from "@/lib/invoicesService";
import type { InvoiceDto } from "@/types/invoice";

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
    case Status.UnApproved:
    case 3:
      return "Onay Bekliyor";
    case Status.Deleted:
    case 4:
    case Status.Cancel:
    case 7:
      return "İptal";
    case Status.Approved:
    case 6:
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
    case Status.Commit:
    case 14:
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
    default:
      return {
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        border: "border-neutral-700/50",
        dot: "bg-neutral-500"
      };
  }
}

function getEnvironmentLabel(environment: AppEnvironment | number): string {
  const envValue = typeof environment === "number" ? environment : Number(environment);
  switch (envValue) {
    case AppEnvironment.Production:
      return "Production";
    case AppEnvironment.Sandbox:
      return "Sandbox";
    default:
      return `Env ${envValue}`;
  }
}

function getEnvironmentStyles(environment: AppEnvironment | number) {
  const envValue = typeof environment === "number" ? environment : Number(environment);
  switch (envValue) {
    case AppEnvironment.Production:
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-300",
        border: "border-blue-500/20",
      };
    case AppEnvironment.Sandbox:
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-300",
        border: "border-purple-500/20",
      };
    default:
      return {
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        border: "border-neutral-700/50",
      };
  }
}

// AppCard Component
function AppCard({
  app,
}: {
  app: AppDto;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dashboardData, setDashboardData] = useState<AppDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const hasLoadedRef = useRef(false);

  const statusNum = Number(app.status);
  const statusStyles = getStatusStyles(app.status);
  const statusLabel = getStatusLabel(app.status);

  const environmentLabel = getEnvironmentLabel(app.environment);
  const environmentStyles = getEnvironmentStyles(app.environment);

  // Dashboard bilgilerini lazy load et
  useEffect(() => {
    if (!expanded) {
      hasLoadedRef.current = false;
      return;
    }
    
    if (hasLoadedRef.current) return;
    if (dashboardData) return;
    
    hasLoadedRef.current = true;
    setLoading(true);
    
    Promise.all([
      getAppDashboard(app.id),
      getInvoicesByApp(app.id),
    ])
      .then(([data, invoicesData]) => {
        setDashboardData(data);
        setInvoices(invoicesData.slice(0, 5));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [expanded, app.id]);

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
      case 3: return "Aylık";
      case 4: return "Yıllık";
      case 2: return "Haftalık";
      case 1: return "Günlük";
      case 0: return "Tek seferlik";
      default: return String(period);
    }
  };

  // API Key bitiş tarihine kalan günü hesapla ve stil döndür
  const getApiKeyExpiryInfo = (expiresAt: string | null): { days: number | null; label: string; styles: { bg: string; text: string; border: string } } | null => {
    if (!expiresAt) return null;
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Geçmiş
      return {
        days: diffDays,
        label: "Süresi dolmuş - Tarihi yenile!",
        styles: {
          bg: "bg-red-500/10",
          text: "text-red-400",
          border: "border-red-500/20"
        }
      };
    } else if (diffDays === 0) {
      // Bugün
      return {
        days: 0,
        label: "Bugün doluyor - Tarihi yenile!",
        styles: {
          bg: "bg-red-500/10",
          text: "text-red-400",
          border: "border-red-500/20"
        }
      };
    } else if (diffDays <= 2) {
      // 1-2 gün
      return {
        days: diffDays,
        label: `${diffDays} gün kaldı - Tarihi yenile!`,
        styles: {
          bg: "bg-orange-500/10",
          text: "text-orange-400",
          border: "border-orange-500/20"
        }
      };
    } else if (diffDays <= 7) {
      // 3-7 gün
      return {
        days: diffDays,
        label: `${diffDays} gün kaldı`,
        styles: {
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          border: "border-yellow-500/20"
        }
      };
    } else {
      // 7+ gün
      return {
        days: diffDays,
        label: `${diffDays} gün kaldı`,
        styles: {
          bg: "bg-neutral-800/50",
          text: "text-neutral-400",
          border: "border-neutral-700/50"
        }
      };
    }
  };

  return (
    <article
      className={cn(
        components.card,
        "p-5 sm:p-6",
        "flex flex-col gap-4",
        "hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
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
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-lg font-bold mb-0.5 truncate", text.primary)}>
              {app.name}
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
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                  environmentStyles.bg,
                  environmentStyles.text,
                  environmentStyles.border
                )}
              >
                {environmentLabel}
              </span>
              <span className={cn(
                "font-mono text-xs px-2 py-0.5 rounded-md",
                bg.button,
                text.tertiary,
                border.default,
                "border"
              )}>
                {app.code}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/apps/${app.id}`}
          className={cn(
            "p-2 rounded-lg",
            "bg-neutral-800/50 hover:bg-neutral-800/70",
            "border border-neutral-700/50 hover:border-blue-500/50",
            "text-neutral-400 hover:text-blue-400",
            "transition-all duration-200",
            "flex items-center justify-center",
            "flex-shrink-0"
          )}
          title="Uygulamayı düzenle"
        >
          <Edit className="w-4 h-4" />
        </Link>
      </div>

      {/* Description */}
      {app.description && (
        <p className={cn("text-sm line-clamp-2 leading-relaxed", text.muted)}>
          {app.description}
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
              {(dashboardData.totalRevenue != null || dashboardData.revenueLast30Days != null || dashboardData.revenueLast7Days != null) && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <DollarSign className="w-4 h-4" />
                    Finansal Özet
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {dashboardData.totalRevenue != null && (
                      <div>
                        <div className={cn("text-xs mb-1", text.muted)}>Toplam Gelir</div>
                        <div className={cn("text-lg font-bold", text.primary)}>
                          {formatCurrency(dashboardData.totalRevenue, dashboardData.totalRevenueCurrency)}
                        </div>
                      </div>
                    )}
                    {dashboardData.revenueLast30Days != null && (
                      <div>
                        <div className={cn("text-xs mb-1", text.muted)}>Son 30 Gün</div>
                        <div className={cn("text-lg font-bold", text.primary)}>
                          {formatCurrency(dashboardData.revenueLast30Days, dashboardData.revenueLast30DaysCurrency)}
                        </div>
                      </div>
                    )}
                    {dashboardData.revenueLast7Days != null && (
                      <div>
                        <div className={cn("text-xs mb-1", text.muted)}>Son 7 Gün</div>
                        <div className={cn("text-lg font-bold", text.primary)}>
                          {formatCurrency(dashboardData.revenueLast7Days, dashboardData.revenueLast7DaysCurrency)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* İstatistikler */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-blue-400")}>Planlar</div>
                  <div className={cn("text-xl font-bold text-blue-400")}>
                    {dashboardData.activePlans}/{dashboardData.totalPlans}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-emerald-400")}>Abonelik</div>
                  <div className={cn("text-xl font-bold text-emerald-400")}>
                    {dashboardData.activeSubscriptions}/{dashboardData.totalSubscriptions}
                  </div>
                </div>
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-purple-400")}>Kullanıcı</div>
                  <div className={cn("text-xl font-bold text-purple-400")}>
                    {dashboardData.totalUsersRegistered}
                  </div>
                </div>
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                  <div className={cn("text-xs mb-1 text-orange-400")}>API Key</div>
                  <div className={cn("text-xl font-bold text-orange-400")}>
                    {dashboardData.activeApiKeys}/{dashboardData.totalApiKeys}
                  </div>
                </div>
              </div>

              {/* Planlar */}
              {dashboardData.plans.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Package className="w-4 h-4" />
                    Planlar ({dashboardData.plans.length})
                  </h4>
                  <div className="space-y-2">
                    {dashboardData.plans.map((plan) => (
                      <div
                        key={plan.planId}
                        className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          plan.isFree ? "border-purple-500/30" : "border-neutral-700/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold text-sm", text.primary)}>
                              {plan.planName}
                            </span>
                            {plan.isFree && (
                              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-medium">
                                Ücretsiz
                              </span>
                            )}
                          </div>
                          {!plan.isFree && plan.currentPrice != null && (
                            <span className={cn("font-medium text-sm", text.secondary)}>
                              {formatCurrency(plan.currentPrice, plan.currentPriceCurrency)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className={cn(text.muted)}>
                            {getBillingPeriodLabel(plan.billingPeriod)}
                          </span>
                          <span className={cn(text.muted)}>
                            Abonelik: {plan.activeSubscriptionsCount}/{plan.subscriptionsCount}
                          </span>
                          {plan.trialDays && plan.trialDays > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
                              {plan.trialDays} gün deneme
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abonelikler */}
              {dashboardData.subscriptions.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Users className="w-4 h-4" />
                    Son Abonelikler ({dashboardData.subscriptions.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dashboardData.subscriptions.slice(0, 10).map((sub) => (
                      <div
                        key={sub.subscriptionId}
                        className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          sub.isActive ? "border-emerald-500/30" : "border-neutral-700/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              {sub.userName} ({sub.userEmail})
                            </div>
                            <div className={cn("text-xs mt-1", text.muted)}>
                              {sub.planName}
                            </div>
                          </div>
                          {sub.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className={cn("text-xs", text.muted)}>
                          {formatDate(sub.startAt)}
                          {sub.endAt && ` - ${formatDate(sub.endAt)}`}
                          {sub.planPrice != null && ` • ${formatCurrency(sub.planPrice, sub.planPriceCurrency)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Özellikler */}
              {dashboardData.features.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Zap className="w-4 h-4" />
                    Özellikler ({dashboardData.features.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dashboardData.features.map((feature) => (
                      <div
                        key={feature.featureId}
                        className={cn(
                          "rounded-lg border p-2",
                          "bg-neutral-800/30 border-neutral-700/30"
                        )}
                      >
                        <div className={cn("font-medium text-xs", text.secondary)}>
                          {feature.featureName}
                        </div>
                        <div className={cn("text-xs mt-1", text.muted)}>
                          {feature.featureKey} • {feature.featureUnit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Keys */}
              {dashboardData.apiKeys.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Key className="w-4 h-4" />
                    API Anahtarları ({dashboardData.apiKeys.length})
                  </h4>
                  <div className="space-y-2">
                    {dashboardData.apiKeys.map((key) => {
                      const expiryInfo = getApiKeyExpiryInfo(key.expiresAt);
                      return (
                        <div
                          key={key.id}
                          className={cn(
                            "rounded-lg border p-3",
                            "bg-neutral-800/30",
                            expiryInfo ? expiryInfo.styles.border : key.isActive ? "border-blue-500/30" : "border-neutral-700/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={cn("font-medium text-sm", text.secondary)}>
                                {key.name}
                              </div>
                              <div className={cn("text-xs mt-1 font-mono", text.muted)}>
                                {key.prefix}••••
                              </div>
                            </div>
                            {key.isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                                Aktif
                              </span>
                            )}
                          </div>
                          {key.expiresAt && expiryInfo ? (
                            <div className={cn(
                              "text-xs mt-2 px-2 py-1 rounded-md border inline-block",
                              expiryInfo.styles.bg,
                              expiryInfo.styles.text,
                              expiryInfo.styles.border
                            )}>
                              {expiryInfo.label}
                            </div>
                          ) : key.expiresAt ? (
                            <div className={cn("text-xs mt-2", text.muted)}>
                              Son geçerlilik: {formatDate(key.expiresAt)}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Webhook Endpoints */}
              {dashboardData.webhookEndpoints.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Webhook className="w-4 h-4" />
                    Webhook Endpoint'leri ({dashboardData.webhookEndpoints.length})
                  </h4>
                  <div className="space-y-2">
                    {dashboardData.webhookEndpoints.map((wh) => (
                      <div
                        key={wh.id}
                        className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          wh.isActive ? "border-green-500/30" : "border-neutral-700/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className={cn("font-medium text-sm truncate", text.secondary)}>
                            {wh.url}
                          </div>
                          {wh.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className={cn("text-xs", text.muted)}>
                          {wh.eventTypesCsv}
                        </div>
                        {wh.lastDeliveryAt && (
                          <div className={cn("text-xs mt-1", text.muted)}>
                            Son teslimat: {formatDate(wh.lastDeliveryAt)} ({wh.lastDeliveryStatus})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kullanıcı Kayıtları */}
              {dashboardData.userRegistrations.length > 0 && (
                <div>
                  <h4 className={cn("text-sm font-semibold mb-2 flex items-center gap-2", text.primary)}>
                    <Users className="w-4 h-4" />
                    Kayıtlı Kullanıcılar ({dashboardData.userRegistrations.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dashboardData.userRegistrations.slice(0, 10).map((reg) => (
                      <div
                        key={reg.userId}
                        className={cn(
                          "rounded-lg border p-3",
                          "bg-neutral-800/30",
                          reg.hasActiveSubscription ? "border-emerald-500/30" : "border-neutral-700/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex-1">
                            <div className={cn("font-medium text-sm", text.secondary)}>
                              {reg.userName}
                            </div>
                            <div className={cn("text-xs mt-1", text.muted)}>
                              {reg.userEmail}
                            </div>
                          </div>
                          {reg.hasActiveSubscription && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              Aktif Abonelik
                            </span>
                          )}
                        </div>
                        <div className={cn("text-xs mt-1", text.muted)}>
                          Kayıt: {formatDate(reg.registeredAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Son Aktiviteler */}
              {(dashboardData.lastSubscriptionCreated || dashboardData.lastUserRegistered || dashboardData.lastInvoiceCreated || dashboardData.lastFeatureCreated) && (
                <div className="rounded-lg border border-neutral-700/30 bg-neutral-800/30 p-4">
                  <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", text.primary)}>
                    <Activity className="w-4 h-4" />
                    Son Aktiviteler
                  </h4>
                  <div className="space-y-2">
                    {dashboardData.lastSubscriptionCreated && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className={cn(text.muted)}>Son abonelik:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastSubscriptionCreated)}</span>
                      </div>
                    )}
                    {dashboardData.lastUserRegistered && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className={cn(text.muted)}>Son kullanıcı kaydı:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastUserRegistered)}</span>
                      </div>
                    )}
                    {dashboardData.lastInvoiceCreated && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <span className={cn(text.muted)}>Son fatura:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastInvoiceCreated)}</span>
                      </div>
                    )}
                    {dashboardData.lastFeatureCreated && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className={cn(text.muted)}>Son özellik:</span>
                        <span className={cn(text.secondary)}>{formatDate(dashboardData.lastFeatureCreated)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cn("border rounded-lg p-3", border.default, bg.input)}>
                <span className={cn("text-xs", text.muted)}>Workspace Anahtarı</span>
                <p className={cn("text-sm font-medium", text.secondary)}>
                  {app.workspaceKey ?? "—"}
                </p>
              </div>
              <div className={cn("border rounded-lg p-3", border.default, bg.input)}>
                <span className={cn("text-xs", text.muted)}>Owner Contact</span>
                <p className={cn("text-sm font-medium", text.secondary)}>
                  {app.ownerContactEmail ?? "—"}
                </p>
              </div>
              <div className={cn("border rounded-lg p-3", border.default, bg.input)}>
                <span className={cn("text-xs", text.muted)}>Billing Contact</span>
                <p className={cn("text-sm font-medium", text.secondary)}>
                  {app.billingContactEmail ?? "—"}
                </p>
              </div>
              <div className={cn("border rounded-lg p-3 md:col-span-2", border.default, bg.input)}>
                <span className={cn("text-xs", text.muted)}>Notlar</span>
                <p className={cn("text-sm font-medium", text.secondary)}>
                  {app.notes ? app.notes : "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function AppsListClient({ 
  apps, 
  searchQuery,
  pagination 
}: { 
  apps: AppDto[]; 
  searchQuery: string;
  pagination: PaginationInfo;
}) {
  if (apps.length === 0) {
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
            {searchQuery
              ? "Arama kriterlerinize uygun uygulama bulunamadı"
              : "Henüz uygulama yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
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
    </>
  );
}

