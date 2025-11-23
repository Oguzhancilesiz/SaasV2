export type GlobalDashboardDto = {
  totalApps: number;
  activeApps: number;
  totalUsers: number;
  activeUsers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalPlans: number;
  activePlans: number;
  totalRevenue: number | null;
  revenueLast30Days: number | null;
  revenueLast7Days: number | null;
  revenueCurrency: string | null;
  mrr: number | null;
  mrrCurrency: string | null;
  arr: number | null;
  arrCurrency: string | null;
  newSubscriptionsLast30Days: number;
  cancelledSubscriptionsLast30Days: number;
  churnRate: number | null;
  newUsersLast30Days: number;
  newUsersLast7Days: number;
  freePlans: number;
  paidPlans: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalWebhookEndpoints: number;
  activeWebhookEndpoints: number;
  lastSubscriptionCreated: string | null;
  lastUserRegistered: string | null;
  lastInvoiceCreated: string | null;
  failedWebhookDeliveriesLast24h: number;
  pendingOutboxMessages: number;
  expiredApiKeys: number;
  unpaidInvoices: number;
  expiringSubscriptions7d: number;
};

export type UserSubscriptionDetailDto = {
  subscriptionId: string;
  appId: string;
  appName: string;
  appCode: string;
  planId: string;
  planName: string;
  planCode: string;
  startAt: string;
  endAt: string | null;
  renewAt: string | null;
  isActive: boolean;
  billingPeriod: string;
  planPrice: number | null;
  planPriceCurrency: string | null;
  trialDays: number | null;
  isFreePlan: boolean;
};

export type UserAppRegistrationDto = {
  appId: string;
  appName: string;
  appCode: string;
  registeredAt: string;
  hasActiveSubscription: boolean;
};

export type UserDashboardDto = {
  userId: string;
  userName: string;
  email: string;
  phone: string | null;
  status: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  totalAppsRegistered: number;
  appsWithActiveSubscription: number;
  totalSpent: number | null;
  totalSpentCurrency: string | null;
  spentLast30Days: number | null;
  spentLast30DaysCurrency: string | null;
  subscriptions: UserSubscriptionDetailDto[];
  appRegistrations: UserAppRegistrationDto[];
  lastSubscriptionCreated: string | null;
  lastSubscriptionCancelled: string | null;
  lastAppRegistered: string | null;
};

export type AppPlanDetailDto = {
  planId: string;
  planName: string;
  planCode: string;
  isFree: boolean;
  billingPeriod: number;
  trialDays: number | null;
  currentPrice: number | null;
  currentPriceCurrency: string | null;
  subscriptionsCount: number;
  activeSubscriptionsCount: number;
};

export type AppSubscriptionDetailDto = {
  subscriptionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
  startAt: string;
  endAt: string | null;
  isActive: boolean;
  planPrice: number | null;
  planPriceCurrency: string | null;
};

export type AppFeatureDetailDto = {
  featureId: string;
  featureKey: string;
  featureName: string;
  featureUnit: string;
  description: string;
};

export type AppApiKeyDetailDto = {
  id: string;
  name: string;
  prefix: string;
  expiresAt: string | null;
  createdDate: string;
  isActive: boolean;
};

export type AppWebhookDetailDto = {
  id: string;
  url: string;
  isActive: boolean;
  eventTypesCsv: string;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: string | null;
};

export type AppUserRegistrationDetailDto = {
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: string;
  hasActiveSubscription: boolean;
};

export type AppDashboardDto = {
  appId: string;
  appName: string;
  appCode: string;
  description: string;
  status: number;
  ownerUserId: string | null;
  ownerUserName: string | null;
  totalPlans: number;
  activePlans: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalUsersRegistered: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalWebhookEndpoints: number;
  activeWebhookEndpoints: number;
  totalRevenue: number | null;
  totalRevenueCurrency: string | null;
  revenueLast30Days: number | null;
  revenueLast30DaysCurrency: string | null;
  revenueLast7Days: number | null;
  revenueLast7DaysCurrency: string | null;
  plans: AppPlanDetailDto[];
  subscriptions: AppSubscriptionDetailDto[];
  features: AppFeatureDetailDto[];
  apiKeys: AppApiKeyDetailDto[];
  webhookEndpoints: AppWebhookDetailDto[];
  userRegistrations: AppUserRegistrationDetailDto[];
  lastSubscriptionCreated: string | null;
  lastUserRegistered: string | null;
  lastInvoiceCreated: string | null;
  lastFeatureCreated: string | null;
};
