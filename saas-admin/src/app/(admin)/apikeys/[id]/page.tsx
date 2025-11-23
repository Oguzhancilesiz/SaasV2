import { getApiKeyById } from "@/lib/apikeysService";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditApiKeyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  let apiKey = null;
  try {
    apiKey = await getApiKeyById(id);
  } catch {
    notFound();
  }
  if (!apiKey) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">API Anahtarı Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          API anahtarı bilgilerini düzenleyin
        </p>
      </div>
      <EditForm apiKey={apiKey} />
    </div>
  );
}

