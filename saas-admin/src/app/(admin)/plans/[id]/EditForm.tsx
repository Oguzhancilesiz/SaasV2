"use client";

import type { PlanDto, PlanUpdateDto } from "@/types/plan";
import type { PlanPriceDto, PlanPriceAddDto, PlanPriceUpdateDto } from "@/types/planPrice";
import type { PlanFeatureDto, PlanFeatureAddDto, PlanFeatureUpdateDto } from "@/lib/planFeaturesService";
import type { FeatureDto } from "@/types/feature";
import { useState, useEffect, useTransition } from "react";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { 
  Save, X, ChevronDown, ChevronUp, Package, DollarSign, Zap,
  Plus, Trash2, Calendar
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Status, BillingPeriod, CurrencyCode } from "@/types/app";
import { RenewalPolicy } from "@/types/plan";
import { updatePlan } from "@/lib/plansService";
import { getAllPlanPrices, updatePlanPrice, createPlanPrice, deletePlanPrice } from "@/lib/planPricesService";
import { getAllPlanFeatures, updatePlanFeature, createPlanFeature, deletePlanFeature } from "@/lib/planFeaturesService";
import { getFeaturesByApp } from "@/lib/featuresService";
import { getAllApps } from "@/lib/appsService";
import type { AppDto } from "@/types/app";

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
  plan: initialPlan,
}: {
  plan: PlanDto;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  // State
  const [plan, setPlan] = useState<PlanDto>(initialPlan);
  const [prices, setPrices] = useState<PlanPriceDto[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureDto[]>([]);
  const [features, setFeatures] = useState<FeatureDto[]>([]);
  const [apps, setApps] = useState<AppDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    plan: true,
    prices: true,
    features: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load related data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pricesData, planFeaturesData, featuresData, appsData] = await Promise.all([
          getAllPlanPrices(plan.id),
          getAllPlanFeatures(plan.id),
          getFeaturesByApp(plan.appId),
          getAllApps(),
        ]);
        setPrices(pricesData);
        setPlanFeatures(planFeaturesData);
        setFeatures(featuresData);
        setApps(appsData);
      } catch (error: any) {
        notifyError("Yükleme hatası", error?.message || "Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [plan.id, plan.appId]);

  // Save Plan
  const handleSavePlan = async (updatedPlan: PlanDto) => {
    setSavingSection("plan");
    setErr(null);
    try {
      const appChanged = updatedPlan.appId !== plan.appId;
      
      const updateData: PlanUpdateDto = {
        id: updatedPlan.id,
        appId: updatedPlan.appId,
        name: updatedPlan.name,
        code: updatedPlan.code,
        description: updatedPlan.description,
        isPublic: updatedPlan.isPublic,
        isFree: updatedPlan.isFree,
        trialDays: updatedPlan.trialDays,
        billingPeriod: updatedPlan.billingPeriod,
        renewalPolicy: updatedPlan.renewalPolicy,
      };
      await updatePlan(updatedPlan.id, updateData);
      setPlan(updatedPlan);
      
      // Eğer uygulama değiştiyse, features'ı da yeniden yükle
      if (appChanged) {
        try {
          const newFeatures = await getFeaturesByApp(updatedPlan.appId);
          setFeatures(newFeatures);
        } catch (error) {
          // Features yüklenemezse sessizce devam et
        }
      }
      
      notifySuccess("Başarılı", appChanged ? "Plan güncellendi ve uygulama değiştirildi" : "Plan güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "Plan güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Price
  const handleSavePrice = async (price: PlanPriceDto | PlanPriceAddDto) => {
    const isNew = !('id' in price) || !price.id;
    setSavingSection(`price-${isNew ? 'new' : price.id}`);
    setErr(null);
    try {
      if (isNew) {
        const newPrice = await createPlanPrice(price as PlanPriceAddDto);
        setPrices(prev => [...prev, newPrice]);
        notifySuccess("Başarılı", "Fiyat eklendi");
      } else {
        await updatePlanPrice(price.id, price as PlanPriceUpdateDto);
        setPrices(prev => prev.map(p => p.id === price.id ? price as PlanPriceDto : p));
        notifySuccess("Başarılı", "Fiyat güncellendi");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Fiyat kaydedilemedi";
      setErr(errorMessage);
      notifyError("Kaydetme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Delete Price
  const handleDeletePrice = async (id: string) => {
    if (!confirm("Bu fiyatı silmek istediğinize emin misiniz?")) return;
    setSavingSection(`price-delete-${id}`);
    setErr(null);
    try {
      await deletePlanPrice(id);
      setPrices(prev => prev.filter(p => p.id !== id));
      notifySuccess("Başarılı", "Fiyat silindi");
    } catch (error: any) {
      const errorMessage = error?.message || "Fiyat silinemedi";
      setErr(errorMessage);
      notifyError("Silme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Save Plan Feature
  const handleSavePlanFeature = async (pf: PlanFeatureDto | PlanFeatureAddDto) => {
    const isNew = !('id' in pf) || !pf.id;
    setSavingSection(`planfeature-${isNew ? 'new' : pf.id}`);
    setErr(null);
    try {
      if (isNew) {
        await createPlanFeature(pf as PlanFeatureAddDto);
        const updated = await getAllPlanFeatures(plan.id);
        setPlanFeatures(updated);
        notifySuccess("Başarılı", "Plan özelliği eklendi");
      } else {
        await updatePlanFeature(pf.id, pf as PlanFeatureUpdateDto);
        setPlanFeatures(prev => prev.map(p => p.id === pf.id ? pf as PlanFeatureDto : p));
        notifySuccess("Başarılı", "Plan özelliği güncellendi");
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Plan özelliği kaydedilemedi";
      setErr(errorMessage);
      notifyError("Kaydetme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  // Delete Plan Feature
  const handleDeletePlanFeature = async (id: string) => {
    if (!confirm("Bu plan özelliğini silmek istediğinize emin misiniz?")) return;
    setSavingSection(`planfeature-delete-${id}`);
    setErr(null);
    try {
      await deletePlanFeature(id);
      setPlanFeatures(prev => prev.filter(p => p.id !== id));
      notifySuccess("Başarılı", "Plan özelliği silindi");
    } catch (error: any) {
      const errorMessage = error?.message || "Plan özelliği silinemedi";
      setErr(errorMessage);
      notifyError("Silme başarısız", errorMessage);
    } finally {
      setSavingSection(null);
    }
  };

  const formatCurrency = (amount: number, currency: CurrencyCode): string => {
    const symbol = 
      currency === CurrencyCode.TRY ? "₺" : 
      currency === CurrencyCode.USD ? "$" : 
      currency === CurrencyCode.EUR ? "€" : 
      currency === CurrencyCode.GBP ? "£" : "";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className={cn(components.card, "p-8 text-center")}>
        <div className={cn("text-sm", text.muted)}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Plan Information */}
      <AccordionSection
        title="Plan Bilgileri"
        icon={Package}
        isOpen={openSections.plan}
        onToggle={() => toggleSection("plan")}
      >
        <PlanEditor
          plan={plan}
          apps={apps}
          onSave={handleSavePlan}
          saving={savingSection === "plan"}
        />
      </AccordionSection>

      {/* Prices */}
      <AccordionSection
        title={`Fiyatlar (${prices.length})`}
        icon={DollarSign}
        isOpen={openSections.prices}
        onToggle={() => toggleSection("prices")}
      >
        <PricesEditor
          planId={plan.id}
          prices={prices}
          onSave={handleSavePrice}
          onDelete={handleDeletePrice}
          saving={savingSection}
        />
      </AccordionSection>

      {/* Plan Features */}
      <AccordionSection
        title={`Plan Özellikleri (${planFeatures.length})`}
        icon={Zap}
        isOpen={openSections.features}
        onToggle={() => toggleSection("features")}
      >
        <PlanFeaturesEditor
          planId={plan.id}
          planFeatures={planFeatures}
          features={features}
          onSave={handleSavePlanFeature}
          onDelete={handleDeletePlanFeature}
          saving={savingSection}
        />
      </AccordionSection>
    </div>
  );
}

// Plan Editor Component
function PlanEditor({
  plan,
  apps,
  onSave,
  saving,
}: {
  plan: PlanDto;
  apps: AppDto[];
  onSave: (updatedPlan: PlanDto) => void;
  saving: boolean;
}) {
  const [localPlan, setLocalPlan] = useState<PlanDto>(plan);

  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.muted)}>Uygulama *</label>
        <SelectBase
          value={localPlan.appId}
          onChange={(e) => setLocalPlan({ ...localPlan, appId: e.target.value })}
        >
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.code})
            </option>
          ))}
        </SelectBase>
        <p className={cn("text-xs", text.muted)}>
          Plan'ı başka bir uygulamaya taşıyabilirsiniz. Bu değişiklik plan'ın ait olduğu uygulamayı değiştirir.
        </p>
      </div>

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
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Faturalama Dönemi</label>
          <SelectBase
            value={localPlan.billingPeriod}
            onChange={(e) => setLocalPlan({ ...localPlan, billingPeriod: Number(e.target.value) })}
          >
            <option value={BillingPeriod.OneTime}>Tek Seferlik</option>
            <option value={BillingPeriod.Daily}>Günlük</option>
            <option value={BillingPeriod.Weekly}>Haftalık</option>
            <option value={BillingPeriod.Monthly}>Aylık</option>
            <option value={BillingPeriod.Yearly}>Yıllık</option>
          </SelectBase>
        </div>

        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Yenileme Politikası</label>
          <SelectBase
            value={localPlan.renewalPolicy}
            onChange={(e) => setLocalPlan({ ...localPlan, renewalPolicy: Number(e.target.value) })}
          >
            <option value={RenewalPolicy.None}>Yok</option>
            <option value={RenewalPolicy.Manual}>Manuel</option>
            <option value={RenewalPolicy.Auto}>Otomatik</option>
          </SelectBase>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Deneme Süresi (gün)</label>
          <InputBase
            type="number"
            min="0"
            value={localPlan.trialDays}
            onChange={(e) => setLocalPlan({ ...localPlan, trialDays: Number(e.target.value) })}
          />
        </div>

        <div className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            checked={localPlan.isPublic}
            onChange={(e) => setLocalPlan({ ...localPlan, isPublic: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <label className={cn("text-sm", text.muted)}>Herkese açık</label>
        </div>

        <div className="flex items-center gap-2 pt-7">
          <input
            type="checkbox"
            checked={localPlan.isFree}
            onChange={(e) => setLocalPlan({ ...localPlan, isFree: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <label className={cn("text-sm", text.muted)}>Ücretsiz plan</label>
        </div>
      </div>

      <button
        onClick={() => onSave(localPlan)}
        disabled={saving}
        className={cn(components.buttonPrimary, "w-full sm:w-auto disabled:opacity-50")}
      >
        <Save className="w-4 h-4" />
        {saving ? "Kaydediliyor..." : "Planı Kaydet"}
      </button>
    </div>
  );
}

// Prices Editor Component
function PricesEditor({
  planId,
  prices,
  onSave,
  onDelete,
  saving,
}: {
  planId: string;
  prices: PlanPriceDto[];
  onSave: (price: PlanPriceDto | PlanPriceAddDto) => void;
  onDelete: (id: string) => void;
  saving: string | null;
}) {
  const [editingPrice, setEditingPrice] = useState<PlanPriceDto | PlanPriceAddDto | null>(null);
  const [isNew, setIsNew] = useState(false);

  const handleEdit = (price: PlanPriceDto) => {
    setEditingPrice({ ...price });
    setIsNew(false);
  };

  const handleAddNew = () => {
    setEditingPrice({
      planId,
      currency: CurrencyCode.TRY,
      amount: 0,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: null,
      isCurrent: false,
    });
    setIsNew(true);
  };

  const handleSave = () => {
    if (!editingPrice) return;
    onSave(editingPrice);
    setEditingPrice(null);
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditingPrice(null);
    setIsNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={cn("text-sm", text.muted)}>
          Plan'a ait fiyatları buradan yönetebilirsiniz. Farklı para birimleriyle birden fazla fiyat ekleyebilirsiniz.
        </p>
        <button
          onClick={handleAddNew}
          className={cn(components.buttonSecondary, "text-sm")}
        >
          <Plus className="w-4 h-4" />
          Yeni Fiyat
        </button>
      </div>

      {editingPrice && (
        <PriceForm
          price={editingPrice}
          isNew={isNew}
          onChange={setEditingPrice}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving?.startsWith("price-") || false}
        />
      )}

      <div className="space-y-2">
        {prices.map((price) => {
          const isEditing = editingPrice && 'id' in editingPrice && editingPrice.id === price.id;
          if (isEditing) return null;

          return (
            <div
              key={price.id}
              className={cn(
                "rounded-lg border p-4",
                "bg-neutral-800/30",
                price.isCurrent ? "border-emerald-500/30" : "border-neutral-700/30"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-lg font-bold", text.primary)}>
                      {formatCurrency(price.amount, price.currency)}
                    </span>
                    {price.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        Güncel
                      </span>
                    )}
                  </div>
                  <div className={cn("text-xs space-y-1", text.muted)}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Başlangıç: {formatDate(price.effectiveFrom)}</span>
                    </div>
                    {price.effectiveTo && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Bitiş: {formatDate(price.effectiveTo)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(price)}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-neutral-700/50 hover:bg-neutral-700",
                      "text-neutral-300 hover:text-white transition-colors"
                    )}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(price.id)}
                    disabled={saving?.includes(price.id)}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-red-500/10 hover:bg-red-500/20",
                      "text-red-400 hover:text-red-300 transition-colors",
                      "disabled:opacity-50"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PriceForm({
  price,
  isNew,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  price: PlanPriceDto | PlanPriceAddDto;
  isNew: boolean;
  onChange: (price: PlanPriceDto | PlanPriceAddDto) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className={cn("rounded-lg border p-4", "bg-blue-500/5 border-blue-500/20")}>
      <h4 className={cn("text-sm font-semibold mb-4", text.primary)}>
        {isNew ? "Yeni Fiyat Ekle" : "Fiyatı Düzenle"}
      </h4>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Para Birimi *</label>
            <SelectBase
              value={price.currency}
              onChange={(e) => onChange({ ...price, currency: Number(e.target.value) as CurrencyCode })}
            >
              <option value={CurrencyCode.TRY}>TRY (₺)</option>
              <option value={CurrencyCode.USD}>USD ($)</option>
              <option value={CurrencyCode.EUR}>EUR (€)</option>
              <option value={CurrencyCode.GBP}>GBP (£)</option>
            </SelectBase>
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Tutar *</label>
            <InputBase
              type="number"
              step="0.01"
              min="0"
              value={price.amount}
              onChange={(e) => onChange({ ...price, amount: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Başlangıç Tarihi *</label>
            <InputBase
              type="date"
              value={price.effectiveFrom ? formatDate(price.effectiveFrom) : ""}
              onChange={(e) => onChange({ ...price, effectiveFrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Bitiş Tarihi</label>
            <InputBase
              type="date"
              value={price.effectiveTo ? formatDate(price.effectiveTo) : ""}
              onChange={(e) => onChange({ ...price, effectiveTo: e.target.value || null })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={price.isCurrent || false}
            onChange={(e) => onChange({ ...price, isCurrent: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <label className={cn("text-sm", text.muted)}>Güncel fiyat olarak işaretle</label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saving || !price.amount || !price.effectiveFrom}
            className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : isNew ? "Fiyat Ekle" : "Fiyatı Güncelle"}
          </button>
          <button
            onClick={onCancel}
            className={components.buttonSecondary}
          >
            <X className="w-4 h-4" />
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

// Plan Features Editor Component
function PlanFeaturesEditor({
  planId,
  planFeatures,
  features,
  onSave,
  onDelete,
  saving,
}: {
  planId: string;
  planFeatures: PlanFeatureDto[];
  features: FeatureDto[];
  onSave: (pf: PlanFeatureDto | PlanFeatureAddDto) => void;
  onDelete: (id: string) => void;
  saving: string | null;
}) {
  const [editingFeature, setEditingFeature] = useState<PlanFeatureDto | PlanFeatureAddDto | null>(null);
  const [isNew, setIsNew] = useState(false);

  const handleEdit = (pf: PlanFeatureDto) => {
    setEditingFeature({ ...pf });
    setIsNew(false);
  };

  const handleAddNew = () => {
    const availableFeatures = features.filter(
      f => !planFeatures.some(pf => pf.featureId === f.id)
    );
    if (availableFeatures.length === 0) {
      alert("Tüm özellikler plan'a eklenmiş!");
      return;
    }
    setEditingFeature({
      planId,
      featureId: availableFeatures[0].id,
      limit: null,
      resetInterval: 0,
      allowOverage: false,
      overusePrice: null,
    });
    setIsNew(true);
  };

  const handleSave = () => {
    if (!editingFeature) return;
    onSave(editingFeature);
    setEditingFeature(null);
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditingFeature(null);
    setIsNew(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className={cn("text-sm", text.muted)}>
          Plan'a ait özellik limitlerini buradan yönetebilirsiniz.
        </p>
        <button
          onClick={handleAddNew}
          className={cn(components.buttonSecondary, "text-sm")}
        >
          <Plus className="w-4 h-4" />
          Yeni Özellik
        </button>
      </div>

      {editingFeature && (
        <PlanFeatureForm
          planFeature={editingFeature}
          features={features}
          isNew={isNew}
          onChange={setEditingFeature}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving?.startsWith("planfeature-") || false}
        />
      )}

      <div className="space-y-2">
        {planFeatures.map((pf) => {
          const feature = features.find(f => f.id === pf.featureId);
          const isEditing = editingFeature && 'id' in editingFeature && editingFeature.id === pf.id;
          if (isEditing) return null;

          return (
            <div
              key={pf.id}
              className={cn("rounded-lg border p-4", "bg-neutral-800/30", "border-neutral-700/30")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={cn("font-medium text-sm mb-1", text.secondary)}>
                    {feature?.name || feature?.key || "Bilinmeyen Özellik"}
                  </div>
                  <div className={cn("text-xs space-y-1", text.muted)}>
                    <div>Limit: {pf.limit ?? "Sınırsız"} {feature?.unit || ""}</div>
                    {pf.allowOverage && (
                      <div>Aşım Fiyatı: {pf.overusePrice ? `₺${pf.overusePrice.toFixed(2)}` : "Yok"}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(pf)}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-neutral-700/50 hover:bg-neutral-700",
                      "text-neutral-300 hover:text-white transition-colors"
                    )}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(pf.id)}
                    disabled={saving?.includes(pf.id)}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-red-500/10 hover:bg-red-500/20",
                      "text-red-400 hover:text-red-300 transition-colors",
                      "disabled:opacity-50"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanFeatureForm({
  planFeature,
  features,
  isNew,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  planFeature: PlanFeatureDto | PlanFeatureAddDto;
  features: FeatureDto[];
  isNew: boolean;
  onChange: (pf: PlanFeatureDto | PlanFeatureAddDto) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const availableFeatures = isNew
    ? features.filter(f => !planFeature.featureId || f.id === planFeature.featureId)
    : features;

  return (
    <div className={cn("rounded-lg border p-4", "bg-blue-500/5 border-blue-500/20")}>
      <h4 className={cn("text-sm font-semibold mb-4", text.primary)}>
        {isNew ? "Yeni Plan Özelliği Ekle" : "Plan Özelliğini Düzenle"}
      </h4>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Özellik *</label>
          <SelectBase
            value={planFeature.featureId}
            onChange={(e) => onChange({ ...planFeature, featureId: e.target.value })}
            disabled={!isNew}
          >
            {availableFeatures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name || f.key} ({f.unit})
              </option>
            ))}
          </SelectBase>
        </div>

        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Limit</label>
          <InputBase
            type="number"
            step="0.01"
            min="0"
            value={planFeature.limit ?? ""}
            onChange={(e) => onChange({ ...planFeature, limit: e.target.value ? Number(e.target.value) : null })}
            placeholder="Boş bırakırsanız sınırsız olur"
          />
        </div>

        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Sıfırlama Aralığı</label>
          <SelectBase
            value={planFeature.resetInterval ?? 0}
            onChange={(e) => onChange({ ...planFeature, resetInterval: Number(e.target.value) })}
          >
            <option value={0}>Sıfırlama Yok</option>
            <option value={1}>Günlük</option>
            <option value={2}>Haftalık</option>
            <option value={3}>Aylık</option>
            <option value={4}>Yıllık</option>
          </SelectBase>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={planFeature.allowOverage || false}
            onChange={(e) => onChange({ ...planFeature, allowOverage: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <label className={cn("text-sm", text.muted)}>Aşım izni ver</label>
        </div>

        {planFeature.allowOverage && (
          <div className="space-y-2">
            <label className={cn("block text-sm font-medium", text.muted)}>Aşım Fiyatı</label>
            <InputBase
              type="number"
              step="0.01"
              min="0"
              value={planFeature.overusePrice ?? ""}
              onChange={(e) => onChange({ ...planFeature, overusePrice: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saving || !planFeature.featureId}
            className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : isNew ? "Özellik Ekle" : "Özelliği Güncelle"}
          </button>
          <button
            onClick={onCancel}
            className={components.buttonSecondary}
          >
            <X className="w-4 h-4" />
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = 
    currency === CurrencyCode.TRY ? "₺" : 
    currency === CurrencyCode.USD ? "$" : 
    currency === CurrencyCode.EUR ? "€" : 
    currency === CurrencyCode.GBP ? "£" : "";
  return `${symbol}${amount.toFixed(2)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}
