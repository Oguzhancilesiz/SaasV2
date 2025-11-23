"use client";

import type { AppDto } from "@/types/app";
import type { AppDashboardDto } from "@/types/dashboard";
import { useState, useEffect, useTransition } from "react";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { 
  Save, X, ChevronDown, ChevronUp, Package, Zap, Key, Webhook, 
  Users, CreditCard, Plus, Trash2 
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Status, BillingPeriod, CurrencyCode, AppEnvironment } from "@/types/app";
import { RenewalPolicy } from "@/types/plan";
import { updateApp } from "@/lib/appsService";
import { getAllPlans, updatePlan, createPlan, deletePlan } from "@/lib/plansService";
import { getAllPlanPrices, updatePlanPrice, createPlanPrice, deletePlanPrice } from "@/lib/planPricesService";
import { getFeaturesByApp, updateFeature, createFeature, deleteFeature } from "@/lib/featuresService";
import { getAllApiKeys, updateApiKey, createApiKey, deleteApiKey } from "@/lib/apikeysService";
import { getAllWebhookEndpoints, updateWebhookEndpoint, createWebhookEndpoint, deleteWebhookEndpoint } from "@/lib/webhooksService";
import type { PlanDto, PlanUpdateDto, PlanAddDto } from "@/types/plan";
import type { PlanPriceDto, PlanPriceUpdateDto, PlanPriceAddDto } from "@/types/planPrice";
import type { FeatureDto } from "@/types/feature";
import type { FeatureUpdateDto } from "@/lib/featuresService";
import type { ApiKeyDto, ApiKeyUpdateDto, ApiKeyAddDto } from "@/types/apikey";
import type { WebhookEndpointDto, WebhookEndpointUpdateDto, WebhookEndpointAddDto } from "@/lib/webhooksService";

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

function TextareaBase(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(components.input, "min-h-[120px] resize-none", props.className)}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(components.input, props.className)} />
  );
}

interface AccordionSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({ title, icon: Icon, isOpen, onToggle, children }: AccordionSectionProps) {
  return (
    <div className={cn(components.card, "overflow-hidden")}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "hover:bg-neutral-800/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-400" />
          <h3 className={cn("text-lg font-semibold", text.primary)}>{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-neutral-800/50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function EditForm({
  app,
  dashboard,
}: {
  app: AppDto;
  dashboard: AppDashboardDto | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const { notifyError, notifySuccess } = useNotificationHelpers();

  // Accordion states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    app: true,
    plans: false,
    features: false,
    apikeys: false,
    webhooks: false,
  });

  // App state
  const [appData, setAppData] = useState({
    name: app.name,
    code: app.code,
    description: app.description || "",
    status: app.status,
    environment: app.environment ?? AppEnvironment.Production,
    workspaceKey: app.workspaceKey || "",
    ownerContactEmail: app.ownerContactEmail || "",
    billingContactEmail: app.billingContactEmail || "",
    notes: app.notes || "",
    ownerUserId: app.ownerUserId || "",
  });

  // Plans state
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [planPrices, setPlanPrices] = useState<Record<string, PlanPriceDto[]>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Features state
  const [features, setFeatures] = useState<FeatureDto[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyDto[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(true);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpointDto[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);

  // Load all related data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load plans
        const plansData = await getAllPlans(app.id);
        setPlans(plansData);
        
        // Load prices for each plan
        const pricesMap: Record<string, PlanPriceDto[]> = {};
        for (const plan of plansData) {
          const prices = await getAllPlanPrices(plan.id);
          pricesMap[plan.id] = prices;
        }
        setPlanPrices(pricesMap);
        setLoadingPlans(false);

        // Load features
        const featuresData = await getFeaturesByApp(app.id);
        setFeatures(featuresData);
        setLoadingFeatures(false);

        // Load API keys
        const apiKeysData = await getAllApiKeys(app.id);
        setApiKeys(apiKeysData);
        setLoadingApiKeys(false);

        // Load webhooks
        const webhooksData = await getAllWebhookEndpoints(app.id);
        setWebhooks(webhooksData);
        setLoadingWebhooks(false);
      } catch (error: any) {
        notifyError("Veri yükleme hatası", error?.message || "Veriler yüklenirken bir hata oluştu");
      }
    };

    loadData();
  }, [app.id]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Save App
  const handleSaveApp = async () => {
    setSavingSection("app");
    setErr(null);
    try {
      const trimmedName = appData.name.trim();
      const trimmedCode = appData.code.trim();
      const trimmedDescription = appData.description.trim();
      const workspaceKeyValue = appData.workspaceKey.trim();
      const ownerEmailValue = appData.ownerContactEmail.trim();
      const billingEmailValue = appData.billingContactEmail.trim();
      const notesValue = appData.notes.trim();
      const ownerUserIdValue = appData.ownerUserId.trim();

      await updateApp(app.id, {
        id: app.id,
        name: trimmedName,
        code: trimmedCode,
        description: trimmedDescription || null,
        ownerUserId: ownerUserIdValue ? ownerUserIdValue : null,
        environment: appData.environment,
        workspaceKey: workspaceKeyValue ? workspaceKeyValue : null,
        ownerContactEmail: ownerEmailValue ? ownerEmailValue : null,
        billingContactEmail: billingEmailValue ? billingEmailValue : null,
        notes: notesValue ? notesValue : null,
      });
      notifySuccess("Başarılı", "Uygulama bilgileri güncellendi");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Güncelleme başarısız";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Plan
  const handleSavePlan = async (plan: PlanDto) => {
    setSavingSection(`plan-${plan.id}`);
    setErr(null);
    try {
      const updateData: PlanUpdateDto = {
        id: plan.id,
        appId: plan.appId,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        isPublic: plan.isPublic,
        isFree: plan.isFree,
        trialDays: plan.trialDays,
        billingPeriod: plan.billingPeriod,
        renewalPolicy: plan.renewalPolicy,
      };
      await updatePlan(plan.id, updateData);
      
      // Reload plans
      const updatedPlans = await getAllPlans(app.id);
      setPlans(updatedPlans);
      notifySuccess("Başarılı", "Plan güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "Plan güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Feature
  const handleSaveFeature = async (feature: FeatureDto) => {
    setSavingSection(`feature-${feature.id}`);
    setErr(null);
    try {
      const updateData: FeatureUpdateDto = {
        id: feature.id,
        appId: feature.appId,
        key: feature.key,
        name: feature.name,
        unit: feature.unit,
        description: feature.description,
      };
      await updateFeature(feature.id, updateData);
      
      // Reload features
      const updatedFeatures = await getFeaturesByApp(app.id);
      setFeatures(updatedFeatures);
      notifySuccess("Başarılı", "Özellik güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "Özellik güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save API Key
  const handleSaveApiKey = async (apiKey: ApiKeyDto) => {
    setSavingSection(`apikey-${apiKey.id}`);
    setErr(null);
    try {
      const updateData: ApiKeyUpdateDto = {
        id: apiKey.id,
        name: apiKey.name,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
      };
      await updateApiKey(apiKey.id, updateData);
      
      // Reload API keys
      const updatedApiKeys = await getAllApiKeys(app.id);
      setApiKeys(updatedApiKeys);
      notifySuccess("Başarılı", "API anahtarı güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "API anahtarı güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Webhook
  const handleSaveWebhook = async (webhook: WebhookEndpointDto) => {
    setSavingSection(`webhook-${webhook.id}`);
    setErr(null);
    try {
      const updateData: WebhookEndpointUpdateDto = {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        isActive: webhook.isActive,
        eventTypesCsv: webhook.eventTypesCsv,
      };
      await updateWebhookEndpoint(webhook.id, updateData);
      
      // Reload webhooks
      const updatedWebhooks = await getAllWebhookEndpoints(app.id);
      setWebhooks(updatedWebhooks);
      notifySuccess("Başarılı", "Webhook endpoint güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "Webhook endpoint güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Plan Price
  const handleSavePlanPrice = async (planId: string, price: PlanPriceDto) => {
    setSavingSection(`price-${price.id}`);
    setErr(null);
    try {
      const updateData: PlanPriceUpdateDto = {
        id: price.id,
        planId: price.planId,
        currency: price.currency,
        amount: price.amount,
        effectiveFrom: price.effectiveFrom,
        effectiveTo: price.effectiveTo,
        isCurrent: price.isCurrent,
      };
      await updatePlanPrice(price.id, updateData);
      
      // Reload prices for this plan
      const updatedPrices = await getAllPlanPrices(planId);
      setPlanPrices(prev => ({ ...prev, [planId]: updatedPrices }));
      notifySuccess("Başarılı", "Fiyat güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "Fiyat güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <div className="space-y-4">
      {err && (
        <div className={cn(
          "p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
        )}>
          <X className="w-5 h-5" />
          {err}
        </div>
      )}

      {/* App Information */}
      <AccordionSection
        title="Uygulama Bilgileri"
        icon={Package}
        isOpen={openSections.app}
        onToggle={() => toggleSection("app")}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Uygulama Adı *
              </label>
              <InputBase
                value={appData.name}
                onChange={(e) => setAppData({ ...appData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Kod *
              </label>
              <InputBase
                value={appData.code}
                onChange={(e) => setAppData({ ...appData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.secondary)}>
              Açıklama
            </label>
            <TextareaBase
              value={appData.description}
              onChange={(e) => setAppData({ ...appData, description: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="appStatus"
              checked={appData.status === Status.Active}
              onChange={(e) => setAppData({ ...appData, status: e.target.checked ? Status.Active : Status.DeActive })}
              className="w-5 h-5 rounded border-neutral-700 bg-neutral-800"
            />
            <label htmlFor="appStatus" className={cn("text-sm", text.secondary)}>
              Aktif
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Ortam *
              </label>
              <SelectBase
                value={appData.environment}
                onChange={(e) => setAppData({ ...appData, environment: Number(e.target.value) as AppEnvironment })}
              >
                {Object.entries(AppEnvironment)
                  .filter(([, value]) => typeof value === "number")
                  .map(([key, value]) => (
                    <option key={key} value={value}>
                      {key === "Production" ? "Production" : "Sandbox"}
                    </option>
                  ))}
              </SelectBase>
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Workspace Anahtarı
              </label>
              <InputBase
                value={appData.workspaceKey}
                onChange={(e) => setAppData({ ...appData, workspaceKey: e.target.value })}
                placeholder="Örn: FRAOULA"
              />
              <p className={cn("text-xs", text.muted)}>
                Sandbox ve production uygulamalarını eşlemek için ortak bir anahtar kullanabilirsiniz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Sahip İletişim E-postası
              </label>
              <InputBase
                type="email"
                value={appData.ownerContactEmail}
                onChange={(e) => setAppData({ ...appData, ownerContactEmail: e.target.value })}
                placeholder="owner@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Faturalama İletişim E-postası
              </label>
              <InputBase
                type="email"
                value={appData.billingContactEmail}
                onChange={(e) => setAppData({ ...appData, billingContactEmail: e.target.value })}
                placeholder="billing@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.secondary)}>
              Sahip Kullanıcı ID (Opsiyonel)
            </label>
            <InputBase
              value={appData.ownerUserId}
              onChange={(e) => setAppData({ ...appData, ownerUserId: e.target.value })}
              placeholder="Guid formatında kullanıcı ID"
            />
          </div>

          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.secondary)}>
              İç Notlar
            </label>
            <TextareaBase
              value={appData.notes}
              onChange={(e) => setAppData({ ...appData, notes: e.target.value })}
              placeholder="Satış, sözleşme veya operasyon notları"
              className="min-h-[90px]"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveApp}
            disabled={savingSection === "app"}
            className={cn(components.buttonPrimary, "w-full sm:w-auto")}
          >
            <Save className="w-4 h-4" />
            {savingSection === "app" ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </AccordionSection>

      {/* Plans Section */}
      <AccordionSection
        title={`Planlar (${plans.length})`}
        icon={Package}
        isOpen={openSections.plans}
        onToggle={() => toggleSection("plans")}
      >
        {loadingPlans ? (
          <p className={cn("text-sm", text.muted)}>Yükleniyor...</p>
        ) : plans.length === 0 ? (
          <p className={cn("text-sm", text.muted)}>Henüz plan eklenmemiş</p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanEditor
                key={plan.id}
                plan={plan}
                prices={planPrices[plan.id] || []}
                onSave={handleSavePlan}
                onSavePrice={handleSavePlanPrice}
                onDelete={async () => {
                  if (confirm("Bu planı silmek istediğinize emin misiniz?")) {
                    try {
                      await deletePlan(plan.id);
                      const updatedPlans = await getAllPlans(app.id);
                      setPlans(updatedPlans);
                      notifySuccess("Başarılı", "Plan silindi");
                    } catch (error: any) {
                      notifyError("Hata", error?.message || "Plan silinemedi");
                    }
                  }
                }}
                saving={savingSection === `plan-${plan.id}`}
              />
            ))}
          </div>
        )}
      </AccordionSection>

      {/* Features Section */}
      <AccordionSection
        title={`Özellikler (${features.length})`}
        icon={Zap}
        isOpen={openSections.features}
        onToggle={() => toggleSection("features")}
      >
        {loadingFeatures ? (
          <p className={cn("text-sm", text.muted)}>Yükleniyor...</p>
        ) : features.length === 0 ? (
          <p className={cn("text-sm", text.muted)}>Henüz özellik eklenmemiş</p>
        ) : (
          <div className="space-y-4">
            {features.map((feature) => (
              <FeatureEditor
                key={feature.id}
                feature={feature}
                onSave={handleSaveFeature}
                onDelete={async () => {
                  if (confirm("Bu özelliği silmek istediğinize emin misiniz?")) {
                    try {
                      await deleteFeature(feature.id);
                      const updatedFeatures = await getFeaturesByApp(app.id);
                      setFeatures(updatedFeatures);
                      notifySuccess("Başarılı", "Özellik silindi");
                    } catch (error: any) {
                      notifyError("Hata", error?.message || "Özellik silinemedi");
                    }
                  }
                }}
                saving={savingSection === `feature-${feature.id}`}
              />
            ))}
          </div>
        )}
      </AccordionSection>

      {/* API Keys Section */}
      <AccordionSection
        title={`API Anahtarları (${apiKeys.length})`}
        icon={Key}
        isOpen={openSections.apikeys}
        onToggle={() => toggleSection("apikeys")}
      >
        {loadingApiKeys ? (
          <p className={cn("text-sm", text.muted)}>Yükleniyor...</p>
        ) : apiKeys.length === 0 ? (
          <p className={cn("text-sm", text.muted)}>Henüz API anahtarı eklenmemiş</p>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <ApiKeyEditor
                key={apiKey.id}
                apiKey={apiKey}
                onSave={handleSaveApiKey}
                onDelete={async () => {
                  if (confirm("Bu API anahtarını silmek istediğinize emin misiniz?")) {
                    try {
                      await deleteApiKey(apiKey.id);
                      const updatedApiKeys = await getAllApiKeys(app.id);
                      setApiKeys(updatedApiKeys);
                      notifySuccess("Başarılı", "API anahtarı silindi");
                    } catch (error: any) {
                      notifyError("Hata", error?.message || "API anahtarı silinemedi");
                    }
                  }
                }}
                saving={savingSection === `apikey-${apiKey.id}`}
              />
            ))}
          </div>
        )}
      </AccordionSection>

      {/* Webhooks Section */}
      <AccordionSection
        title={`Webhook Endpoint'leri (${webhooks.length})`}
        icon={Webhook}
        isOpen={openSections.webhooks}
        onToggle={() => toggleSection("webhooks")}
      >
        {loadingWebhooks ? (
          <p className={cn("text-sm", text.muted)}>Yükleniyor...</p>
        ) : webhooks.length === 0 ? (
          <p className={cn("text-sm", text.muted)}>Henüz webhook endpoint eklenmemiş</p>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <WebhookEditor
                key={webhook.id}
                webhook={webhook}
                onSave={handleSaveWebhook}
                onDelete={async () => {
                  if (confirm("Bu webhook endpoint'ini silmek istediğinize emin misiniz?")) {
                    try {
                      await deleteWebhookEndpoint(webhook.id);
                      const updatedWebhooks = await getAllWebhookEndpoints(app.id);
                      setWebhooks(updatedWebhooks);
                      notifySuccess("Başarılı", "Webhook endpoint silindi");
                    } catch (error: any) {
                      notifyError("Hata", error?.message || "Webhook endpoint silinemedi");
                    }
                  }
                }}
                saving={savingSection === `webhook-${webhook.id}`}
              />
            ))}
          </div>
        )}
      </AccordionSection>

      {/* Back Button */}
      <div className="flex justify-end pt-4">
        <a href="/apps" className={components.buttonSecondary}>
          <X className="w-4 h-4" />
          Geri Dön
        </a>
      </div>
    </div>
  );
}

// Plan Editor Component
function PlanEditor({
  plan,
  prices,
  onSave,
  onSavePrice,
  onDelete,
  saving,
}: {
  plan: PlanDto;
  prices: PlanPriceDto[];
  onSave: (plan: PlanDto) => void;
  onSavePrice: (planId: string, price: PlanPriceDto) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [localPlan, setLocalPlan] = useState<PlanDto>(plan);
  const [localPrices, setLocalPrices] = useState<PlanPriceDto[]>(prices);

  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  useEffect(() => {
    setLocalPrices(prices);
  }, [prices]);

  return (
    <div className={cn("border rounded-lg p-4", border.default, bg.input)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Plan Adı *</label>
            <InputBase
              value={localPlan.name}
              onChange={(e) => setLocalPlan({ ...localPlan, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Kod *</label>
            <InputBase
              value={localPlan.code}
              onChange={(e) => setLocalPlan({ ...localPlan, code: e.target.value.toUpperCase() })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Açıklama</label>
          <TextareaBase
            value={localPlan.description || ""}
            onChange={(e) => setLocalPlan({ ...localPlan, description: e.target.value || null })}
            className="min-h-[80px]"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Deneme Günü</label>
            <InputBase
              type="number"
              min="0"
              value={localPlan.trialDays}
              onChange={(e) => setLocalPlan({ ...localPlan, trialDays: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Ödeme Dönemi</label>
            <SelectBase
              value={localPlan.billingPeriod}
              onChange={(e) => setLocalPlan({ ...localPlan, billingPeriod: parseInt(e.target.value) as BillingPeriod })}
            >
              {Object.entries(BillingPeriod)
                .filter(([_, value]) => typeof value === "number")
                .map(([key, value]) => (
                  <option key={key} value={value}>
                    {key === "OneTime" ? "Tek Seferlik" : key === "Monthly" ? "Aylık" : key === "Yearly" ? "Yıllık" : key === "Weekly" ? "Haftalık" : key === "Daily" ? "Günlük" : key}
                  </option>
                ))}
            </SelectBase>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localPlan.isPublic}
              onChange={(e) => setLocalPlan({ ...localPlan, isPublic: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-700 bg-neutral-800"
            />
            <label className={cn("text-sm", text.muted)}>Herkese açık</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={localPlan.isFree}
              onChange={(e) => setLocalPlan({ ...localPlan, isFree: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-700 bg-neutral-800"
            />
            <label className={cn("text-sm", text.muted)}>Ücretsiz</label>
          </div>
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Yenileme Politikası</label>
          <SelectBase
            value={localPlan.renewalPolicy}
            onChange={(e) => setLocalPlan({ ...localPlan, renewalPolicy: parseInt(e.target.value) as RenewalPolicy })}
          >
            {Object.entries(RenewalPolicy)
              .filter(([_, value]) => typeof value === "number")
              .map(([key, value]) => (
                <option key={key} value={value}>
                  {key === "None" ? "Yok" : key === "Manual" ? "Manuel" : key === "Auto" ? "Otomatik" : key}
                </option>
              ))}
          </SelectBase>
        </div>

        {/* Prices */}
        <div className="space-y-2 pt-4 border-t border-neutral-700/30">
          <label className={cn("block text-sm font-medium", text.muted)}>Fiyatlar</label>
          {localPrices.map((price) => (
            <PlanPriceEditor
              key={price.id}
              price={price}
              onSave={() => onSavePrice(plan.id, price)}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave(localPlan)}
            disabled={saving}
            className={cn(components.buttonPrimary, "flex-1")}
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Planı Kaydet"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(components.buttonSecondary, "text-red-400 hover:text-red-300")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Plan Price Editor
function PlanPriceEditor({
  price,
  onSave,
}: {
  price: PlanPriceDto;
  onSave: () => void;
}) {
  const [localPrice, setLocalPrice] = useState<PlanPriceDto>(price);

  useEffect(() => {
    setLocalPrice(price);
  }, [price]);

  return (
    <div className={cn("flex flex-col sm:flex-row gap-2 p-2 rounded-md", bg.card)}>
      <SelectBase
        value={localPrice.currency}
        onChange={(e) => setLocalPrice({ ...localPrice, currency: parseInt(e.target.value) as CurrencyCode })}
        className="w-full sm:w-36"
      >
        {Object.entries(CurrencyCode)
          .filter(([_, value]) => typeof value === "number")
          .map(([key, value]) => (
            <option key={key} value={value}>
              {key} {key === "TRY" ? "(₺)" : key === "USD" ? "($)" : key === "EUR" ? "(€)" : key === "GBP" ? "(£)" : ""}
            </option>
          ))}
      </SelectBase>
      <InputBase
        type="number"
        step="0.01"
        min="0"
        value={localPrice.amount}
        onChange={(e) => setLocalPrice({ ...localPrice, amount: parseFloat(e.target.value) || 0 })}
        className="flex-1"
      />
      <button
        type="button"
        onClick={onSave}
        className={cn(components.buttonSecondary, "text-xs")}
      >
        Kaydet
      </button>
    </div>
  );
}

// Feature Editor Component
function FeatureEditor({
  feature,
  onSave,
  onDelete,
  saving,
}: {
  feature: FeatureDto;
  onSave: (feature: FeatureDto) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [localFeature, setLocalFeature] = useState<FeatureDto>(feature);

  useEffect(() => {
    setLocalFeature(feature);
  }, [feature]);

  return (
    <div className={cn("border rounded-lg p-4", border.default, bg.input)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Key *</label>
          <InputBase
            value={localFeature.key}
            onChange={(e) => setLocalFeature({ ...localFeature, key: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Ad *</label>
          <InputBase
            value={localFeature.name}
            onChange={(e) => setLocalFeature({ ...localFeature, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Birim</label>
          <InputBase
            value={localFeature.unit}
            onChange={(e) => setLocalFeature({ ...localFeature, unit: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Açıklama</label>
          <InputBase
            value={localFeature.description}
            onChange={(e) => setLocalFeature({ ...localFeature, description: e.target.value })}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => onSave(localFeature)}
          disabled={saving}
          className={cn(components.buttonPrimary, "flex-1")}
        >
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(components.buttonSecondary, "text-red-400 hover:text-red-300")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// API Key Editor Component
function ApiKeyEditor({
  apiKey,
  onSave,
  onDelete,
  saving,
}: {
  apiKey: ApiKeyDto;
  onSave: (apiKey: ApiKeyDto) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [localApiKey, setLocalApiKey] = useState<ApiKeyDto>(apiKey);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  return (
    <div className={cn("border rounded-lg p-4", border.default, bg.input)}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Ad *</label>
            <InputBase
              value={localApiKey.name}
              onChange={(e) => setLocalApiKey({ ...localApiKey, name: e.target.value })}
            />
          </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Prefix</label>
          <InputBase
            value={localApiKey.prefix}
            disabled
            className="bg-neutral-900/50"
          />
          <p className={cn("text-xs", text.muted)}>Prefix değiştirilemez</p>
        </div>
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Scopes</label>
          <InputBase
            value={localApiKey.scopes}
            onChange={(e) => setLocalApiKey({ ...localApiKey, scopes: e.target.value })}
            placeholder="Örn: public,usage:write"
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Son Geçerlilik Tarihi</label>
          <InputBase
            type="datetime-local"
            value={localApiKey.expiresAt ? new Date(localApiKey.expiresAt).toISOString().slice(0, 16) : ""}
            onChange={(e) => setLocalApiKey({ ...localApiKey, expiresAt: e.target.value || null })}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => onSave(localApiKey)}
          disabled={saving}
          className={cn(components.buttonPrimary, "flex-1")}
        >
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(components.buttonSecondary, "text-red-400 hover:text-red-300")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Webhook Editor Component
function WebhookEditor({
  webhook,
  onSave,
  onDelete,
  saving,
}: {
  webhook: WebhookEndpointDto;
  onSave: (webhook: WebhookEndpointDto) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [localWebhook, setLocalWebhook] = useState<WebhookEndpointDto>(webhook);

  useEffect(() => {
    setLocalWebhook(webhook);
  }, [webhook]);

  return (
    <div className={cn("border rounded-lg p-4", border.default, bg.input)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>URL *</label>
          <InputBase
            value={localWebhook.url}
            onChange={(e) => setLocalWebhook({ ...localWebhook, url: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Secret</label>
          <InputBase
            type="password"
            value={localWebhook.secret}
            onChange={(e) => setLocalWebhook({ ...localWebhook, secret: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Event Types (CSV)</label>
          <InputBase
            value={localWebhook.eventTypesCsv}
            onChange={(e) => setLocalWebhook({ ...localWebhook, eventTypesCsv: e.target.value })}
            placeholder="Örn: subscription.created,subscription.updated"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={localWebhook.isActive}
            onChange={(e) => setLocalWebhook({ ...localWebhook, isActive: e.target.checked })}
            className="w-5 h-5 rounded border-neutral-700 bg-neutral-800"
          />
          <label className={cn("text-sm", text.muted)}>Aktif</label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => onSave(localWebhook)}
          disabled={saving}
          className={cn(components.buttonPrimary, "flex-1")}
        >
          <Save className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(components.buttonSecondary, "text-red-400 hover:text-red-300")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
