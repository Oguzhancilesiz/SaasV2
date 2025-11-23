export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-950/70 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-6 text-neutral-100">
        <div className="h-14 w-14 rounded-full border-4 border-blue-500/60 border-t-transparent animate-spin" />
        <span className="text-sm tracking-wide uppercase text-neutral-300">Yükleniyor…</span>
      </div>
    </div>
  );
}

