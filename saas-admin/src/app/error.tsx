"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-neutral-100">Bir hata oluştu</h1>
          <p className="text-neutral-400 text-sm">
            {error.message || "Beklenmeyen bir hata oluştu"}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
          >
            Tekrar Dene
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-lg transition"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}

