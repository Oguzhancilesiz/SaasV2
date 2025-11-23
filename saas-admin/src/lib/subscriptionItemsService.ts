import { api } from "./api";
import type { SubscriptionItemDto } from "@/types/subscriptionItem";

export async function getSubscriptionItems(subscriptionId: string): Promise<SubscriptionItemDto[]> {
  try {
    return await api<SubscriptionItemDto[]>(`/subscriptions/${subscriptionId}/items`);
  } catch {
    return [];
  }
}

