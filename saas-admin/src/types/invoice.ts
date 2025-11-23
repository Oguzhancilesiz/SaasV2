import { Status, CurrencyCode } from "./app";

export enum PaymentStatus {
  Pending = 0,
  Processing = 1,
  Succeeded = 2,
  Failed = 3,
  Canceled = 4,
  RequiresAction = 5,
}

export type InvoiceDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  currency: CurrencyCode;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentProvider: string | null;
  paymentReference: string | null;
  dueDate: string | null;
  paidAt: string | null;
  failedAt: string | null;
  requiresAction: boolean;
  nextRetryAt: string | null;
  paymentAttemptCount: number;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

export type InvoiceLineDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  invoiceId: string;
  description: string;
  planId: string | null;
  featureId: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoicePaymentAttemptDto = {
  id: string;
  status: Status;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  invoiceId: string;
  attemptedAt: string;
  amount: number;
  currency: CurrencyCode;
  resultStatus: PaymentStatus;
  paymentProvider: string | null;
  providerReference: string | null;
  providerResponseCode: string | null;
  providerResponseMessage: string | null;
  requiresAction: boolean;
};

