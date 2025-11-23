import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Hata durumunda null olarak devam et, login'e yönlendirilecek
    console.error("Home page error:", error);
  }
  
  // redirect() bir exception fırlatır, bu yüzden try-catch dışında olmalı
  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
