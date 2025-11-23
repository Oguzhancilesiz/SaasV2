// Status Enum (Backend'den)
export enum Status {
  Active = 1,
  DeActive = 2,
  Approved = 6,
  Deleted = 4,
  UnApproved = 3,
  Cancel = 7,
  Commit = 14,
}

// BillingPeriod Enum
export enum BillingPeriod {
  OneTime = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
  Yearly = 4,
}

// CurrencyCode Enum
export enum CurrencyCode {
  TRY = 949,
  USD = 840,
  EUR = 978,
  GBP = 826,
}

// AppEnvironment Enum
export enum AppEnvironment {
  Sandbox = 0,
  Production = 1,
}

// AppDTO - Backend'den gelen ana tip
export type AppDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  name: string;
  code: string;
  description: string | null;
  ownerUserId: string | null;
  environment: AppEnvironment;
  workspaceKey: string | null;
  ownerContactEmail: string | null;
  billingContactEmail: string | null;
  notes: string | null;
};

// AppAddDTO - Yeni uygulama oluşturma
export type AppAddDto = {
  name: string;
  code: string;
  description?: string | null;
  ownerUserId?: string | null;
  environment?: AppEnvironment;
  workspaceKey?: string | null;
  ownerContactEmail?: string | null;
  billingContactEmail?: string | null;
  notes?: string | null;
};

// AppUpdateDTO - Uygulama güncelleme
export type AppUpdateDto = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  ownerUserId?: string | null;
  environment: AppEnvironment;
  workspaceKey?: string | null;
  ownerContactEmail?: string | null;
  billingContactEmail?: string | null;
  notes?: string | null;
};

// AppFilterRequest - Backend filtreleme isteği
export type AppFilterRequest = {
  searchQuery?: string | null;
  status?: string | null;
  sort?: string | null;
  page?: number;
  pageSize?: number;
};

// AppFilterResponse - Backend filtreleme yanıtı
export type AppFilterResponse = {
  items: AppDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

// AppDashboardSummary - Dashboard özet bilgileri
export type AppDashboardSummary = {
  appId: string;
  plansActive: number;
  plansInactive: number;
  cheapestPrice: number | null;
  cheapestPriceCurrency: string | null;
  highestPrice: number | null;
  highestPriceCurrency: string | null;
  subscriptionsTotal: number;
  subscriptionsActive: number;
  revenueLast30d: number | null;
  revenueCurrency: string | null;
  apiKeysActive: number;
  latestApiKeyCreated?: string | null;
  latestApiKeyMasked?: string | null;
  webhookEndpointsActive: number;
  lastWebhookDeliveryAt?: string | null;
  lastWebhookDeliveryStatus?: string | null;
  usageEventsLast7d: number;
  registrationsLast7d: number;
};

// PlanPriceSeed - Provision için plan fiyatı
export type PlanPriceSeed = {
  currency: CurrencyCode;
  amount: number;
  effectiveFrom?: string | null;
};

// PlanSeed - Provision için plan
export type PlanSeed = {
  name: string;
  code: string;
  description?: string | null;
  trialDays: number;
  graceDays?: number | null;
  billingInterval?: BillingPeriod | null;
  active: boolean;
  prices: PlanPriceSeed[];
  featureIds: string[];
};

// AppProvisionRequest - Uygulama sağlama isteği
export type AppProvisionRequest = {
  name: string;
  code: string;
  description?: string | null;
  ownerUserId?: string | null;
  environment?: AppEnvironment;
  workspaceKey?: string | null;
  ownerContactEmail?: string | null;
  billingContactEmail?: string | null;
  notes?: string | null;
  plans: PlanSeed[];
  createApiKey: boolean;
  apiKeyName?: string;
  apiKeyExpiresAt?: string | null;
  createWebhook: boolean;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
};

// AppProvisionResult - Uygulama sağlama sonucu
export type AppProvisionResult = {
  appId: string;
  planIds: string[];
  apiKeyCreated: boolean;
  apiKeyRaw?: string | null;
  apiKeyMasked?: string | null;
  apiKeyExpiresAt?: string | null;
  webhookCreated: boolean;
  webhookEndpointId?: string | null;
};

// DashboardBatchRequest - Toplu dashboard isteği
export type DashboardBatchRequest = {
  ids: string[];
};
