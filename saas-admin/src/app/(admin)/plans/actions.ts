"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deletePlan as deletePlanService, togglePlanVisibility as toggleVisibilityService, setPlanFree as setFreeService } from "@/lib/plansService";

export async function deletePlanAction(id: string) {
  "use server";
  await deletePlanService(id);
  revalidatePath("/plans");
  redirect("/plans?notification=" + encodeURIComponent("Plan başarıyla silindi") + "&type=success");
}

export async function togglePlanVisibilityAction(id: string, isPublic: boolean) {
  "use server";
  await toggleVisibilityService(id, isPublic);
  revalidatePath("/plans");
  redirect("/plans?notification=" + encodeURIComponent("Plan görünürlüğü güncellendi") + "&type=success");
}

export async function setPlanFreeAction(id: string, isFree: boolean) {
  "use server";
  await setFreeService(id, isFree);
  revalidatePath("/plans");
  redirect("/plans?notification=" + encodeURIComponent("Plan ücretsizlik durumu güncellendi") + "&type=success");
}

