import WizardForm from "./WizardForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function NewAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Yeni Uygulama</h1>
        <p className="text-neutral-400 text-sm">
          Adım adım uygulamanızı oluşturun ve ilgili tüm öğeleri ekleyin
        </p>
      </div>
      <WizardForm />
    </div>
  );
}
