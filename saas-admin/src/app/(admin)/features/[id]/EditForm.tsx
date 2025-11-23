"use client";

import type { FeatureDto } from "@/types/feature";
import type { FeatureUpdateDto } from "@/lib/featuresService";
import type { PlanFeatureDto, PlanFeatureAddDto, PlanFeatureUpdateDto } from "@/lib/planFeaturesService";
import type { PlanDto } from "@/types/plan";
import type { AppDto } from "@/types/app";
import { useState, useEffect } from "react";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { 
  Save, X, ChevronDown, ChevronUp, Zap, Package,
  Plus, Trash2
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { updateFeature } from "@/lib/featuresService";
import { getAllPlanFeatures, updatePlanFeature, createPlanFeature, deletePlanFeature } from "@/lib/planFeaturesService";
import { getAllPlans } from "@/lib/plansService";
import { getAllApps } from "@/lib/appsService";

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
  feature: initialFeature,
}: {
  feature: FeatureDto;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  // State
  const [feature, setFeature] = useState<FeatureDto>(initialFeature);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureDto[]>([]);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [apps, setApps] = useState<AppDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    feature: true,
    planFeatures: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load related data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [planFeaturesData, plansData, appsData] = await Promise.all([
          getAllPlanFeatures(undefined, feature.id),
          getAllPlans(feature.appId),
          getAllApps(),
        ]);
        setPlanFeatures(planFeaturesData);
        setPlans(plansData);
        setApps(appsData);
      } catch (error: any) {
        notifyError("Yükleme hatası", error?.message || "Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [feature.id, feature.appId]);

  // Save Feature
  const handleSaveFeature = async (updatedFeature: FeatureDto) => {
    setSavingSection("feature");
    setErr(null);
    try {
      const appChanged = updatedFeature.appId !== feature.appId;
      
      const updateData: FeatureUpdateDto = {
        id: updatedFeature.id,
        appId: updatedFeature.appId,
        key: updatedFeature.key,
        name: updatedFeature.name,
        unit: updatedFeature.unit,
        description: updatedFeature.description,
      };
      await updateFeature(updatedFeature.id, updateData);
      setFeature(updatedFeature);
      
      // Eğer uygulama değiştiyse, planları da yeniden yükle
      if (appChanged) {
        try {
          const newPlans = await getAllPlans(updatedFeature.appId);
          setPlans(newPlans);
        } catch (error) {
          // Plans yüklenemezse sessizce devam et
        }
      }
      
      notifySuccess("Başarılı", appChanged ? "Özellik güncellendi ve uygulama değiştirildi" : "Özellik güncellendi");
    } catch (error: any) {
      const errorMessage = error?.message || "Özellik güncellenemedi";
      setErr(errorMessage);
      notifyError("Güncelleme başarısız", errorMessage);
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
        const updated = await getAllPlanFeatures(undefined, feature.id);
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

      {/* Feature Information */}
      <AccordionSection
        title="Özellik Bilgileri"
        icon={Zap}
        isOpen={openSections.feature}
        onToggle={() => toggleSection("feature")}
      >
        <FeatureEditor
          feature={feature}
          apps={apps}
          onSave={handleSaveFeature}
          saving={savingSection === "feature"}
        />
      </AccordionSection>

      {/* Plan Features */}
      <AccordionSection
        title={`Plan'larda Kullanım (${planFeatures.length})`}
        icon={Package}
        isOpen={openSections.planFeatures}
        onToggle={() => toggleSection("planFeatures")}
      >
        <PlanFeaturesEditor
          featureId={feature.id}
          appId={feature.appId}
          planFeatures={planFeatures}
          plans={plans}
          onSave={handleSavePlanFeature}
          onDelete={handleDeletePlanFeature}
          saving={savingSection}
        />
      </AccordionSection>
    </div>
  );
}

// Feature Editor Component
function FeatureEditor({
  feature,
  apps,
  onSave,
  saving,
}: {
  feature: FeatureDto;
  apps: AppDto[];
  onSave: (updatedFeature: FeatureDto) => void;
  saving: boolean;
}) {
  const [localFeature, setLocalFeature] = useState<FeatureDto>(feature);

  useEffect(() => {
    setLocalFeature(feature);
  }, [feature]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.muted)}>Uygulama *</label>
        <SelectBase
          value={localFeature.appId}
          onChange={(e) => setLocalFeature({ ...localFeature, appId: e.target.value })}
        >
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.code})
            </option>
          ))}
        </SelectBase>
        <p className={cn("text-xs", text.muted)}>
          Özelliği başka bir uygulamaya taşıyabilirsiniz. Bu değişiklik özelliğin ait olduğu uygulamayı değiştirir.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Özellik Adı *</label>
          <InputBase
            value={localFeature.name}
            onChange={(e) => setLocalFeature({ ...localFeature, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Anahtar (Key) *</label>
          <InputBase
            value={localFeature.key}
            onChange={(e) => setLocalFeature({ ...localFeature, key: e.target.value.toLowerCase().replace(/\s+/g, '.') })}
            placeholder="örn: api.requests"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Birim *</label>
          <InputBase
            value={localFeature.unit}
            onChange={(e) => setLocalFeature({ ...localFeature, unit: e.target.value })}
            placeholder="örn: request, GB, seat"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.muted)}>Açıklama</label>
        <TextareaBase
          value={localFeature.description || ""}
          onChange={(e) => setLocalFeature({ ...localFeature, description: e.target.value || "" })}
        />
      </div>

      <button
        onClick={() => onSave(localFeature)}
        disabled={saving || !localFeature.name || !localFeature.key || !localFeature.unit}
        className={cn(components.buttonPrimary, "w-full sm:w-auto disabled:opacity-50")}
      >
        <Save className="w-4 h-4" />
        {saving ? "Kaydediliyor..." : "Özelliği Kaydet"}
      </button>
    </div>
  );
}

// Plan Features Editor Component
function PlanFeaturesEditor({
  featureId,
  appId,
  planFeatures,
  plans,
  onSave,
  onDelete,
  saving,
}: {
  featureId: string;
  appId: string;
  planFeatures: PlanFeatureDto[];
  plans: PlanDto[];
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
    const availablePlans = plans.filter(
      p => !planFeatures.some(pf => pf.planId === p.id)
    );
    if (availablePlans.length === 0) {
      alert("Tüm planlara bu özellik eklenmiş!");
      return;
    }
    setEditingFeature({
      planId: availablePlans[0].id,
      featureId,
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
          Bu özelliğin hangi planlarda kullanılacağını ve limitlerini buradan yönetebilirsiniz.
        </p>
        <button
          onClick={handleAddNew}
          className={cn(components.buttonSecondary, "text-sm")}
        >
          <Plus className="w-4 h-4" />
          Yeni Plan Özelliği
        </button>
      </div>

      {editingFeature && (
        <PlanFeatureForm
          planFeature={editingFeature}
          plans={plans}
          isNew={isNew}
          onChange={setEditingFeature}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving?.startsWith("planfeature-") || false}
        />
      )}

      <div className="space-y-2">
        {planFeatures.map((pf) => {
          const plan = plans.find(p => p.id === pf.planId);
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
                    {plan?.name || "Bilinmeyen Plan"} ({plan?.code || "N/A"})
                  </div>
                  <div className={cn("text-xs space-y-1", text.muted)}>
                    <div>Limit: {pf.limit ?? "Sınırsız"}</div>
                    {pf.allowOverage && (
                      <div>Aşım Fiyatı: {pf.overusePrice ? `₺${pf.overusePrice.toFixed(2)}` : "Yok"}</div>
                    )}
                    <div>Sıfırlama: {
                      pf.resetInterval === 0 ? "Yok" :
                      pf.resetInterval === 1 ? "Günlük" :
                      pf.resetInterval === 2 ? "Haftalık" :
                      pf.resetInterval === 3 ? "Aylık" :
                      pf.resetInterval === 4 ? "Yıllık" :
                      "Bilinmeyen"
                    }</div>
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
  plans,
  isNew,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  planFeature: PlanFeatureDto | PlanFeatureAddDto;
  plans: PlanDto[];
  isNew: boolean;
  onChange: (pf: PlanFeatureDto | PlanFeatureAddDto) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const availablePlans = isNew
    ? plans.filter(p => !planFeature.planId || p.id === planFeature.planId)
    : plans;

  return (
    <div className={cn("rounded-lg border p-4", "bg-blue-500/5 border-blue-500/20")}>
      <h4 className={cn("text-sm font-semibold mb-4", text.primary)}>
        {isNew ? "Yeni Plan Özelliği Ekle" : "Plan Özelliğini Düzenle"}
      </h4>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.muted)}>Plan *</label>
          <SelectBase
            value={planFeature.planId}
            onChange={(e) => onChange({ ...planFeature, planId: e.target.value })}
            disabled={!isNew}
          >
            {availablePlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
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
            disabled={saving || !planFeature.planId}
            className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : isNew ? "Plan Özelliği Ekle" : "Plan Özelliğini Güncelle"}
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

