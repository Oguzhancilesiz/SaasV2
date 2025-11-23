import { getGlobalDashboard } from "@/lib/dashboardService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import { getAllSubscriptions } from "@/lib/subscriptionsService";
import { getAllInvoices } from "@/lib/invoicesService";
import { getAllPlans } from "@/lib/plansService";
import DashboardClient from "./DashboardClient";
import type { GlobalDashboardDto } from "@/types/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  try {
    const params = await searchParams;
    const appId = params.appId;
    const userId = params.userId;

    // Verileri ayrı ayrı çek, hata durumunda daha iyi debug edebilmek için
    let globalData: GlobalDashboardDto;
    let apps = [];
    let users = [];
    let subscriptions = [];
    let invoices = [];
    let plans = [];

    try {
      globalData = await getGlobalDashboard();
      console.log("Dashboard data loaded:", globalData);
    } catch (error: any) {
      console.error("Global dashboard fetch error:", error);
      // Hata durumunda boş veri ile devam et, kullanıcı hatayı görsün
      globalData = {
      totalApps: 0,
      activeApps: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      totalPlans: 0,
      activePlans: 0,
      totalRevenue: null,
      revenueLast30Days: null,
      revenueLast7Days: null,
      revenueCurrency: null,
      mrr: null,
      mrrCurrency: null,
      arr: null,
      arrCurrency: null,
      newSubscriptionsLast30Days: 0,
      cancelledSubscriptionsLast30Days: 0,
      churnRate: null,
      newUsersLast30Days: 0,
      newUsersLast7Days: 0,
      freePlans: 0,
      paidPlans: 0,
      totalApiKeys: 0,
      activeApiKeys: 0,
      totalWebhookEndpoints: 0,
      activeWebhookEndpoints: 0,
      lastSubscriptionCreated: null,
      lastUserRegistered: null,
      lastInvoiceCreated: null,
      failedWebhookDeliveriesLast24h: 0,
      pendingOutboxMessages: 0,
      expiredApiKeys: 0,
      unpaidInvoices: 0,
      expiringSubscriptions7d: 0,
    };
  }

  try {
    apps = await getAllApps();
  } catch (error: any) {
    console.error("Apps fetch error:", error);
    apps = [];
  }

  try {
    users = await getAllUsers();
  } catch (error: any) {
    console.error("Users fetch error:", error);
    users = [];
  }

  // Grafikler ve tablolar için ek veriler (sadece genel dashboard için)
  if (!appId && !userId) {
    try {
      [subscriptions, invoices, plans] = await Promise.all([
        getAllSubscriptions().catch(() => []),
        getAllInvoices().catch(() => []),
        getAllPlans().catch(() => []),
      ]);
    } catch (error: any) {
      console.error("Additional data fetch error:", error);
    }
  }

  // App bazlı filtreleme
  let appData = null;
  if (appId) {
    try {
      const { getAppDashboard } = await import("@/lib/appsService");
      appData = await getAppDashboard(appId);
    } catch {
      // Silently handle error
    }
  }

  // User bazlı filtreleme
  let userData = null;
  if (userId) {
    try {
      const { getUserDashboard } = await import("@/lib/dashboardService");
      userData = await getUserDashboard(userId);
    } catch {
      // Silently handle error
    }
  }

    return (
      <DashboardClient
        globalData={globalData}
        appData={appData}
        userData={userData}
        apps={apps}
        users={users}
        subscriptions={subscriptions}
        invoices={invoices}
        plans={plans}
        selectedAppId={appId}
        selectedUserId={userId}
      />
    );
  } catch (error: any) {
    console.error("Dashboard page error:", error);
    // Hata durumunda boş veri ile devam et
    const emptyGlobalData: GlobalDashboardDto = {
      totalApps: 0,
      activeApps: 0,
      totalUsers: 0,
      activeUsers: 0,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      totalPlans: 0,
      activePlans: 0,
      totalRevenue: null,
      revenueLast30Days: null,
      revenueLast7Days: null,
      revenueCurrency: null,
      mrr: null,
      mrrCurrency: null,
      arr: null,
      arrCurrency: null,
      newSubscriptionsLast30Days: 0,
      cancelledSubscriptionsLast30Days: 0,
      churnRate: null,
      newUsersLast30Days: 0,
      newUsersLast7Days: 0,
      freePlans: 0,
      paidPlans: 0,
      totalApiKeys: 0,
      activeApiKeys: 0,
      totalWebhookEndpoints: 0,
      activeWebhookEndpoints: 0,
      lastSubscriptionCreated: null,
      lastUserRegistered: null,
      lastInvoiceCreated: null,
      failedWebhookDeliveriesLast24h: 0,
      pendingOutboxMessages: 0,
      expiredApiKeys: 0,
      unpaidInvoices: 0,
      expiringSubscriptions7d: 0,
    };
    
    return (
      <DashboardClient
        globalData={emptyGlobalData}
        appData={null}
        userData={null}
        apps={[]}
        users={[]}
        subscriptions={[]}
        invoices={[]}
        plans={[]}
        selectedAppId={undefined}
        selectedUserId={undefined}
      />
    );
  }
}
