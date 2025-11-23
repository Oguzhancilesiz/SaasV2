import { Status } from "./app";
import { RenewalPolicy } from "./plan";

export type SubscriptionDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  userId: string;
  planId: string;
  planPriceId: string | null;
  currency: string;
  unitPrice: number;
  startAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  endAt: string | null;
  renewAt: string | null;
  renewalPolicy: RenewalPolicy;
  renewalAttemptCount: number;
  lastInvoicedAt: string | null;
  lastInvoiceId: string | null;
  cancellationReason: string | null;
  externalPaymentRef: string | null;
};

export type SubscriptionAddDto = {
  appId: string;
  userId: string;
  planId: string;
  startAt?: string;
  endAt?: string | null;
  renewAt?: string | null;
  renewalPolicy?: RenewalPolicy;
  externalPaymentRef?: string | null;
};

export type SubscriptionUpdateDto = {
  id: string;
  appId: string;
  userId: string;
  planId: string;
  startAt: string;
  endAt?: string | null;
  renewAt?: string | null;
  renewalPolicy: RenewalPolicy;
  externalPaymentRef?: string | null;
};

export type SubscriptionChangeLogDto = {
  id: string;
  subscriptionId: string;
  appId: string;
  userId: string;
  changeType: "Created" | "Renewed" | "PlanChanged" | "Cancelled" | "Reactivated" | "PriceUpdated" | "ManualAdjustment";
  oldPlanId: string | null;
  newPlanId: string | null;
  invoiceId: string | null;
  triggeredByUserId: string | null;
  effectiveDate: string;
  oldAmount: number | null;
  newAmount: number | null;
  currency: string | null;
  reason: string | null;
  metadata: string | null;
  createdDate: string;
};

