import { api } from "./api";
import type { SubscriptionDto, SubscriptionAddDto, SubscriptionUpdateDto, SubscriptionChangeLogDto } from "@/types/subscription";

export async function getAllSubscriptions(appId?: string, userId?: string): Promise<SubscriptionDto[]> {
  const params = new URLSearchParams();
  if (appId) params.set("appId", appId);
  if (userId) params.set("userId", userId);
  const queryString = params.toString();
  return api<SubscriptionDto[]>(`/subscriptions${queryString ? `?${queryString}` : ""}`);
}

export async function getSubscriptionById(id: string): Promise<SubscriptionDto> {
  return api<SubscriptionDto>(`/subscriptions/${id}`);
}

export async function getActiveSubscription(appId: string, userId: string): Promise<SubscriptionDto | null> {
  try {
    return await api<SubscriptionDto>(`/subscriptions/active/${appId}/${userId}`);
  } catch {
    return null;
  }
}

export async function getSubscriptionsByUser(userId: string): Promise<SubscriptionDto[]> {
  return api<SubscriptionDto[]>(`/subscriptions/by-user/${userId}`);
}

export async function getSubscriptionsByApp(appId: string): Promise<SubscriptionDto[]> {
  return api<SubscriptionDto[]>(`/subscriptions/by-app/${appId}`);
}

export async function createSubscription(data: SubscriptionAddDto): Promise<SubscriptionDto> {
  return api<SubscriptionDto>("/subscriptions", {
    method: "POST",
    json: data,
  });
}

export async function updateSubscription(id: string, data: SubscriptionUpdateDto): Promise<void> {
  return api<void>(`/subscriptions/${id}`, {
    method: "PUT",
    json: { ...data, id },
  });
}

type ChangePlanPayload = {
  newPlanId: string;
  reason?: string | null;
};

type CancelSubscriptionPayload = {
  endAt?: string | null;
  reason?: string | null;
};

export async function changeSubscriptionPlan(id: string, payload: ChangePlanPayload): Promise<SubscriptionDto> {
  const body = {
    newPlanId: payload.newPlanId,
    reason: payload.reason ?? null,
  };

  return api<SubscriptionDto>(`/subscriptions/${id}/change-plan`, {
    method: "POST",
    json: body,
  });
}

export async function cancelSubscription(id: string, payload: CancelSubscriptionPayload = {}): Promise<void> {
  const body = {
    endAt: payload.endAt ?? null,
    reason: payload.reason ?? null,
  };

  return api<void>(`/subscriptions/${id}/cancel`, {
    method: "POST",
    json: body,
  });
}

export async function deleteSubscription(id: string): Promise<void> {
  return api<void>(`/subscriptions/${id}`, {
    method: "DELETE",
  });
}

export async function rebuildSubscriptionItems(id: string): Promise<void> {
  return api<void>(`/subscriptions/${id}/rebuild-items`, {
    method: "POST",
  });
}

export async function getSubscriptionChanges(id: string): Promise<SubscriptionChangeLogDto[]> {
  return api<SubscriptionChangeLogDto[]>(`/subscriptions/${id}/changes`);
}

