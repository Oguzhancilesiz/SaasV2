import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import CreateForm from "./CreateForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewAppUserRegistrationPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const defaultAppId = params.appId;
  const defaultUserId = params.userId;

  const [apps, users] = await Promise.all([
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Yeni Kullanıcı Kaydı</h1>
        <p className="text-neutral-400 text-sm">
          Yeni bir kullanıcı kaydı oluşturun
        </p>
      </div>
      <CreateForm apps={apps} users={users} defaultAppId={defaultAppId} defaultUserId={defaultUserId} />
    </div>
  );
}

