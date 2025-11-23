import { getAllPlans } from "@/lib/plansService";
import { getAllApps } from "@/lib/appsService";
import type { PlanDto } from "@/types/plan";
import { Status } from "@/types/app";
import FilterToolbar from "@/components/filters/FilterToolbar";
import PlansListClient from "./PlansListClient";
import AdvancedFilters from "./AdvancedFilters";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Suspense } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 12;

export default async function PlansPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const billingPeriodFilter = params.billingPeriod ?? "all";
  const renewalPolicyFilter = params.renewalPolicy ?? "all";
  const trialDaysFilter = params.trialDays ?? "all";
  const isFreeFilter = params.isFree ?? "all";
  const isPublicFilter = params.isPublic ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  const [plans, apps] = await Promise.all([
    getAllPlans(),
    getAllApps(),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<PlanDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((plan) => plan.appId === appId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<PlanDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Billing Period filtresi
  if (billingPeriodFilter !== "all") {
    const periodNum = parseInt(billingPeriodFilter);
    if (!isNaN(periodNum)) {
      customFilters.push((plan) => plan.billingPeriod === periodNum);
    }
  }

  // Renewal Policy filtresi
  if (renewalPolicyFilter !== "all") {
    const policyNum = parseInt(renewalPolicyFilter);
    if (!isNaN(policyNum)) {
      customFilters.push((plan) => plan.renewalPolicy === policyNum);
    }
  }

  // Trial Days filtresi
  if (trialDaysFilter !== "all") {
    switch (trialDaysFilter) {
      case "none":
        customFilters.push((plan) => plan.trialDays === 0);
        break;
      case "short":
        customFilters.push((plan) => plan.trialDays > 0 && plan.trialDays <= 7);
        break;
      case "medium":
        customFilters.push((plan) => plan.trialDays > 7 && plan.trialDays <= 30);
        break;
      case "long":
        customFilters.push((plan) => plan.trialDays > 30);
        break;
    }
  }

  // IsFree filtresi
  if (isFreeFilter !== "all") {
    const isFree = isFreeFilter === "free";
    customFilters.push((plan) => plan.isFree === isFree);
  }

  // IsPublic filtresi
  if (isPublicFilter !== "all") {
    const isPublic = isPublicFilter === "public";
    customFilters.push((plan) => plan.isPublic === isPublic);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    name_asc: (a: PlanDto, b: PlanDto) => (a.name || "").localeCompare(b.name || ""),
    name_desc: (a: PlanDto, b: PlanDto) => (b.name || "").localeCompare(a.name || ""),
    code_asc: (a: PlanDto, b: PlanDto) => (a.code || "").localeCompare(b.code || ""),
    code_desc: (a: PlanDto, b: PlanDto) => (b.code || "").localeCompare(a.code || ""),
    created_desc: (a: PlanDto, b: PlanDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: PlanDto, b: PlanDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    billingPeriod_asc: (a: PlanDto, b: PlanDto) => a.billingPeriod - b.billingPeriod,
    billingPeriod_desc: (a: PlanDto, b: PlanDto) => b.billingPeriod - a.billingPeriod,
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredPlans, pagination } = processItems({
    items: plans,
    searchQuery,
    searchFields: ["name", "code", "description"],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  const selectedApp = appId ? apps.find(a => a.id === appId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Planlar</h1>
          <p className={text.muted + " text-sm"}>
            {selectedApp ? `${selectedApp.name} - ` : ""}
            {pagination.totalItems} {pagination.totalItems === 1 ? "plan" : "plan"} bulundu
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedApp && (
            <a
              href="/plans"
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                "bg-neutral-800/50 hover:bg-neutral-800 text-sm",
                "text-neutral-300 hover:text-white transition-all border border-neutral-800/50"
              )}
            >
              Tüm Planlar
            </a>
          )}
          <a
            href={appId ? `/plans/yeni?appId=${appId}` : "/plans/yeni"}
            className={components.buttonPrimary}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yeni Plan</span>
            <span className="sm:hidden">Yeni</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={cn(components.card, "p-4")}>
        <FilterToolbar
          config={{
            searchPlaceholder: "Ara: ad, kod veya açıklama",
            searchFields: ["name", "code", "description"],
            statusOptions: [
              { value: "all", label: "Tümü" },
              { value: "active", label: "Aktif" },
              { value: "passive", label: "Pasif" },
            ],
            sortOptions: [
              { value: "created_desc", label: "Yeni eklenen" },
              { value: "created_asc", label: "Eskiden yeniye" },
              { value: "name_asc", label: "Ad A→Z" },
              { value: "name_desc", label: "Ad Z→A" },
              { value: "code_asc", label: "Kod A→Z" },
              { value: "code_desc", label: "Kod Z→A" },
              { value: "billingPeriod_asc", label: "Faturalama Dönemi (Art)" },
              { value: "billingPeriod_desc", label: "Faturalama Dönemi (Az)" },
            ],
          }}
        />
      </div>

      {/* Advanced Filters */}
      <Suspense fallback={<div className={cn(components.card, "p-4")}>Filtreler yükleniyor...</div>}>
        <AdvancedFilters apps={apps} appId={appId} />
      </Suspense>

      {/* Plans List */}
      <PlansListClient 
        plans={filteredPlans} 
        apps={apps} 
        searchQuery={searchQuery} 
        appId={appId}
        pagination={pagination}
      />
    </div>
  );
}
