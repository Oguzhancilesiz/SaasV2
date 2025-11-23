import { api } from "./api";
import type { InvoiceDto, InvoiceLineDto, InvoicePaymentAttemptDto } from "@/types/invoice";

export async function getAllInvoices(): Promise<InvoiceDto[]> {
  try {
    return await api<InvoiceDto[]>("/invoices");
  } catch {
    return [];
  }
}

export async function getInvoicesByUser(userId: string): Promise<InvoiceDto[]> {
  try {
    return await api<InvoiceDto[]>(`/invoices/by-user/${userId}`);
  } catch {
    return [];
  }
}

export async function getInvoicesByApp(appId: string): Promise<InvoiceDto[]> {
  try {
    return await api<InvoiceDto[]>(`/invoices/by-app/${appId}`);
  } catch {
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceDto | null> {
  try {
    return await api<InvoiceDto>(`/invoices/${id}`);
  } catch {
    return null;
  }
}

export async function getInvoiceLines(invoiceId: string): Promise<InvoiceLineDto[]> {
  try {
    return await api<InvoiceLineDto[]>(`/invoices/${invoiceId}/lines`);
  } catch {
    return [];
  }
}

export type InvoiceAddDto = {
  appId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  currency: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus?: number;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  dueDate?: string | null;
  requiresAction?: boolean;
};

export type InvoiceUpdateDto = {
  id: string;
  currency: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: number;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  requiresAction?: boolean;
  nextRetryAt?: string | null;
  status: number;
};

export async function createInvoice(data: InvoiceAddDto): Promise<InvoiceDto> {
  return api<InvoiceDto>("/invoices", {
    method: "POST",
    json: data,
  });
}

export async function updateInvoice(id: string, data: InvoiceUpdateDto): Promise<void> {
  return api<void>(`/invoices/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  return api<void>(`/invoices/${id}`, {
    method: "DELETE",
  });
}

export async function recalculateInvoice(id: string): Promise<void> {
  return api<void>(`/invoices/${id}/recalculate`, {
    method: "POST",
  });
}

export async function getInvoicePaymentAttempts(invoiceId: string): Promise<InvoicePaymentAttemptDto[]> {
  try {
    return await api<InvoicePaymentAttemptDto[]>(`/invoices/${invoiceId}/attempts`);
  } catch {
    return [];
  }
}

export async function retryInvoicePayment(invoiceId: string, force = false): Promise<InvoiceDto> {
  return api<InvoiceDto>(`/invoices/${invoiceId}/retry`, {
    method: "POST",
    json: { force },
  });
}

export async function cancelInvoicePayment(invoiceId: string, reason?: string): Promise<InvoiceDto> {
  return api<InvoiceDto>(`/invoices/${invoiceId}/cancel`, {
    method: "POST",
    json: reason ? { reason } : {},
  });
}

