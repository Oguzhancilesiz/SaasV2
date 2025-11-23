import { api } from "./api";

export type WebhookEndpointDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  appId: string;
  url: string;
  secret: string;
  isActive: boolean;
  eventTypesCsv: string;
};

export type WebhookEndpointAddDto = {
  appId: string;
  url: string;
  secret?: string | null;
  isActive?: boolean;
  eventTypesCsv?: string | null;
};

export type WebhookEndpointUpdateDto = {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
  eventTypesCsv: string;
};

export async function getAllWebhookEndpoints(appId?: string): Promise<WebhookEndpointDto[]> {
  const params = appId ? `?appId=${appId}` : "";
  return api<WebhookEndpointDto[]>(`/webhook-endpoints${params}`);
}

export async function getWebhookEndpointById(id: string): Promise<WebhookEndpointDto> {
  return api<WebhookEndpointDto>(`/webhook-endpoints/${id}`);
}

export async function createWebhookEndpoint(data: WebhookEndpointAddDto): Promise<WebhookEndpointDto> {
  return api<WebhookEndpointDto>("/webhook-endpoints", {
    method: "POST",
    json: data,
  });
}

export async function updateWebhookEndpoint(id: string, data: WebhookEndpointUpdateDto): Promise<void> {
  return api<void>(`/webhook-endpoints/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteWebhookEndpoint(id: string): Promise<void> {
  return api<void>(`/webhook-endpoints/${id}`, {
    method: "DELETE",
  });
}

export async function activateWebhookEndpoint(id: string): Promise<void> {
  return api<void>(`/webhook-endpoints/${id}/activate`, {
    method: "POST",
  });
}

export async function deactivateWebhookEndpoint(id: string): Promise<void> {
  return api<void>(`/webhook-endpoints/${id}/deactivate`, {
    method: "POST",
  });
}

export async function rotateSecretWebhookEndpoint(id: string): Promise<void> {
  return api<void>(`/webhook-endpoints/${id}/rotate-secret`, {
    method: "POST",
  });
}

export async function testPingWebhookEndpoint(id: string): Promise<WebhookEndpointDto> {
  return api<WebhookEndpointDto>(`/webhook-endpoints/${id}/test-ping`, {
    method: "POST",
  });
}

