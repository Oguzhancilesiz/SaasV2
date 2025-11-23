import { getSubscriptionById } from "@/lib/subscriptionsService";
import { getAllApps } from "@/lib/appsService";
import { getAllPlans } from "@/lib/plansService";
import { getAllUsers } from "@/lib/usersService";
import EditForm from "./EditForm";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [subscription, apps, plans, users] = await Promise.all([
    getSubscriptionById(id).catch(() => null),
    getAllApps().catch(() => []),
    getAllPlans().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  if (!subscription) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Aboneliği Düzenle</h1>
        <p className="text-neutral-400 text-sm">
          Abonelik bilgilerini güncelleyin
        </p>
      </div>
      <EditForm subscription={subscription} apps={apps} plans={plans} users={users} />
    </div>
  );
}

