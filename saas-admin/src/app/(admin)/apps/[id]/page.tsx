import { api } from "@/lib/api";
import type { AppDto } from "@/types/app";
import type { AppDashboardDto } from "@/types/dashboard";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* PAGE */
export default async function EditAppPage({
  params,
}: {
  // Next 16: params bir Promise
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;             // <-- ÖNEMLİ: params'ı await et
  if (!id) notFound();

  let app: AppDto | null = null;
  let dashboard: AppDashboardDto | null = null;
  
  try {
    [app, dashboard] = await Promise.all([
      api<AppDto>(`/apps/${id}`, { cache: "no-store" }),
      api<AppDashboardDto>(`/dashboard/app/${id}`, { cache: "no-store" }).catch(() => null),
    ]);
  } catch {
    notFound();
  }
  
  if (!app) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Uygulama Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Uygulama bilgilerini ve ilgili tüm verileri düzenleyin
        </p>
      </div>
      <EditForm app={app} dashboard={dashboard} />
    </div>
  );
}
