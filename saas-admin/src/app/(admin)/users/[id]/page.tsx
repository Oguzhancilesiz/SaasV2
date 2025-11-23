import { getUserById } from "@/lib/usersService";
import { getAllRoles } from "@/lib/rolesService";
import UserDetailClient from "./UserDetailClient";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [user, roles] = await Promise.all([
    getUserById(id).catch(() => null),
    getAllRoles().catch(() => []),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Kullanıcı Detayları</h1>
        <p className="text-neutral-400 text-sm">
          {user.email || user.userName}
        </p>
      </div>
      <UserDetailClient user={user} roles={roles} />
    </div>
  );
}

