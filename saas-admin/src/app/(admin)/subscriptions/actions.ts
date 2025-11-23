"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteSubscription, cancelSubscription } from "@/lib/subscriptionsService";

export async function deleteSubscriptionAction(id: string) {
  await deleteSubscription(id);
  revalidatePath("/subscriptions");
  redirect("/subscriptions?notification=" + encodeURIComponent("Abonelik başarıyla silindi") + "&type=success");
}

export async function cancelSubscriptionAction(id: string) {
  await cancelSubscription(id, { endAt: null, reason: null });
  revalidatePath("/subscriptions");
  redirect("/subscriptions?notification=" + encodeURIComponent("Abonelik iptal edildi") + "&type=success");
}

