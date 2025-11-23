"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-neutral-100">Kritik Hata</h1>
              <p className="text-neutral-400 text-sm">
                {error.message || "Uygulamada kritik bir hata oluştu"}
              </p>
            </div>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

