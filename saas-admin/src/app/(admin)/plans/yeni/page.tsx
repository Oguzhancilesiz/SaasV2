import { getAllApps } from "@/lib/appsService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlan } from "@/lib/plansService";
import CreateForm from "./CreateForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCodeServer(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

async function createPlanAction(formData: FormData) {
  "use server";
  const appId = String(formData.get("appId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  let code = String(formData.get("code") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const isPublic = formData.get("isPublic") === "on";
  const isFree = formData.get("isFree") === "on";
  const trialDays = Number(formData.get("trialDays") || "0");
  const billingPeriod = Number(formData.get("billingPeriod") || "3");
  const renewalPolicy = Number(formData.get("renewalPolicy") || "2");

  if (!appId) throw new Error("Uygulama seçimi zorunlu.");
  if (!name) throw new Error("Ad zorunlu.");
  if (!code) code = toCodeServer(name);

  await createPlan({
    appId,
    name,
    code,
    description: description || null,
    isPublic,
    isFree,
    trialDays,
    billingPeriod,
    renewalPolicy,
  });

  revalidatePath("/plans");
  redirect(`/plans?appId=${appId}&notification=${encodeURIComponent("Plan başarıyla oluşturuldu")}&type=success`);
}

export default async function NewPlanPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const apps = await getAllApps();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">Yeni Plan</h1>
      <CreateForm action={createPlanAction} apps={apps} defaultAppId={appId} />
    </div>
  );
}

