// Subscription Types
export interface Subscription {
  id: string;
  appId: string;
  userId: string;
  planId: string;
  planPriceId?: string;
  currency: number;
  unitPrice: number;
  startAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  endAt?: string;
  renewAt?: string;
  renewalPolicy: number;
  renewalAttemptCount: number;
  lastInvoicedAt?: string;
  lastInvoiceId?: string;
  cancellationReason?: string;
  externalPaymentRef?: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  items?: SubscriptionItem[];
  planName?: string; // Plan adı (API'den gelirse)
}

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  featureId: string;
  quantity: number;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  featureName?: string; // Özellik adı (API'den gelirse)
}

