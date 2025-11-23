"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteUser, activateUser, unapproveUser } from "@/lib/usersService";

export async function deleteUserAction(id: string) {
  await deleteUser(id);
  revalidatePath("/users");
  redirect("/users?notification=" + encodeURIComponent("Kullanıcı başarıyla silindi") + "&type=success");
}

export async function activateUserAction(id: string) {
  await activateUser(id);
  revalidatePath("/users");
  redirect("/users?notification=" + encodeURIComponent("Kullanıcı aktif edildi") + "&type=success");
}

export async function unapproveUserAction(id: string) {
  await unapproveUser(id);
  revalidatePath("/users");
  redirect("/users?notification=" + encodeURIComponent("Kullanıcı pasife alındı") + "&type=success");
}

