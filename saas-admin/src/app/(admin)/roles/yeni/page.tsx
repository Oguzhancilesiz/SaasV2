import CreateForm from "./CreateForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewRolePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Yeni Rol</h1>
        <p className="text-neutral-400 text-sm">
          Yeni bir rol oluşturun
        </p>
      </div>
      <CreateForm />
    </div>
  );
}

