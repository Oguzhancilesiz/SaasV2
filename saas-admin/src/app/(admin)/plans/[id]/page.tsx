import { getPlanById } from "@/lib/plansService";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  let plan = null;
  try {
    plan = await getPlanById(id);
  } catch {
    notFound();
  }
  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Plan Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Plan bilgilerini ve ilgili tüm verileri düzenleyin
        </p>
      </div>
      <EditForm plan={plan} />
    </div>
  );
}

