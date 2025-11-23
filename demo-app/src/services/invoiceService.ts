import { api } from './api';

export interface Invoice {
  id: string;
  appId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  currency: number; // CurrencyCode enum
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: number; // PaymentStatus enum
  paymentProvider?: string;
  paymentReference?: string;
  dueDate?: string;
  paidAt?: string;
  failedAt?: string;
  requiresAction: boolean;
  nextRetryAt?: string;
  paymentAttemptCount: number;
  lastAttemptAt?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  createdDate: string;
  modifiedDate: string;
  status: number;
}

export const invoiceService = {
  // Get all invoices for a user
  getByUser: async (userId: string, periodStart?: string, periodEnd?: string) => {
    const params = new URLSearchParams();
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    
    const query = params.toString();
    return api.get<Invoice[]>(`/invoices/by-user/${userId}${query ? `?${query}` : ''}`);
  },

  // Get invoice by ID
  getById: async (id: string) => {
    return api.get<Invoice>(`/invoices/${id}`);
  },

  // Get invoice lines
  getLines: async (id: string) => {
    return api.get<any[]>(`/invoices/${id}/lines`);
  },
};

