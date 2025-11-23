import { api } from "./api";

export type UsageRecordDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  userId: string;
  subscriptionId?: string | null;
  featureId: string;
  quantity: number;
  occurredAt: string;
  correlationId: string;
  metadataJson?: string | null;
};

export type UsageRecordAddDto = {
  appId: string;
  userId: string;
  subscriptionId?: string | null;
  featureId: string;
  quantity: number;
  occurredAt?: string | null;
  correlationId: string;
  metadataJson?: string | null;
};

export type UsageRecordUpdateDto = {
  id: string;
  appId: string;
  userId: string;
  subscriptionId?: string | null;
  featureId: string;
  quantity: number;
  occurredAt: string;
  correlationId: string;
  metadataJson?: string | null;
};

export async function getAllUsageRecords(appId?: string, userId?: string, featureId?: string): Promise<UsageRecordDto[]> {
  const params = new URLSearchParams();
  if (appId) params.append("appId", appId);
  if (userId) params.append("userId", userId);
  if (featureId) params.append("featureId", featureId);
  const query = params.toString();
  return api<UsageRecordDto[]>(`/usage-records${query ? `?${query}` : ""}`);
}

export async function getUsageRecordById(id: string): Promise<UsageRecordDto> {
  return api<UsageRecordDto>(`/usage-records/${id}`);
}

export async function createUsageRecord(data: UsageRecordAddDto): Promise<void> {
  return api<void>("/usage-records", {
    method: "POST",
    json: data,
  });
}

export async function updateUsageRecord(id: string, data: UsageRecordUpdateDto): Promise<void> {
  return api<void>(`/usage-records/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteUsageRecord(id: string): Promise<void> {
  return api<void>(`/usage-records/${id}`, {
    method: "DELETE",
  });
}

export async function getRecentUsageRecords(appId: string, userId: string, take: number = 100): Promise<UsageRecordDto[]> {
  return api<UsageRecordDto[]>(`/usage-records/recent/${appId}/${userId}?take=${take}`);
}

