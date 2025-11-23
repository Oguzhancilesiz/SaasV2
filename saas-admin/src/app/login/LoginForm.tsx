"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/config";

type LoginFormProps = {
  returnUrl?: string;
};

const API_BASE_URL = getApiBaseUrl();

export default function LoginForm({ returnUrl }: LoginFormProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const trimmedUserName = userName.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUserName) {
      setError("Kullanıcı adı zorunludur.");
      setIsSubmitting(false);
      return;
    }

    if (!trimmedPassword) {
      setError("Şifre zorunludur.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userName: trimmedUserName, password: trimmedPassword, rememberMe }),
      });

      if (response.ok) {
        router.replace(returnUrl || "/dashboard");
        router.refresh();
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      let message = "Giriş başarısız.";

      if (contentType.includes("application/json")) {
        const data = await response.json().catch(() => null) as
          | { message?: string; errors?: Record<string, string[] | undefined> }
          | null;

        if (data?.errors) {
          const firstError = Object.values(data.errors).flat().find((m) => !!m);
          if (firstError) {
            message = firstError;
          }
        }

        if (data?.message) {
          message = data.message;
        }
      } else {
        const text = await response.text().catch(() => "");
        if (text) {
          message = text;
        }
      }

      setError(message);
    } catch (err) {
      setError("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="userName" className="text-sm font-medium text-neutral-200">
            Kullanıcı adı veya e-posta
          </label>
          <input
            id="userName"
            type="text"
            autoComplete="username"
            className="w-full px-4 py-3 rounded-xl bg-neutral-950/50 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="admin"
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-neutral-200">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl bg-neutral-950/50 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          Beni hatırla (1 hafta)
        </label>
        <span className="text-xs text-neutral-500">Varsayılan şifre: Ogzhn.123</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-neutral-950 transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>

      <p className="text-xs text-neutral-500 text-center">
        Girişte sorun yaşarsanız sistem yöneticinizden destek isteyin.
      </p>
    </form>
  );
}

