import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams?: {
    returnUrl?: string;
  };
};

export default async function LoginPage(props: LoginPageProps) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Hata durumunda null olarak devam et
    console.error("Login page error:", error);
  }

  const requestedReturnUrl =
    props.searchParams && "then" in props.searchParams
      ? undefined
      : props.searchParams?.returnUrl;

  const returnUrl =
    requestedReturnUrl && requestedReturnUrl.startsWith("/")
      ? requestedReturnUrl
      : undefined;

  // redirect() bir exception fırlatır, bu yüzden try-catch dışında olmalı
  if (user) {
    redirect(returnUrl || "/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-neutral-100">Yönetici Paneline Giriş</h1>
          <p className="text-neutral-400 text-sm">Admin hesabınızla oturum açın.</p>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 p-8 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur">
          <LoginForm returnUrl={returnUrl} />
        </div>
        <p className="text-center text-xs text-neutral-500">
          Hesabınız yoksa sistem yöneticinizle iletişime geçin.
        </p>
      </div>
    </div>
  );
}

