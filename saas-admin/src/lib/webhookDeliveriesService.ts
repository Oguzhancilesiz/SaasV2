import { api } from "./api";

export type WebhookDeliveryDto = {
  id: string;
  status: number;
  createdDate: string;
  modifiedDate: string;
  autoID: number;
  webhookEndpointId: string;
  eventType: string;
  payload: string;
  attemptedAt: string;
  responseStatus: number;
  responseBody?: string | null;
  retries: number;
};

export type WebhookDeliveryAddDto = {
  webhookEndpointId: string;
  eventType: string;
  payload: string;
  attemptedAt?: string | null;
  responseStatus: number;
  responseBody?: string | null;
  retries: number;
};

export type WebhookDeliveryUpdateDto = {
  id: string;
  webhookEndpointId: string;
  eventType: string;
  payload: string;
  attemptedAt: string;
  responseStatus: number;
  responseBody?: string | null;
  retries: number;
};

export async function getAllWebhookDeliveries(webhookEndpointId?: string, eventType?: string): Promise<WebhookDeliveryDto[]> {
  const params = new URLSearchParams();
  if (webhookEndpointId) params.append("webhookEndpointId", webhookEndpointId);
  if (eventType) params.append("eventType", eventType);
  const query = params.toString();
  return api<WebhookDeliveryDto[]>(`/webhook-deliveries${query ? `?${query}` : ""}`);
}

export async function getWebhookDeliveryById(id: string): Promise<WebhookDeliveryDto> {
  return api<WebhookDeliveryDto>(`/webhook-deliveries/${id}`);
}

export async function createWebhookDelivery(data: WebhookDeliveryAddDto): Promise<void> {
  return api<void>("/webhook-deliveries", {
    method: "POST",
    json: data,
  });
}

export async function updateWebhookDelivery(id: string, data: WebhookDeliveryUpdateDto): Promise<void> {
  return api<void>(`/webhook-deliveries/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

export async function deleteWebhookDelivery(id: string): Promise<void> {
  return api<void>(`/webhook-deliveries/${id}`, {
    method: "DELETE",
  });
}

export async function retryFailedWebhookDeliveries(endpointId: string, maxAttempts: number = 3): Promise<number> {
  return api<number>(`/webhook-deliveries/${endpointId}/retry-failed?maxAttempts=${maxAttempts}`, {
    method: "POST",
  });
}

