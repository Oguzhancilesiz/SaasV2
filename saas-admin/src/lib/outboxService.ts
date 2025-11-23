import { api } from "./api";

export type OutboxMessageDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId?: string | null;
  type: string;
  payload: string;
  occurredAt: string;
  processedAt?: string | null;
  retries: number;
};

export type OutboxMessageAddDto = {
  appId?: string | null;
  type: string;
  payload: string;
  occurredAt?: string | null;
};

export type OutboxMessageUpdateDto = {
  id: string;
  appId?: string | null;
  type: string;
  payload: string;
  occurredAt: string;
  processedAt?: string | null;
  retries: number;
};

export async function getAllOutboxMessages(appId?: string, type?: string, pending?: boolean): Promise<OutboxMessageDto[]> {
  const params = new URLSearchParams();
  if (appId) params.append("appId", appId);
  if (type) params.append("type", type);
  if (pending !== undefined) params.append("pending", pending.toString());
  const query = params.toString();
  return api<OutboxMessageDto[]>(`/outbox${query ? `?${query}` : ""}`);
}

export async function getOutboxMessageById(id: string): Promise<OutboxMessageDto> {
  return api<OutboxMessageDto>(`/outbox/${id}`);
}

export async function getPendingOutboxMessages(take: number = 100, olderThanUtc?: string): Promise<OutboxMessageDto[]> {
  const params = new URLSearchParams();
  params.append("take", take.toString());
  if (olderThanUtc) params.append("olderThanUtc", olderThanUtc);
  return api<OutboxMessageDto[]>(`/outbox/pending?${params.toString()}`);
}

export async function createOutboxMessage(data: OutboxMessageAddDto): Promise<OutboxMessageDto> {
  return api<OutboxMessageDto>("/outbox", {
    method: "POST",
    json: data,
  });
}

export async function updateOutboxMessage(id: string, data: OutboxMessageUpdateDto): Promise<void> {
  return api<void>(`/outbox/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteOutboxMessage(id: string): Promise<void> {
  return api<void>(`/outbox/${id}`, {
    method: "DELETE",
  });
}

export async function markOutboxMessageProcessed(id: string, processedAtUtc?: string): Promise<void> {
  const params = new URLSearchParams();
  if (processedAtUtc) params.append("processedAtUtc", processedAtUtc);
  return api<void>(`/outbox/${id}/mark-processed${params.toString() ? `?${params.toString()}` : ""}`, {
    method: "POST",
  });
}

export async function incrementOutboxMessageRetry(id: string): Promise<number> {
  return api<number>(`/outbox/${id}/increment-retry`, {
    method: "POST",
  });
}

export async function cleanupProcessedOutboxMessages(olderThanUtc: string): Promise<number> {
  return api<number>(`/outbox/cleanup-processed?olderThanUtc=${encodeURIComponent(olderThanUtc)}`, {
    method: "POST",
  });
}

