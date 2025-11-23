import { getRoleById } from "@/lib/rolesService";
import EditForm from "./EditForm";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const role = await getRoleById(id).catch(() => null);

  if (!role) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Rolü Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Rol bilgilerini güncelleyin
        </p>
      </div>
      <EditForm role={role} />
    </div>
  );
}

