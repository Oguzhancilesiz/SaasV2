import { getAllApps } from "@/lib/appsService";
import CreateForm from "./CreateForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewFeaturePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;

  const apps = await getAllApps();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Yeni Özellik</h1>
        <p className="text-neutral-400 text-sm">
          Yeni bir özellik oluşturun
        </p>
      </div>
      <CreateForm apps={apps} defaultAppId={appId} />
    </div>
  );
}

