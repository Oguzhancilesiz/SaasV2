import { api } from "./api";
import type { ApiKeyDto, ApiKeyAddDto, ApiKeyUpdateDto } from "@/types/apikey";

export async function getAllApiKeys(appId?: string, includeExpired?: boolean, includeDeleted?: boolean): Promise<ApiKeyDto[]> {
  const params = new URLSearchParams();
  if (appId) params.set("appId", appId);
  if (includeExpired) params.set("includeExpired", "true");
  if (includeDeleted) params.set("includeDeleted", "true");
  const queryString = params.toString();
  return api<ApiKeyDto[]>(`/apikeys${queryString ? `?${queryString}` : ""}`);
}

export async function getApiKeyById(id: string): Promise<ApiKeyDto> {
  return api<ApiKeyDto>(`/apikeys/${id}`);
}

export async function getApiKeyByPrefix(appId: string, prefix: string): Promise<ApiKeyDto> {
  return api<ApiKeyDto>(`/apikeys/by-prefix/${appId}/${encodeURIComponent(prefix)}`);
}

export async function createApiKey(data: ApiKeyAddDto): Promise<ApiKeyDto> {
  return api<ApiKeyDto>("/apikeys", {
    method: "POST",
    json: data,
  });
}

export async function updateApiKey(id: string, data: ApiKeyUpdateDto): Promise<void> {
  return api<void>(`/apikeys/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function revokeApiKey(id: string): Promise<void> {
  return api<void>(`/apikeys/${id}/revoke`, {
    method: "POST",
  });
}

export async function touchApiKey(id: string): Promise<void> {
  return api<void>(`/apikeys/${id}/touch`, {
    method: "POST",
  });
}

export async function deleteApiKey(id: string): Promise<void> {
  return api<void>(`/apikeys/${id}`, {
    method: "DELETE",
  });
}

