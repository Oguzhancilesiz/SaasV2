// src/app/(admin)/layout.tsx
import { redirect } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Hata durumunda null olarak devam et, login'e yönlendirilecek
    console.error("Admin layout error:", error);
  }

  // redirect() bir exception fırlatır, bu yüzden try-catch dışında olmalı
  if (!user || !user.roles.includes("Admin")) {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
