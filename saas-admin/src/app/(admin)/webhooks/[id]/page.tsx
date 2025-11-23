import { getWebhookEndpointById } from "@/lib/webhooksService";
import { notFound } from "next/navigation";
import EditForm from "./EditForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditWebhookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  let webhook = null;
  try {
    webhook = await getWebhookEndpointById(id);
  } catch {
    notFound();
  }
  if (!webhook) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Webhook Endpoint Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Webhook endpoint bilgilerini düzenleyin
        </p>
      </div>
      <EditForm webhook={webhook} />
    </div>
  );
}

