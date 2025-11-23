"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { GlobalDashboardDto, UserDashboardDto } from "@/types/dashboard";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import type { AppDashboardSummary } from "@/types/app";
import type { SubscriptionDto } from "@/types/subscription";
import type { InvoiceDto } from "@/types/invoice";
import type { PlanDto } from "@/types/plan";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AppWindow,
  Key,
  Webhook,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
  Clock,
  CreditCard,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  FileText,
  Inbox,
  Zap,
  RefreshCw,
  Table,
  TrendingUp as TrendingUpIcon,
  Award,
  Target,
} from "lucide-react";
import { components, bg, border, text, shadow } from "@/lib/theme";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getAllInvoices } from "@/lib/invoicesService";
import { getAllWebhookDeliveries, type WebhookDeliveryDto } from "@/lib/webhookDeliveriesService";
import { getPendingOutboxMessages, type OutboxMessageDto } from "@/lib/outboxService";
import { Status } from "@/types/app";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  red: "#ef4444",
  yellow: "#eab308",
  cyan: "#06b6d4",
  pink: "#ec4899",
};

const CHART_COLORS = [
  COLORS.blue,
  COLORS.emerald,
  COLORS.purple,
  COLORS.orange,
  COLORS.red,
  COLORS.yellow,
  COLORS.cyan,
  COLORS.pink,
];

export default function DashboardClient({
  globalData,
  appData,
  userData,
  apps,
  users,
  subscriptions = [],
  invoices = [],
  plans = [],
  selectedAppId,
  selectedUserId,
}: {
  globalData: GlobalDashboardDto;
  appData: AppDashboardSummary | null;
  userData: UserDashboardDto | null;
  apps: AppDto[];
  users: UserDto[];
  subscriptions?: SubscriptionDto[];
  invoices?: InvoiceDto[];
  plans?: PlanDto[];
  selectedAppId?: string;
  selectedUserId?: string;
}) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(!!selectedAppId || !!selectedUserId);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceDto[]>([]);
  const [failedWebhooks, setFailedWebhooks] = useState<WebhookDeliveryDto[]>([]);
  const [pendingOutbox, setPendingOutbox] = useState<OutboxMessageDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Bu değişkenleri useEffect'ten önce tanımla
  const displayData = appData || userData || globalData;
  const isAppView = !!appData;
  const isUserView = !!userData;

  useEffect(() => {
    const loadAdditionalData = async () => {
      if (!isAppView && !isUserView) {
        try {
          const [invs, webhooks, outbox] = await Promise.all([
            getAllInvoices().then(invs => invs.slice(0, 10)),
            getAllWebhookDeliveries().then(whs => 
              whs.filter(w => w.responseStatus === 0 || w.responseStatus >= 500).slice(0, 10)
            ),
            getPendingOutboxMessages(10),
          ]);
          setRecentInvoices(invs);
          setFailedWebhooks(webhooks);
          setPendingOutbox(outbox);
        } catch (error) {
          console.error("Error loading additional data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadAdditionalData();
  }, [isAppView, isUserView]);

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount == null) return "₺0";
    const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
    return `${currencySymbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDaysBetween = (start: string, end: string | null) => {
    if (!end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAppFilter = (appId: string | null) => {
    const params = new URLSearchParams();
    if (appId) params.set("appId", appId);
    if (selectedUserId) params.set("userId", selectedUserId);
    router.push(`/dashboard?${params.toString()}`);
  };

  const handleUserFilter = (userId: string | null) => {
    const params = new URLSearchParams();
    if (selectedAppId) params.set("appId", selectedAppId);
    if (userId) params.set("userId", userId);
    router.push(`/dashboard?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard");
  };

  // Sorunlar toplamı
  const totalIssues = !isAppView && !isUserView ? 
    globalData.failedWebhookDeliveriesLast24h + 
    globalData.pendingOutboxMessages + 
    globalData.expiredApiKeys + 
    globalData.unpaidInvoices + 
    globalData.expiringSubscriptions7d : 0;

  // Veri kontrolü
  const hasNoData = !isAppView && !isUserView && 
    globalData.totalApps === 0 && 
    globalData.totalUsers === 0 && 
    globalData.totalSubscriptions === 0;

  // Grafik verileri için hesaplamalar
  const revenueChartData = useMemo(() => {
    if (isAppView || isUserView || invoices.length === 0) return [];
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last30Days.map(date => {
      const dayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.createdDate);
        invDate.setHours(0, 0, 0, 0);
        return invDate.getTime() === date.getTime();
      });
      
      const total = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      
      return {
        date: date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
        gelir: total,
      };
    });
  }, [invoices, isAppView, isUserView]);

  const subscriptionChartData = useMemo(() => {
    if (isAppView || isUserView || subscriptions.length === 0) return [];
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last30Days.map(date => {
      const daySubs = subscriptions.filter(sub => {
        const subDate = new Date(sub.createdDate);
        subDate.setHours(0, 0, 0, 0);
        return subDate.getTime() === date.getTime();
      });
      
      return {
        date: date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
        abonelik: daySubs.length,
      };
    });
  }, [subscriptions, isAppView, isUserView]);

  const userChartData = useMemo(() => {
    if (isAppView || isUserView || users.length === 0) return [];
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last30Days.map(date => {
      const dayUsers = users.filter(user => {
        const userDate = new Date((user as any).createdDate || new Date());
        userDate.setHours(0, 0, 0, 0);
        return userDate.getTime() === date.getTime();
      });
      
      return {
        date: date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
        kullanici: dayUsers.length,
      };
    });
  }, [users, isAppView, isUserView]);

  // Plan dağılımı (Pie Chart)
  const planDistributionData = useMemo(() => {
    if (isAppView || isUserView || plans.length === 0) return [];
    
    const freeCount = plans.filter(p => p.isFree).length;
    const paidCount = plans.filter(p => !p.isFree).length;
    
    return [
      { name: "Ücretsiz", value: freeCount, color: COLORS.emerald },
      { name: "Ücretli", value: paidCount, color: COLORS.blue },
    ];
  }, [plans, isAppView, isUserView]);

  // Uygulama dağılımı (Pie Chart)
  const appDistributionData = useMemo(() => {
    if (isAppView || isUserView || apps.length === 0) return [];
    
    const activeCount = apps.filter(a => a.status === Status.Active).length;
    const inactiveCount = apps.filter(a => a.status === Status.DeActive).length;
    
    return [
      { name: "Aktif", value: activeCount, color: COLORS.emerald },
      { name: "Pasif", value: inactiveCount, color: COLORS.orange },
    ];
  }, [apps, isAppView, isUserView]);

  // Abonelik durum dağılımı
  const subscriptionStatusData = useMemo(() => {
    if (isAppView || isUserView || subscriptions.length === 0) return [];
    
    const activeCount = subscriptions.filter(s => s.status === Status.Active).length;
    const inactiveCount = subscriptions.filter(s => s.status === Status.DeActive).length;
    
    return [
      { name: "Aktif", value: activeCount, color: COLORS.emerald },
      { name: "Pasif", value: inactiveCount, color: COLORS.orange },
    ];
  }, [subscriptions, isAppView, isUserView]);

  // En çok gelir getiren uygulamalar
  const topRevenueApps = useMemo(() => {
    if (isAppView || isUserView || invoices.length === 0 || apps.length === 0) return [];
    
    const appRevenue = apps.map(app => {
      const appInvoices = invoices.filter(inv => inv.appId === app.id);
      const total = appInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      return {
        appId: app.id,
        appName: app.name,
        appCode: app.code,
        revenue: total,
        invoiceCount: appInvoices.length,
      };
    });
    
    return appRevenue
      .filter(a => a.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [invoices, apps, isAppView, isUserView]);

  // En aktif kullanıcılar
  const topActiveUsers = useMemo(() => {
    if (isAppView || isUserView || subscriptions.length === 0 || users.length === 0) return [];
    
    const userSubs = users.map(user => {
      const userSubscriptions = subscriptions.filter(sub => sub.userId === user.userId);
      const activeSubs = userSubscriptions.filter(sub => sub.status === Status.Active).length;
      return {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        totalSubscriptions: userSubscriptions.length,
        activeSubscriptions: activeSubs,
      };
    });
    
    return userSubs
      .filter(u => u.totalSubscriptions > 0)
      .sort((a, b) => b.totalSubscriptions - a.totalSubscriptions)
      .slice(0, 10);
  }, [subscriptions, users, isAppView, isUserView]);

  // Son abonelikler
  const recentSubscriptions = useMemo(() => {
    if (isAppView || isUserView || subscriptions.length === 0) return [];
    
    return [...subscriptions]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 10);
  }, [subscriptions, isAppView, isUserView]);

  // En çok kullanılan planlar
  const topPlans = useMemo(() => {
    if (isAppView || isUserView || subscriptions.length === 0 || plans.length === 0) return [];
    
    const planCounts = plans.map(plan => {
      const planSubs = subscriptions.filter(sub => sub.planId === plan.id);
      return {
        planId: plan.id,
        planName: plan.name,
        planCode: plan.code,
        appId: plan.appId,
        subscriptionCount: planSubs.length,
        activeCount: planSubs.filter(s => s.status === Status.Active).length,
      };
    });
    
    return planCounts
      .filter(p => p.subscriptionCount > 0)
      .sort((a, b) => b.subscriptionCount - a.subscriptionCount)
      .slice(0, 10);
  }, [subscriptions, plans, isAppView, isUserView]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {isAppView ? "Uygulama Dashboard" : isUserView ? "Kullanıcı Dashboard" : "Genel Dashboard"}
          </h1>
          <p className="text-neutral-400 text-sm">
            {isAppView && appData && `Uygulama: ${apps.find(a => a.id === selectedAppId)?.name || "Bilinmeyen"}`}
            {isUserView && userData && `Kullanıcı: ${userData.email} (${userData.userName})`}
            {!isAppView && !isUserView && "Sistem genelinde istatistikler ve özet bilgiler"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              components.buttonSecondary,
              "flex items-center gap-2"
            )}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Gizle" : "Filtrele"}
          </button>
        </div>
      </div>

      {/* Veri Yok Uyarısı */}
      {hasNoData && (
        <div className={cn(components.card, "p-6 border-yellow-500/30 bg-yellow-500/5")}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className={cn("text-lg font-semibold mb-1", text.primary)}>Veri Bulunamadı</h3>
              <p className={cn("text-sm", text.secondary)}>
                Dashboard'da görüntülenecek veri bulunmuyor. Sistemde uygulama, kullanıcı veya abonelik kaydı yok gibi görünüyor.
                <br />
                <span className="text-xs text-yellow-400 mt-2 block">
                  İlk verileri oluşturmak için: Uygulamalar → Yeni Uygulama, Kullanıcılar → Yeni Kullanıcı, Abonelikler → Yeni Abonelik
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className={cn(components.card, "p-4 sm:p-6")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("text-lg font-semibold", text.primary)}>Filtreler</h3>
            {(selectedAppId || selectedUserId) && (
              <button
                onClick={clearFilters}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg",
                  "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
                  "transition-all"
                )}
              >
                <X className="w-3 h-3 inline mr-1" />
                Temizle
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Uygulama</label>
              <select
                value={selectedAppId || ""}
                onChange={(e) => handleAppFilter(e.target.value || null)}
                className={components.input}
              >
                <option value="">Tüm Uygulamalar</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Kullanıcı</label>
              <select
                value={selectedUserId || ""}
                onChange={(e) => handleUserFilter(e.target.value || null)}
                className={components.input}
              >
                <option value="">Tüm Kullanıcılar</option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.email} ({user.userName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sorunlar ve Uyarılar - Sadece Genel Dashboard */}
      {!isAppView && !isUserView && totalIssues > 0 && (
        <div className={cn(components.card, "p-6 border-orange-500/30 bg-orange-500/5")}>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className={cn("text-xl font-bold", text.primary)}>Sorunlar ve Uyarılar</h2>
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30")}>
              {totalIssues} sorun
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {globalData.failedWebhookDeliveriesLast24h > 0 && (
              <IssueCard
                title="Başarısız Webhook"
                count={globalData.failedWebhookDeliveriesLast24h}
                icon={Webhook}
                color="red"
                href="/webhook-deliveries"
                description="Son 24 saat"
              />
            )}
            {globalData.pendingOutboxMessages > 0 && (
              <IssueCard
                title="Bekleyen Outbox"
                count={globalData.pendingOutboxMessages}
                icon={Inbox}
                color="orange"
                href="/outbox"
                description="İşlenmemiş mesaj"
              />
            )}
            {globalData.expiredApiKeys > 0 && (
              <IssueCard
                title="Süresi Dolmuş API Key"
                count={globalData.expiredApiKeys}
                icon={Key}
                color="yellow"
                href="/apikeys"
                description="Yenilenmeli"
              />
            )}
            {globalData.unpaidInvoices > 0 && (
              <IssueCard
                title="Ödenmemiş Fatura"
                count={globalData.unpaidInvoices}
                icon={FileText}
                color="red"
                href="/invoices"
                description="Ödeme bekliyor"
              />
            )}
            {globalData.expiringSubscriptions7d > 0 && (
              <IssueCard
                title="Yakında Bitecek Abonelik"
                count={globalData.expiringSubscriptions7d}
                icon={ShoppingCart}
                color="yellow"
                href="/subscriptions"
                description="7 gün içinde"
              />
            )}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <StatCard
          title={isAppView ? "Son 30 Gün Gelir" : isUserView ? "Toplam Harcama" : "Toplam Gelir"}
          value={
            isAppView && appData
            ? formatCurrency(appData.revenueLast30d, appData.revenueCurrency)
            : isUserView && userData
            ? formatCurrency(userData.totalSpent, userData.totalSpentCurrency)
              : formatCurrency(globalData.totalRevenue, globalData.revenueCurrency)
          }
          icon={DollarSign}
          trend={
            isAppView
              ? undefined
              : isUserView && userData
              ? userData.spentLast30Days != null
                ? `Son 30g: ${formatCurrency(userData.spentLast30Days, userData.spentLast30DaysCurrency)}`
                : undefined
              : globalData.revenueLast30Days != null && globalData.totalRevenue != null
              ? `Son 30g: ${formatCurrency(globalData.revenueLast30Days, globalData.revenueCurrency)}`
              : undefined
          }
          trendUp={true}
          color="emerald"
        />

        {/* MRR / ARR */}
        {!isAppView && !isUserView && (
          <>
            <StatCard
              title="MRR"
              value={formatCurrency(globalData.mrr, globalData.mrrCurrency)}
              icon={TrendingUp}
              sub="Aylık Tekrarlayan Gelir"
              color="blue"
            />
            <StatCard
              title="ARR"
              value={formatCurrency(globalData.arr, globalData.arrCurrency)}
              icon={BarChart3}
              sub="Yıllık Tekrarlayan Gelir"
              color="purple"
            />
          </>
        )}

        {/* Active Subscriptions */}
        <StatCard
          title="Aktif Abonelikler"
          value={
            isAppView && appData
            ? appData.subscriptionsActive.toString()
            : isUserView && userData
            ? userData.activeSubscriptions.toString()
              : globalData.activeSubscriptions.toString()
          }
          icon={ShoppingCart}
          trend={
            isAppView
              ? `${appData?.subscriptionsTotal || 0} toplam`
              : isUserView
              ? `${userData?.totalSubscriptions || 0} toplam`
              : globalData.newSubscriptionsLast30Days > 0
            ? `+${globalData.newSubscriptionsLast30Days} (30g)`
              : undefined
          }
          trendUp={true}
          color="blue"
        />

        {/* Active Users */}
        <StatCard
          title="Aktif Kullanıcılar"
          value={
            isAppView && appData
            ? "-"
            : isUserView && userData
            ? "1"
              : globalData.activeUsers.toString()
          }
          icon={Users}
          trend={
            isAppView
              ? undefined
              : isUserView
              ? undefined
              : globalData.newUsersLast30Days > 0
            ? `+${globalData.newUsersLast30Days} (30g)`
              : undefined
          }
          trendUp={true}
          color="emerald"
        />

        {/* Total Apps / Plans */}
        {!isUserView && (
          <StatCard
            title={isAppView ? "Aktif Planlar" : "Toplam Uygulamalar"}
            value={
              isAppView && appData
              ? appData.plansActive.toString()
                : globalData.totalApps.toString()
            }
            icon={isAppView ? Package : AppWindow}
            sub={
              isAppView
              ? `${appData?.plansInactive || 0} pasif plan`
                : `${globalData.activeApps} aktif`
            }
            color="purple"
          />
        )}

        {/* Churn Rate */}
        {!isAppView && !isUserView && globalData.churnRate != null && (
          <StatCard
            title="Churn Rate"
            value={`${globalData.churnRate.toFixed(1)}%`}
            icon={TrendingDown}
            sub="İptal Oranı (30g)"
            trendDown={true}
            color="orange"
          />
        )}

        {/* API Keys / Webhooks */}
        {!isUserView && (
          <>
            <StatCard
              title="API Anahtarları"
              value={
                isAppView && appData
                ? appData.apiKeysActive.toString()
                  : globalData.activeApiKeys.toString()
              }
              icon={Key}
              sub={isAppView ? "" : `${globalData.totalApiKeys} toplam`}
              color="blue"
            />
            {isAppView && appData && (
              <StatCard
                title="Webhook Endpoints"
                value={appData.webhookEndpointsActive.toString()}
                icon={Webhook}
                color="purple"
              />
            )}
          </>
        )}

        {/* User Stats */}
        {isUserView && userData && (
          <>
            <StatCard
              title="Kayıtlı Uygulamalar"
              value={userData.totalAppsRegistered.toString()}
              icon={AppWindow}
              sub={`${userData.appsWithActiveSubscription} aktif abonelik`}
              color="blue"
            />
            <StatCard
              title="İptal Edilen"
              value={userData.cancelledSubscriptions.toString()}
              icon={X}
              color="red"
            />
          </>
        )}
      </div>

      {/* Grafikler - Sadece Genel Dashboard */}
      {!isAppView && !isUserView && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gelir Trendi */}
          {revenueChartData.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
                  Gelir Trendi (Son 30 Gün)
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gelir"
                    stroke={COLORS.emerald}
                    fillOpacity={1}
                    fill="url(#colorGelir)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Abonelik Trendi */}
          {subscriptionChartData.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  Abonelik Trendi (Son 30 Gün)
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="abonelik"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    dot={{ fill: COLORS.blue, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Kullanıcı Trendi */}
          {userChartData.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <Users className="w-5 h-5 text-purple-400" />
                  Kullanıcı Trendi (Son 30 Gün)
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                  <Bar dataKey="kullanici" fill={COLORS.purple} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plan Dağılımı */}
          {planDistributionData.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <PieChart className="w-5 h-5 text-orange-400" />
                  Plan Dağılımı
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={planDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#f3f4f6" }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tablolar - Sadece Genel Dashboard */}
      {!isAppView && !isUserView && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* En Çok Gelir Getiren Uygulamalar */}
          {topRevenueApps.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <Award className="w-5 h-5 text-yellow-400" />
                  En Çok Gelir Getiren Uygulamalar
                </h2>
                <Link
                  href="/apps"
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-lg",
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                    "transition-all"
                  )}
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn("border-b", border.default)}>
                      <th className={cn("text-left py-3 px-4 text-sm font-semibold", text.secondary)}>Uygulama</th>
                      <th className={cn("text-right py-3 px-4 text-sm font-semibold", text.secondary)}>Gelir</th>
                      <th className={cn("text-right py-3 px-4 text-sm font-semibold", text.secondary)}>Fatura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRevenueApps.map((app, index) => (
                      <tr key={app.appId} className={cn("border-b", border.default, "hover:bg-neutral-800/30")}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-medium", text.primary)}>
                              {index + 1}. {app.appName}
                            </span>
                            <span className={cn("text-xs px-2 py-0.5 rounded", bg.button, text.tertiary)}>
                              {app.appCode}
                            </span>
                          </div>
                        </td>
                        <td className={cn("text-right py-3 px-4 text-sm font-semibold", text.primary)}>
                          {formatCurrency(app.revenue, globalData.revenueCurrency)}
                        </td>
                        <td className={cn("text-right py-3 px-4 text-sm", text.secondary)}>
                          {app.invoiceCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* En Aktif Kullanıcılar */}
          {topActiveUsers.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <Target className="w-5 h-5 text-emerald-400" />
                  En Aktif Kullanıcılar
                </h2>
                <Link
                  href="/users"
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-lg",
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                    "transition-all"
                  )}
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn("border-b", border.default)}>
                      <th className={cn("text-left py-3 px-4 text-sm font-semibold", text.secondary)}>Kullanıcı</th>
                      <th className={cn("text-right py-3 px-4 text-sm font-semibold", text.secondary)}>Toplam</th>
                      <th className={cn("text-right py-3 px-4 text-sm font-semibold", text.secondary)}>Aktif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topActiveUsers.map((user, index) => (
                      <tr key={user.userId} className={cn("border-b", border.default, "hover:bg-neutral-800/30")}>
                        <td className="py-3 px-4">
                          <div>
                            <div className={cn("text-sm font-medium", text.primary)}>
                              {index + 1}. {user.userName}
                            </div>
                            <div className={cn("text-xs", text.muted)}>{user.email}</div>
                          </div>
                        </td>
                        <td className={cn("text-right py-3 px-4 text-sm font-semibold", text.primary)}>
                          {user.totalSubscriptions}
                        </td>
                        <td className={cn("text-right py-3 px-4 text-sm", text.secondary)}>
                          <span className={cn("px-2 py-0.5 rounded text-xs", "bg-emerald-500/10 text-emerald-400")}>
                            {user.activeSubscriptions}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Son Abonelikler */}
          {recentSubscriptions.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  Son Abonelikler
                </h2>
                <Link
                  href="/subscriptions"
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-lg",
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                    "transition-all"
                  )}
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="space-y-3">
                {recentSubscriptions.map((sub) => {
                  const app = apps.find(a => a.id === sub.appId);
                  const plan = plans.find(p => p.id === sub.planId);
                  const user = users.find(u => u.userId === sub.userId);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className={cn(
                        "block p-4 rounded-xl border transition-all",
                        "bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800/70 hover:border-blue-500/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-sm font-medium", text.primary)}>
                              {app?.name || "Bilinmeyen Uygulama"}
                            </span>
                            <span className={cn("text-xs px-2 py-0.5 rounded", bg.button, text.tertiary)}>
                              {plan?.name || "Bilinmeyen Plan"}
                            </span>
                          </div>
                          <div className={cn("text-xs", text.muted)}>
                            {user?.userName || user?.email || "Bilinmeyen Kullanıcı"}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            sub.status === Status.Active
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-neutral-700/50 text-neutral-400 border border-neutral-600/50"
                          )}
                        >
                          {sub.status === Status.Active ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <div className={cn("text-xs", text.muted)}>
                        {formatDateTime(sub.createdDate)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* En Çok Kullanılan Planlar */}
          {topPlans.length > 0 && (
            <div className={cn(components.card, "p-6")}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                  <Package className="w-5 h-5 text-purple-400" />
                  En Çok Kullanılan Planlar
                </h2>
                <Link
                  href="/plans"
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-lg",
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                    "transition-all"
                  )}
                >
                  Tümünü Gör
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn("border-b", border.default)}>
                      <th className={cn("text-left py-3 px-4 text-sm font-semibold", text.secondary)}>Plan</th>
                      <th className={cn("text-right py-3 px-4 text-sm font-semibold", text.secondary)}>Toplam</th>
                      <th className={cn("text-right py-3 px-4 text-sm font-semibold", text.secondary)}>Aktif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPlans.map((plan, index) => {
                      const app = apps.find(a => a.id === plan.appId);
                      return (
                        <tr key={plan.planId} className={cn("border-b", border.default, "hover:bg-neutral-800/30")}>
                          <td className="py-3 px-4">
                            <div>
                              <div className={cn("text-sm font-medium", text.primary)}>
                                {index + 1}. {plan.planName}
                              </div>
                              <div className={cn("text-xs", text.muted)}>
                                {app?.name || "Bilinmeyen Uygulama"} • {plan.planCode}
                              </div>
                            </div>
                          </td>
                          <td className={cn("text-right py-3 px-4 text-sm font-semibold", text.primary)}>
                            {plan.subscriptionCount}
                          </td>
                          <td className={cn("text-right py-3 px-4 text-sm", text.secondary)}>
                            <span className={cn("px-2 py-0.5 rounded text-xs", "bg-emerald-500/10 text-emerald-400")}>
                              {plan.activeCount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Son Faturalar ve Sistem Durumu - Sadece Genel Dashboard */}
      {!isAppView && !isUserView && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Son Faturalar */}
          <div className={cn(components.card, "p-6")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                <FileText className="w-5 h-5" />
                Son Faturalar
              </h2>
              <Link
                href="/invoices"
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg",
                  "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                  "transition-all"
                )}
              >
                Tümünü Gör
              </Link>
            </div>
            {loading ? (
              <div className={cn("text-center py-12", text.muted)}>
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Yükleniyor...</p>
              </div>
            ) : recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => {
                  const app = apps.find(a => a.id === invoice.appId);
                  const user = users.find(u => u.userId === invoice.userId);
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className={cn(
                        "block p-4 rounded-xl border transition-all",
                        "bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800/70 hover:border-blue-500/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-sm font-medium", text.primary)}>
                              {formatCurrency(invoice.total, invoice.currency?.toString())}
                            </span>
                            <span className={cn("text-xs px-2 py-0.5 rounded", bg.button, text.tertiary)}>
                              {invoice.status === 14 ? "Ödendi" : "Bekliyor"}
                            </span>
                          </div>
                          <div className={cn("text-xs", text.muted)}>
                            {app?.name || "Bilinmeyen"} • {user?.userName || user?.email || "Bilinmeyen"}
                          </div>
                        </div>
                        <span className={cn("text-xs", text.muted)}>
                          {formatDate(invoice.createdDate)}
                        </span>
                      </div>
                      <div className={cn("text-xs", text.muted)}>
                        Dönem: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={cn("text-center py-12", text.muted)}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henüz fatura yok</p>
              </div>
            )}
          </div>

          {/* Sistem Durumu */}
          <div className={cn(components.card, "p-6")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-xl font-bold flex items-center gap-2", text.primary)}>
                <AlertCircle className="w-5 h-5" />
                Sistem Durumu
              </h2>
            </div>
            {loading ? (
              <div className={cn("text-center py-12", text.muted)}>
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Yükleniyor...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {failedWebhooks.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={cn("text-sm font-semibold flex items-center gap-2", text.secondary)}>
                        <Webhook className="w-4 h-4 text-red-400" />
                        Başarısız Webhook'lar
                      </h3>
                      <Link
                        href="/webhook-deliveries"
                        className={cn("text-xs text-blue-400 hover:text-blue-300")}
                      >
                        Tümünü Gör
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {failedWebhooks.slice(0, 3).map((wh) => (
                        <div
                          key={wh.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            "bg-red-500/10 border-red-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs font-medium", text.primary)}>
                              {wh.eventType}
                            </span>
                            <span className={cn("text-xs", text.muted)}>
                              {formatDateTime(wh.attemptedAt)}
                            </span>
                          </div>
                          <div className={cn("text-xs mt-1", text.muted)}>
                            Status: {wh.responseStatus || "Timeout"} | Retry: {wh.retries}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pendingOutbox.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={cn("text-sm font-semibold flex items-center gap-2", text.secondary)}>
                        <Inbox className="w-4 h-4 text-orange-400" />
                        Bekleyen Outbox Mesajları
                      </h3>
                      <Link
                        href="/outbox"
                        className={cn("text-xs text-blue-400 hover:text-blue-300")}
                      >
                        Tümünü Gör
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {pendingOutbox.slice(0, 3).map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            "bg-orange-500/10 border-orange-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs font-medium", text.primary)}>
                              {msg.type}
                            </span>
                            <span className={cn("text-xs", text.muted)}>
                              {formatDateTime(msg.occurredAt)}
                            </span>
                          </div>
                          <div className={cn("text-xs mt-1", text.muted)}>
                            Retry: {msg.retries}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {failedWebhooks.length === 0 && pendingOutbox.length === 0 && (
                  <div className={cn("text-center py-8", text.muted)}>
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                    <p>Tüm sistemler normal çalışıyor</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Dashboard - Detailed View */}
      {isUserView && userData && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Subscriptions */}
          <div className={cn(components.card, "p-6")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-xl font-bold", text.primary)}>Abonelikler</h2>
              <span className={cn("text-sm px-3 py-1 rounded-full", bg.button, text.tertiary)}>
                {userData.subscriptions.length}
              </span>
            </div>
            <div className="space-y-3">
              {userData.subscriptions.map((sub) => {
                const daysActive = calculateDaysBetween(sub.startAt, sub.endAt || new Date().toISOString());
                return (
                <div
                  key={sub.subscriptionId}
                  className={cn(
                      "p-4 rounded-xl border transition-all",
                    sub.isActive
                        ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15"
                        : "bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800/70"
                  )}
                >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn("font-semibold", text.primary)}>
                            {sub.appName}
                      </h3>
                          <span className={cn("text-xs px-2 py-0.5 rounded", bg.button, text.tertiary)}>
                            {sub.appCode}
                          </span>
                        </div>
                        <h4 className={cn("text-sm font-medium mb-1", text.secondary)}>
                          {sub.planName}
                        </h4>
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <span className={cn(text.muted, "flex items-center gap-1")}>
                            <CreditCard className="w-3 h-3" />
                            {sub.billingPeriod === "Monthly" ? "Aylık" : 
                             sub.billingPeriod === "Yearly" ? "Yıllık" :
                             sub.billingPeriod === "Weekly" ? "Haftalık" :
                             sub.billingPeriod === "Daily" ? "Günlük" :
                             sub.billingPeriod}
                          </span>
                          {!sub.isFreePlan && sub.planPrice != null && (
                            <span className={cn(text.secondary)}>
                              {formatCurrency(sub.planPrice, sub.planPriceCurrency)}
                            </span>
                          )}
                          {sub.isFreePlan && (
                            <span className={cn("px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs")}>
                              Ücretsiz
                            </span>
                          )}
                          {sub.trialDays && sub.trialDays > 0 && (
                            <span className={cn("px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs")}>
                              {sub.trialDays} gün deneme
                            </span>
                          )}
                        </div>
                    </div>
                    <span
                      className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                        sub.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-neutral-700/50 text-neutral-400 border border-neutral-600/50"
                      )}
                    >
                      {sub.isActive ? "Aktif" : "İptal"}
                    </span>
                  </div>
                    <div className={cn("grid grid-cols-2 gap-2 text-xs pt-3 border-t", border.default)}>
                      <div>
                        <span className={cn(text.muted)}>Başlangıç:</span>
                        <div className={cn(text.secondary, "font-medium")}>
                          {formatDate(sub.startAt)}
                        </div>
                      </div>
                      {sub.endAt && (
                        <div>
                          <span className={cn(text.muted)}>Bitiş:</span>
                          <div className={cn(text.secondary, "font-medium")}>
                            {formatDate(sub.endAt)}
                          </div>
                        </div>
                      )}
                      {sub.renewAt && (
                        <div>
                          <span className={cn(text.muted)}>Yenileme:</span>
                          <div className={cn(text.secondary, "font-medium")}>
                            {formatDate(sub.renewAt)}
                          </div>
                        </div>
                      )}
                      {daysActive != null && (
                        <div>
                          <span className={cn(text.muted, "flex items-center gap-1")}>
                            <Clock className="w-3 h-3" />
                            Süre:
                          </span>
                          <div className={cn(text.secondary, "font-medium")}>
                            {daysActive} gün
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/apps/${sub.appId}`}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-lg",
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                          "transition-all"
                        )}
                      >
                        Uygulamaya Git
                      </Link>
                      <Link
                        href={`/plans/${sub.planId}`}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-lg",
                          "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20",
                          "transition-all"
                        )}
                      >
                        Planı Görüntüle
                      </Link>
                    </div>
                  </div>
                );
              })}
              {userData.subscriptions.length === 0 && (
                <div className={cn("text-center py-12", text.muted)}>
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz abonelik yok</p>
                </div>
              )}
            </div>
          </div>

          {/* App Registrations */}
          <div className={cn(components.card, "p-6")}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("text-xl font-bold", text.primary)}>Kayıtlı Uygulamalar</h2>
              <span className={cn("text-sm px-3 py-1 rounded-full", bg.button, text.tertiary)}>
                {userData.appRegistrations.length}
              </span>
            </div>
            <div className="space-y-3">
              {userData.appRegistrations.map((reg) => (
                <div
                  key={reg.appId}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    reg.hasActiveSubscription
                      ? "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15"
                      : "bg-neutral-800/50 border-neutral-700/50 hover:bg-neutral-800/70"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                      <h3 className={cn("font-semibold", text.primary)}>{reg.appName}</h3>
                        <span className={cn("text-xs px-2 py-0.5 rounded", bg.button, text.tertiary)}>
                          {reg.appCode}
                        </span>
                      </div>
                      <div className={cn("flex items-center gap-2 text-xs", text.muted)}>
                        <Calendar className="w-3 h-3" />
                        <span>Kayıt: {formatDate(reg.registeredAt)}</span>
                      </div>
                    </div>
                    {reg.hasActiveSubscription && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Aktif Abonelik
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/apps/${reg.appId}`}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-lg inline-block",
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20",
                        "transition-all"
                      )}
                    >
                      Uygulamaya Git
                    </Link>
                  </div>
                </div>
              ))}
              {userData.appRegistrations.length === 0 && (
                <div className={cn("text-center py-12", text.muted)}>
                  <AppWindow className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz uygulama kaydı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Dashboard Details */}
      {isAppView && appData && (
        <div className={cn(components.card, "p-6")}>
          <h2 className={cn("text-xl font-bold mb-4", text.primary)}>Uygulama Detayları</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className={cn("text-sm mb-1", text.muted)}>Planlar</div>
              <div className={cn("text-lg font-semibold", text.primary)}>
                {appData.plansActive} aktif / {appData.plansInactive || 0} pasif
              </div>
            </div>
            <div>
              <div className={cn("text-sm mb-1", text.muted)}>Abonelikler</div>
              <div className={cn("text-lg font-semibold", text.primary)}>
                {appData.subscriptionsActive} aktif / {appData.subscriptionsTotal || 0} toplam
              </div>
            </div>
            <div>
              <div className={cn("text-sm mb-1", text.muted)}>Fiyat Aralığı</div>
              <div className={cn("text-sm", text.secondary)}>
                {formatCurrency(appData.cheapestPrice, appData.cheapestPriceCurrency)} -{" "}
                {formatCurrency(appData.highestPrice, appData.highestPriceCurrency)}
              </div>
            </div>
            <div>
              <div className={cn("text-sm mb-1", text.muted)}>Son 7 Gün Kullanım</div>
              <div className={cn("text-lg font-semibold", text.primary)}>
                {appData.usageEventsLast7d?.toLocaleString("tr-TR") || "0"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {!isAppView && !isUserView && (
        <div className={cn(components.card, "p-6")}>
          <h2 className={cn("text-xl font-bold mb-4", text.primary)}>Son Aktiviteler</h2>
          <div className="space-y-3">
            {globalData.lastSubscriptionCreated && (
              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className={text.tertiary}>
                  Son abonelik oluşturuldu:{" "}
                  <span className={text.secondary}>{formatDateTime(globalData.lastSubscriptionCreated)}</span>
                </span>
              </div>
            )}
            {globalData.lastUserRegistered && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className={text.tertiary}>
                  Son kullanıcı kaydı:{" "}
                  <span className={text.secondary}>{formatDateTime(globalData.lastUserRegistered)}</span>
                </span>
              </div>
            )}
            {globalData.lastInvoiceCreated && (
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className={text.tertiary}>
                  Son fatura oluşturuldu:{" "}
                  <span className={text.secondary}>{formatDateTime(globalData.lastInvoiceCreated)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  trend,
  trendUp,
  trendDown,
  color = "blue",
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  trendDown?: boolean;
  color?: "blue" | "emerald" | "purple" | "orange" | "red";
}) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/10 border-blue-500/20 text-blue-400",
    emerald: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
    purple: "from-purple-500/10 to-purple-600/10 border-purple-500/20 text-purple-400",
    orange: "from-orange-500/10 to-orange-600/10 border-orange-500/20 text-orange-400",
    red: "from-red-500/10 to-red-600/10 border-red-500/20 text-red-400",
  };

  return (
    <div className={cn(components.card, "p-5 sm:p-6 relative overflow-hidden")}>
      <div className={cn("absolute top-0 right-0 w-20 h-20 bg-gradient-to-br rounded-full -mr-10 -mt-10", colorClasses[color].split(" ")[0], colorClasses[color].split(" ")[1])} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-lg border", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          {(trendUp || trendDown) && trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trendUp ? "text-emerald-400" : "text-red-400"
            )}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={cn("text-xs mb-1", text.muted)}>{title}</div>
        <div className={cn("text-2xl sm:text-3xl font-bold mb-1", text.primary)}>{value}</div>
        {sub && <div className={cn("text-xs", text.disabled)}>{sub}</div>}
      </div>
    </div>
  );
}

function IssueCard({
  title,
  count,
  icon: Icon,
  color,
  href,
  description,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "red" | "orange" | "yellow";
  href: string;
  description?: string;
}) {
  const colorClasses = {
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  };

  return (
    <Link
      href={href}
      className={cn(
        "p-4 rounded-xl border transition-all hover:scale-105",
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <div className="text-sm font-medium mb-1">{title}</div>
      {description && <div className="text-xs opacity-75">{description}</div>}
    </Link>
  );
}
