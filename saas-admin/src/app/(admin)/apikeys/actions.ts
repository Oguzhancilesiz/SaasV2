"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteApiKey, revokeApiKey } from "@/lib/apikeysService";

export async function deleteApiKeyAction(id: string) {
  await deleteApiKey(id);
  revalidatePath("/apikeys");
  redirect("/apikeys?notification=" + encodeURIComponent("API anahtarı başarıyla silindi") + "&type=success");
}

export async function revokeApiKeyAction(id: string) {
  await revokeApiKey(id);
  revalidatePath("/apikeys");
  redirect("/apikeys?notification=" + encodeURIComponent("API anahtarı iptal edildi") + "&type=success");
}

