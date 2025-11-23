import { getFeatureById } from "@/lib/featuresService";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditFeaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  let feature = null;
  try {
    feature = await getFeatureById(id);
  } catch {
    notFound();
  }
  if (!feature) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Özellik Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Özellik bilgilerini ve ilgili tüm verileri düzenleyin
        </p>
      </div>
      <EditForm feature={feature} />
    </div>
  );
}

