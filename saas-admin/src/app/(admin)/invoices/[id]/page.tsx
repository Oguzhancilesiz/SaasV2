import { getInvoiceById } from "@/lib/invoicesService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import EditForm from "./EditForm";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [invoice, apps, users] = await Promise.all([
    getInvoiceById(id).catch(() => null),
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Faturayı Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Fatura bilgilerini güncelleyin
        </p>
      </div>
      <EditForm invoice={invoice} apps={apps} users={users} />
    </div>
  );
}

