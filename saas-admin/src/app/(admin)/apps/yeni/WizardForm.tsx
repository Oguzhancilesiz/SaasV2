"use client";

import { useState, useTransition, useEffect } from "react";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  X, 
  Package, 
  Zap, 
  Key, 
  Webhook, 
  CheckCircle2,
  Plus,
  Trash2,
  Info,
  Wand2
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { provisionApp } from "@/lib/appsService";
import { createFeature } from "@/lib/featuresService";
import type { AppProvisionRequest, PlanSeed, PlanPriceSeed } from "@/types/app";
import { BillingPeriod, CurrencyCode, AppEnvironment } from "@/types/app";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { id: 1, title: "Uygulama Bilgileri", icon: Package },
  { id: 2, title: "Planlar", icon: Package },
  { id: 3, title: "Özellikler", icon: Zap },
  { id: 4, title: "API Key", icon: Key },
  { id: 5, title: "Webhook", icon: Webhook },
  { id: 6, title: "Özet", icon: CheckCircle2 },
];

function toCode(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

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
      className={cn(
        components.input,
        "min-h-[120px] resize-none",
        props.className
      )}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

export default function WizardForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifyError, notifySuccess } = useNotificationHelpers();

  // Form state
  const [appData, setAppData] = useState({
    name: "",
    code: "",
    description: "",
    environment: AppEnvironment.Production,
    workspaceKey: "",
    ownerContactEmail: "",
    billingContactEmail: "",
    notes: "",
    ownerUserId: "",
  });

  const [plans, setPlans] = useState<PlanSeed[]>([]);
  const [features, setFeatures] = useState<Array<{ key: string; name: string; unit: string; description: string }>>([]);
  const [apiKey, setApiKey] = useState({ 
    create: true, 
    name: "Default", 
    expiresAt: "" 
  });
  const [webhook, setWebhook] = useState({ create: false, url: "", secret: "" });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-generate code from name
  useEffect(() => {
    if (!appData.code && appData.name) {
      setAppData(prev => ({ ...prev, code: toCode(prev.name) }));
    }
  }, [appData.name]);

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!appData.name.trim()) {
        errors.appName = "Uygulama adı zorunludur";
      }
      if (!appData.code.trim()) {
        errors.appCode = "Uygulama kodu zorunludur";
      }
    }
    
    if (currentStep === 2) {
      plans.forEach((plan, index) => {
        if (!plan.name.trim()) {
          errors[`plan${index}_name`] = `Plan #${index + 1}: Plan adı zorunludur`;
        }
        if (!plan.code.trim()) {
          errors[`plan${index}_code`] = `Plan #${index + 1}: Plan kodu zorunludur`;
        }
        if (plan.prices.length > 0) {
          plan.prices.forEach((price, priceIndex) => {
            if (price.amount < 0) {
              errors[`plan${index}_price${priceIndex}_amount`] = `Plan #${index + 1} Fiyat #${priceIndex + 1}: Tutar negatif olamaz`;
            }
          });
        }
      });
    }
    
    if (currentStep === 3) {
      features.forEach((feature, index) => {
        if (!feature.key.trim()) {
          errors[`feature${index}_key`] = `Özellik #${index + 1}: Key zorunludur`;
        }
        if (!feature.name.trim()) {
          errors[`feature${index}_name`] = `Özellik #${index + 1}: Ad zorunludur`;
        }
      });
    }
    
    if (currentStep === 4) {
      if (apiKey.create && !apiKey.name.trim()) {
        errors.apiKeyName = "API Key adı zorunludur";
      }
    }
    
    if (currentStep === 5) {
      if (webhook.create && !webhook.url.trim()) {
        errors.webhookUrl = "Webhook URL zorunludur";
      }
      if (webhook.create && webhook.url.trim() && !isValidUrl(webhook.url.trim())) {
        errors.webhookUrl = "Geçerli bir URL giriniz";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    setErr(null);
    if (!validateCurrentStep()) {
      const firstError = Object.values(validationErrors)[0];
      setErr(firstError);
      return;
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as Step);
      setValidationErrors({});
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setErr(null);
      setValidationErrors({});
    }
  };

  const handleSubmit = async () => {
    setErr(null);
    if (!validateCurrentStep()) {
      const firstError = Object.values(validationErrors)[0];
      setErr(firstError);
      return;
    }
    
    const request: AppProvisionRequest = {
      name: appData.name.trim(),
      code: appData.code.trim(),
      description: appData.description.trim() || null,
      ownerUserId: appData.ownerUserId.trim() ? appData.ownerUserId.trim() : null,
      environment: appData.environment,
      workspaceKey: appData.workspaceKey.trim() || null,
      ownerContactEmail: appData.ownerContactEmail.trim() || null,
      billingContactEmail: appData.billingContactEmail.trim() || null,
      notes: appData.notes.trim() || null,
      plans: plans,
      createApiKey: apiKey.create,
      apiKeyName: apiKey.create ? apiKey.name : undefined,
      apiKeyExpiresAt: apiKey.create && apiKey.expiresAt ? apiKey.expiresAt : null,
      createWebhook: webhook.create,
      webhookUrl: webhook.create ? webhook.url.trim() : null,
      webhookSecret: webhook.create && webhook.secret ? webhook.secret.trim() : null,
    };

    start(async () => {
      try {
        // 1. Create app with plans, API key, webhook
        const result = await provisionApp(request);
        
        // 2. Create features if any
        if (features.length > 0) {
          await Promise.all(
            features.map((feature) =>
              createFeature({
                appId: result.appId,
                key: feature.key.trim(),
                name: feature.name.trim(),
                unit: feature.unit.trim() || "",
                description: feature.description.trim() || undefined,
              }).catch(() => {
                // Feature creation errors shouldn't fail the whole process
              })
            )
          );
        }
        
        notifySuccess("Başarılı", "Uygulama başarıyla oluşturuldu!");
        router.push(`/apps?notification=${encodeURIComponent("Uygulama başarıyla oluşturuldu")}&type=success`);
      } catch (e: any) {
        const errorMessage = e?.message || "Bir hata oluştu";
        setErr(errorMessage);
        notifyError("Kayıt başarısız", errorMessage);
      }
    });
  };

  const addPlan = () => {
    setPlans([
      ...plans,
      {
        name: `Plan ${plans.length + 1}`,
        code: toCode(`Plan ${plans.length + 1}`),
        description: null,
        trialDays: 0,
        graceDays: null,
        billingInterval: BillingPeriod.Monthly,
        active: true,
        prices: [],
        featureIds: [],
      },
    ]);
  };

  const updatePlan = (index: number, field: keyof PlanSeed, value: any) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: value };
    setPlans(updated);
  };

  const removePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const addPriceToPlan = (planIndex: number) => {
    const updated = [...plans];
    updated[planIndex].prices = [
      ...updated[planIndex].prices,
      { currency: CurrencyCode.TRY, amount: 0, effectiveFrom: null },
    ];
    setPlans(updated);
  };

  const removePriceFromPlan = (planIndex: number, priceIndex: number) => {
    const updated = [...plans];
    updated[planIndex].prices = updated[planIndex].prices.filter((_, i) => i !== priceIndex);
    setPlans(updated);
  };

  const updatePriceInPlan = (planIndex: number, priceIndex: number, field: keyof PlanPriceSeed, value: any) => {
    const updated = [...plans];
    updated[planIndex].prices[priceIndex] = {
      ...updated[planIndex].prices[priceIndex],
      [field]: value,
    };
    setPlans(updated);
  };

  const addFeature = () => {
    setFeatures([...features, { key: "", name: "", unit: "", description: "" }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className={cn(components.card, "p-6")}>
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isActive
                        ? "bg-blue-500 text-white"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 text-center",
                      isActive ? text.primary : text.muted
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 -mt-6",
                      isCompleted ? "bg-emerald-500" : "bg-neutral-700"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className={cn(components.card, "p-6 sm:p-8")}>
        {/* Step 1: App Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className={cn("text-xl font-bold mb-2", text.primary)}>Uygulama Bilgileri</h2>
              <p className={cn("text-sm", text.muted)}>Yeni uygulamanızın temel bilgilerini girin</p>
            </div>

            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Uygulama Adı *
              </label>
              <InputBase
                value={appData.name}
                onChange={(e) => {
                  setAppData({ ...appData, name: e.target.value });
                  if (validationErrors.appName) {
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next.appName;
                      return next;
                    });
                  }
                }}
                placeholder="Örn: FraoulaPT Mobile"
                required
                className={validationErrors.appName ? "border-red-500" : ""}
              />
              {validationErrors.appName && (
                <p className={cn("text-xs text-red-400")}>{validationErrors.appName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Kod *
              </label>
              <div className="flex gap-2">
                <InputBase
                  value={appData.code}
                  onChange={(e) => {
                    setAppData({ ...appData, code: e.target.value.toUpperCase() });
                    if (validationErrors.appCode) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.appCode;
                        return next;
                      });
                    }
                  }}
                  placeholder="Örn: FRAOULA_PT"
                  required
                  className={validationErrors.appCode ? "border-red-500 flex-1" : "flex-1"}
                />
                <button
                  type="button"
                  onClick={() => {
                    const autoCode = toCode(appData.name);
                    setAppData({ ...appData, code: autoCode });
                  }}
                  className={cn(components.buttonSecondary, "text-xs whitespace-nowrap flex items-center gap-1")}
                  title="Ad'dan otomatik kod oluştur"
                  disabled={!appData.name.trim()}
                >
                  <Wand2 className="w-3 h-3" />
                  Otomatik
                </button>
              </div>
              {validationErrors.appCode && (
                <p className={cn("text-xs text-red-400")}>{validationErrors.appCode}</p>
              )}
              <p className={cn("text-xs", text.muted)}>
                Boş bırakırsanız ad'dan otomatik üretilecektir.
              </p>
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
                placeholder="Satış veya operasyon notları (opsiyonel)"
                className="min-h-[90px]"
              />
            </div>
          </div>
        )}

        {/* Step 2: Plans */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className={cn("text-xl font-bold mb-2", text.primary)}>Planlar</h2>
              <p className={cn("text-sm", text.muted)}>
                Uygulamanız için planlar tanımlayın (en az bir plan zorunludur)
              </p>
            </div>

            {plans.length === 0 && (
              <div className={cn("text-center py-8 border border-dashed rounded-lg", border.default)}>
                <Package className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
                <p className={cn("text-sm", text.muted)}>Henüz plan eklenmedi</p>
              </div>
            )}

            <div className="space-y-4">
              {plans.map((plan, planIndex) => (
                <div
                  key={planIndex}
                  className={cn("border rounded-lg p-4", border.default, bg.input)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={cn("font-medium", text.secondary)}>Plan #{planIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removePlan(planIndex)}
                      className={cn("text-red-400 hover:text-red-300", "p-1")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className={cn("block text-sm font-medium", text.muted)}>Plan Adı *</label>
                      <InputBase
                        value={plan.name}
                        onChange={(e) => {
                          updatePlan(planIndex, "name", e.target.value);
                          if (validationErrors[`plan${planIndex}_name`]) {
                            setValidationErrors(prev => {
                              const next = { ...prev };
                              delete next[`plan${planIndex}_name`];
                              return next;
                            });
                          }
                        }}
                        placeholder="Örn: Pro Plan"
                        required
                        className={cn("w-full", validationErrors[`plan${planIndex}_name`] ? "border-red-500" : "")}
                      />
                      {validationErrors[`plan${planIndex}_name`] && (
                        <p className={cn("text-xs text-red-400")}>{validationErrors[`plan${planIndex}_name`]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className={cn("block text-sm font-medium", text.muted)}>Kod *</label>
                      <div className="flex gap-2">
                        <InputBase
                          value={plan.code}
                          onChange={(e) => {
                            updatePlan(planIndex, "code", e.target.value.toUpperCase());
                            if (validationErrors[`plan${planIndex}_code`]) {
                              setValidationErrors(prev => {
                                const next = { ...prev };
                                delete next[`plan${planIndex}_code`];
                                return next;
                              });
                            }
                          }}
                          placeholder="Örn: PRO"
                          required
                          className={cn("flex-1", validationErrors[`plan${planIndex}_code`] ? "border-red-500" : "")}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const autoCode = toCode(plan.name);
                            updatePlan(planIndex, "code", autoCode);
                          }}
                          className={cn(components.buttonSecondary, "text-xs whitespace-nowrap flex items-center gap-1 px-3")}
                          title="Ad'dan otomatik kod oluştur"
                          disabled={!plan.name.trim()}
                        >
                          <Wand2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Otomatik</span>
                        </button>
                      </div>
                      {validationErrors[`plan${planIndex}_code`] && (
                        <p className={cn("text-xs text-red-400")}>{validationErrors[`plan${planIndex}_code`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 sm:col-span-2 mb-4">
                    <label className={cn("block text-sm font-medium", text.muted)}>Açıklama</label>
                    <TextareaBase
                      value={plan.description || ""}
                      onChange={(e) => updatePlan(planIndex, "description", e.target.value || null)}
                      placeholder="Plan hakkında açıklama (isteğe bağlı)"
                      className="min-h-[80px] w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className={cn("block text-sm font-medium", text.muted)}>Deneme Günü</label>
                      <InputBase
                        type="number"
                        min="0"
                        value={plan.trialDays}
                        onChange={(e) => updatePlan(planIndex, "trialDays", parseInt(e.target.value) || 0)}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn("block text-sm font-medium", text.muted)}>Ödeme Dönemi</label>
                      <SelectBase
                        value={plan.billingInterval || BillingPeriod.Monthly}
                        onChange={(e) => updatePlan(planIndex, "billingInterval", parseInt(e.target.value) as BillingPeriod)}
                        className="w-full"
                      >
                        {Object.entries(BillingPeriod)
                          .filter(([key, value]) => typeof value === "number")
                          .map(([key, value]) => (
                            <option key={key} value={value}>
                              {key === "OneTime" ? "Tek Seferlik" : key === "Monthly" ? "Aylık" : key === "Yearly" ? "Yıllık" : key === "Weekly" ? "Haftalık" : key === "Daily" ? "Günlük" : key}
                            </option>
                          ))}
                      </SelectBase>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="space-y-2 pt-4 border-t border-neutral-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <label className={cn("block text-sm font-medium", text.muted)}>Fiyatlar</label>
                      <button
                        type="button"
                        onClick={() => addPriceToPlan(planIndex)}
                        className={cn(components.buttonSecondary, "text-xs flex items-center gap-1")}
                      >
                        <Plus className="w-3 h-3" />
                        Fiyat Ekle
                      </button>
                    </div>
                    {plan.prices.length === 0 && (
                      <p className={cn("text-xs italic", text.muted)}>
                        Bu plan için henüz fiyat eklenmedi. Ücretsiz bir plan değilse en az bir fiyat eklemelisiniz.
                      </p>
                    )}
                    <div className="space-y-2">
                      {plan.prices.map((price, priceIndex) => (
                        <div key={priceIndex} className="relative">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-md bg-neutral-900/50">
                            <SelectBase
                              value={price.currency}
                              onChange={(e) => updatePriceInPlan(planIndex, priceIndex, "currency", parseInt(e.target.value) as CurrencyCode)}
                              className="w-full sm:w-36 flex-shrink-0"
                            >
                              {Object.entries(CurrencyCode)
                                .filter(([key, value]) => typeof value === "number")
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
                              value={price.amount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updatePriceInPlan(planIndex, priceIndex, "amount", val);
                                const errorKey = `plan${planIndex}_price${priceIndex}_amount`;
                                if (validationErrors[errorKey] && val >= 0) {
                                  setValidationErrors(prev => {
                                    const next = { ...prev };
                                    delete next[errorKey];
                                    return next;
                                  });
                                }
                              }}
                              placeholder="Tutar (örn: 99.99)"
                              className={cn(
                                "flex-1 min-w-[120px]",
                                validationErrors[`plan${planIndex}_price${priceIndex}_amount`] ? "border-red-500" : ""
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => removePriceFromPlan(planIndex, priceIndex)}
                              className="text-red-400 hover:text-red-300 p-2 flex-shrink-0 self-center sm:self-auto"
                              title="Fiyatı kaldır"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {validationErrors[`plan${planIndex}_price${priceIndex}_amount`] && (
                            <p className={cn("text-xs text-red-400 mt-1 ml-2")}>
                              {validationErrors[`plan${planIndex}_price${priceIndex}_amount`]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addPlan}
              className={cn(components.buttonSecondary, "w-full flex items-center justify-center gap-2")}
            >
              <Plus className="w-4 h-4" />
              Plan Ekle
            </button>
          </div>
        )}

        {/* Step 3: Features */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className={cn("text-xl font-bold mb-2", text.primary)}>Özellikler</h2>
              <p className={cn("text-sm", text.muted)}>
                Uygulamanızın özelliklerini tanımlayın (isteğe bağlı)
              </p>
            </div>

            {features.length === 0 && (
              <div className={cn("text-center py-8 border border-dashed rounded-lg", border.default)}>
                <Zap className="w-12 h-12 mx-auto mb-3 text-neutral-500" />
                <p className={cn("text-sm", text.muted)}>Henüz özellik eklenmedi</p>
              </div>
            )}

            {features.length > 0 && (
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={cn("border rounded-lg p-4", border.default, bg.input)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={cn("font-medium", text.secondary)}>Özellik #{index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className={cn("text-red-400 hover:text-red-300", "p-1")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={cn("block text-sm font-medium", text.muted)}>
                          Key *
                        </label>
                        <div className="flex gap-2">
                          <InputBase
                            value={feature.key}
                            onChange={(e) => {
                              updateFeature(index, "key", e.target.value);
                              if (validationErrors[`feature${index}_key`]) {
                                setValidationErrors(prev => {
                                  const next = { ...prev };
                                  delete next[`feature${index}_key`];
                                  return next;
                                });
                              }
                            }}
                            placeholder="Örn: storage_limit"
                            required
                            className={cn("flex-1", validationErrors[`feature${index}_key`] ? "border-red-500" : "")}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const autoKey = toCode(feature.name || `feature_${index + 1}`);
                              updateFeature(index, "key", autoKey);
                            }}
                            className={cn(components.buttonSecondary, "text-xs whitespace-nowrap flex items-center gap-1 px-3")}
                            title="Ad'dan otomatik key oluştur"
                            disabled={!feature.name.trim()}
                          >
                            <Wand2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Otomatik</span>
                          </button>
                        </div>
                        {validationErrors[`feature${index}_key`] && (
                          <p className={cn("text-xs text-red-400")}>{validationErrors[`feature${index}_key`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className={cn("block text-sm font-medium", text.muted)}>
                          Ad *
                        </label>
                        <InputBase
                          value={feature.name}
                          onChange={(e) => {
                            updateFeature(index, "name", e.target.value);
                            if (validationErrors[`feature${index}_name`]) {
                              setValidationErrors(prev => {
                                const next = { ...prev };
                                delete next[`feature${index}_name`];
                                return next;
                              });
                            }
                          }}
                          placeholder="Örn: Depolama Limiti"
                          required
                          className={cn("w-full", validationErrors[`feature${index}_name`] ? "border-red-500" : "")}
                        />
                        {validationErrors[`feature${index}_name`] && (
                          <p className={cn("text-xs text-red-400")}>{validationErrors[`feature${index}_name`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className={cn("block text-sm font-medium", text.muted)}>
                          Birim
                        </label>
                        <InputBase
                          value={feature.unit}
                          onChange={(e) => updateFeature(index, "unit", e.target.value)}
                          placeholder="Örn: GB, MB, adet"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className={cn("block text-sm font-medium", text.muted)}>
                          Açıklama
                        </label>
                        <InputBase
                          value={feature.description}
                          onChange={(e) => updateFeature(index, "description", e.target.value)}
                          placeholder="Özellik hakkında açıklama"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addFeature}
              className={cn(components.buttonSecondary, "w-full flex items-center justify-center gap-2")}
            >
              <Plus className="w-4 h-4" />
              Özellik Ekle
            </button>
          </div>
        )}

        {/* Step 4: API Key */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className={cn("text-xl font-bold mb-2", text.primary)}>API Anahtarı</h2>
              <p className={cn("text-sm", text.muted)}>
                Uygulamanız için API anahtarı oluşturun (isteğe bağlı)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="createApiKey"
                  checked={apiKey.create}
                  onChange={(e) => setApiKey({ ...apiKey, create: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800"
                />
                <label htmlFor="createApiKey" className={cn("text-sm", text.secondary)}>
                  API anahtarı oluştur
                </label>
              </div>

              {apiKey.create && (
                <div className={cn("border rounded-lg p-4 space-y-4", border.default, bg.input)}>
                  <div className="space-y-2">
                    <label className={cn("block text-sm font-medium", text.secondary)}>
                      API Key Adı *
                    </label>
                    <InputBase
                      value={apiKey.name}
                      onChange={(e) => {
                        setApiKey({ ...apiKey, name: e.target.value });
                        if (validationErrors.apiKeyName) {
                          setValidationErrors(prev => {
                            const next = { ...prev };
                            delete next.apiKeyName;
                            return next;
                          });
                        }
                      }}
                      placeholder="Örn: Default"
                      className={validationErrors.apiKeyName ? "border-red-500" : ""}
                    />
                    {validationErrors.apiKeyName && (
                      <p className={cn("text-xs text-red-400")}>{validationErrors.apiKeyName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={cn("block text-sm font-medium", text.secondary)}>
                      Son Geçerlilik Tarihi (Opsiyonel)
                    </label>
                    <InputBase
                      type="datetime-local"
                      value={apiKey.expiresAt}
                      onChange={(e) => setApiKey({ ...apiKey, expiresAt: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Webhook */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className={cn("text-xl font-bold mb-2", text.primary)}>Webhook Endpoint</h2>
              <p className={cn("text-sm", text.muted)}>
                Webhook endpoint'i ekleyin (isteğe bağlı)
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="createWebhook"
                  checked={webhook.create}
                  onChange={(e) => setWebhook({ ...webhook, create: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800"
                />
                <label htmlFor="createWebhook" className={cn("text-sm", text.secondary)}>
                  Webhook endpoint oluştur
                </label>
              </div>

              {webhook.create && (
                <div className={cn("border rounded-lg p-4 space-y-4", border.default, bg.input)}>
                  <div className="space-y-2">
                    <label className={cn("block text-sm font-medium", text.secondary)}>
                      Webhook URL *
                    </label>
                    <div className="flex gap-2">
                      <InputBase
                        value={webhook.url}
                        onChange={(e) => {
                          setWebhook({ ...webhook, url: e.target.value });
                          if (validationErrors.webhookUrl) {
                            setValidationErrors(prev => {
                              const next = { ...prev };
                              delete next.webhookUrl;
                              return next;
                            });
                          }
                        }}
                        placeholder="https://example.com/webhooks"
                        required={webhook.create}
                        className={validationErrors.webhookUrl ? "border-red-500 flex-1" : "flex-1"}
                      />
                      <button
                        type="button"
                        onClick={() => setWebhook({ ...webhook, url: "https://example.com/webhooks" })}
                        className={cn(components.buttonSecondary, "text-xs whitespace-nowrap flex items-center gap-1")}
                        title="Örnek URL ekle"
                      >
                        <Wand2 className="w-3 h-3" />
                        Örnek
                      </button>
                    </div>
                    {validationErrors.webhookUrl && (
                      <p className={cn("text-xs text-red-400")}>{validationErrors.webhookUrl}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={cn("block text-sm font-medium", text.secondary)}>
                      Secret (Opsiyonel)
                    </label>
                    <div className="flex gap-2">
                      <InputBase
                        type="password"
                        value={webhook.secret}
                        onChange={(e) => setWebhook({ ...webhook, secret: e.target.value })}
                        placeholder="Webhook imzalama için secret"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Generate random secret
                          const randomSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join('');
                          setWebhook({ ...webhook, secret: randomSecret });
                        }}
                        className={cn(components.buttonSecondary, "text-xs whitespace-nowrap flex items-center gap-1")}
                        title="Rastgele secret oluştur"
                      >
                        <Wand2 className="w-3 h-3" />
                        Oluştur
                      </button>
                    </div>
                    <p className={cn("text-xs", text.muted)}>
                      Webhook imzalama için kullanılacak secret. Boş bırakılabilir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Summary */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className={cn("text-xl font-bold mb-2", text.primary)}>Özet</h2>
              <p className={cn("text-sm", text.muted)}>
                Oluşturulacak uygulamanın özet bilgileri
              </p>
            </div>

            <div className="space-y-4">
              <SummarySection title="Uygulama Bilgileri">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className={cn("text-xs", text.muted)}>Ad:</span>
                    <p className={cn("font-medium", text.secondary)}>{appData.name}</p>
                  </div>
                  <div>
                    <span className={cn("text-xs", text.muted)}>Kod:</span>
                    <p className={cn("font-medium", text.secondary)}>{appData.code}</p>
                  </div>
                  {appData.description && (
                    <div className="md:col-span-2">
                      <span className={cn("text-xs", text.muted)}>Açıklama:</span>
                      <p className={cn("font-medium", text.secondary)}>{appData.description}</p>
                    </div>
                  )}
                  <div>
                    <span className={cn("text-xs", text.muted)}>Ortam:</span>
                    <p className={cn("font-medium", text.secondary)}>
                      {appData.environment === AppEnvironment.Production ? "Production" : "Sandbox"}
                    </p>
                  </div>
                  <div>
                    <span className={cn("text-xs", text.muted)}>Workspace:</span>
                    <p className={cn("font-medium", text.secondary)}>{appData.workspaceKey || "—"}</p>
                  </div>
                  <div>
                    <span className={cn("text-xs", text.muted)}>Owner Contact:</span>
                    <p className={cn("font-medium", text.secondary)}>{appData.ownerContactEmail || "—"}</p>
                  </div>
                  <div>
                    <span className={cn("text-xs", text.muted)}>Billing Contact:</span>
                    <p className={cn("font-medium", text.secondary)}>{appData.billingContactEmail || "—"}</p>
                  </div>
                  {appData.ownerUserId && (
                    <div>
                      <span className={cn("text-xs", text.muted)}>Owner User ID:</span>
                      <p className={cn("font-medium", text.secondary)}>{appData.ownerUserId}</p>
                    </div>
                  )}
                  {appData.notes && (
                    <div className="md:col-span-2">
                      <span className={cn("text-xs", text.muted)}>Notlar:</span>
                      <p className={cn("font-medium", text.secondary)}>{appData.notes}</p>
                    </div>
                  )}
                </div>
              </SummarySection>

              <SummarySection title={`Planlar (${plans.length})`}>
                {plans.length === 0 ? (
                  <p className={cn("text-sm", text.muted)}>Plan eklenmemiş</p>
                ) : (
                  <div className="space-y-2">
                    {plans.map((plan, index) => (
                      <div key={index} className={cn("border rounded p-3", border.default)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("font-medium", text.secondary)}>
                            {plan.name || `Plan #${index + 1}`}
                          </span>
                          <span className={cn("text-xs", text.muted)}>{plan.code}</span>
                        </div>
                        <div className={cn("text-xs", text.muted)}>
                          Fiyat: {plan.prices.length} adet | Deneme: {plan.trialDays} gün
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SummarySection>

              <SummarySection title={`Özellikler (${features.length})`}>
                {features.length === 0 ? (
                  <p className={cn("text-sm", text.muted)}>Özellik eklenmemiş</p>
                ) : (
                  <div className="space-y-1">
                    {features.map((feature, index) => (
                      <div key={index} className={cn("text-sm", text.secondary)}>
                        {feature.name || feature.key || `Özellik #${index + 1}`}
                      </div>
                    ))}
                  </div>
                )}
              </SummarySection>

              <SummarySection title="API Key">
                {apiKey.create ? (
                  <div>
                    <p className={cn("text-sm", text.secondary)}>
                      Oluşturulacak: {apiKey.name}
                    </p>
                  </div>
                ) : (
                  <p className={cn("text-sm", text.secondary)}>Oluşturulmayacak</p>
                )}
              </SummarySection>

              <SummarySection title="Webhook">
                {webhook.create ? (
                  <div>
                    <p className={cn("text-sm", text.secondary)}>
                      Oluşturulacak: {webhook.url}
                    </p>
                  </div>
                ) : (
                  <p className={cn("text-sm", text.secondary)}>Oluşturulmayacak</p>
                )}
              </SummarySection>
            </div>
          </div>
        )}

        {err && (
          <div className={cn(
            "p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
          )}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {err}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-neutral-800/50">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className={cn(components.buttonSecondary, "flex-1 flex items-center justify-center gap-2")}
            >
              <ChevronLeft className="w-4 h-4" />
              Geri
            </button>
          )}
          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={pending}
              className={cn(components.buttonPrimary, "flex-1 flex items-center justify-center gap-2")}
            >
              İleri
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className={cn(components.buttonPrimary, "flex-1 flex items-center justify-center gap-2")}
            >
              <Save className="w-4 h-4" />
              {pending ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn("border rounded-lg p-4", border.default, bg.input)}>
      <h4 className={cn("font-semibold text-base mb-3", text.secondary)}>{title}</h4>
      {children}
    </div>
  );
}

