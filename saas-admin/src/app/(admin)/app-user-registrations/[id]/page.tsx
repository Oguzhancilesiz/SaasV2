import { getAppUserRegistrationById } from "@/lib/appUserRegistrationsService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import EditForm from "./EditForm";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditAppUserRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [registration, apps, users] = await Promise.all([
    getAppUserRegistrationById(id).catch(() => null),
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  if (!registration) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Kullanıcı Kaydını Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Kullanıcı kaydı bilgilerini güncelleyin
        </p>
      </div>
      <EditForm registration={registration} apps={apps} users={users} />
    </div>
  );
}

