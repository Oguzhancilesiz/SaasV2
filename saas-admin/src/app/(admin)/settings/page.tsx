import SettingsClient from "./SettingsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return <SettingsClient />;
}
