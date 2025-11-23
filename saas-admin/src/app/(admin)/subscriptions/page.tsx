import { getAllSubscriptions } from "@/lib/subscriptionsService";
import { getAllApps } from "@/lib/appsService";
import { getAllPlans } from "@/lib/plansService";
import { getAllUsers } from "@/lib/usersService";
import type { SubscriptionDto } from "@/types/subscription";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import SubscriptionsListClient from "./SubscriptionsListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import { RenewalPolicy } from "@/types/plan";
import { Plus } from "lucide-react";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 12;

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const userId = params.userId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const renewalPolicyFilter = params.renewalPolicy ?? "all";
  const expiryFilter = params.expiry ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  
  const [subscriptions, apps, plans, users] = await Promise.all([
    getAllSubscriptions().catch(() => []),
    getAllApps().catch(() => []),
    getAllPlans().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<SubscriptionDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((sub) => sub.appId === appId);
  }

  // User filtresi
  if (userId) {
    customFilters.push((sub) => sub.userId === userId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<SubscriptionDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Renewal Policy filtresi
  if (renewalPolicyFilter !== "all") {
    const policyNum = parseInt(renewalPolicyFilter);
    if (!isNaN(policyNum)) {
      customFilters.push((sub) => sub.renewalPolicy === policyNum);
    }
  }

  // Bitiş Tarihi Filtresi
  if (expiryFilter !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const ninetyDaysLater = new Date(today);
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

    switch (expiryFilter) {
      case "active":
        customFilters.push((sub) => {
          if (!sub.endAt) return true; // EndAt yoksa aktif
          const endDate = new Date(sub.endAt);
          return endDate > now;
        });
        break;
      case "expired":
        customFilters.push((sub) => {
          if (!sub.endAt) return false;
          const endDate = new Date(sub.endAt);
          return endDate <= now;
        });
        break;
      case "expires_today":
        customFilters.push((sub) => {
          if (!sub.endAt) return false;
          const endDate = new Date(sub.endAt);
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return endDateOnly.getTime() === today.getTime();
        });
        break;
      case "expires_7days":
        customFilters.push((sub) => {
          if (!sub.endAt) return false;
          const endDate = new Date(sub.endAt);
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return endDateOnly > today && endDateOnly <= sevenDaysLater;
        });
        break;
      case "expires_30days":
        customFilters.push((sub) => {
          if (!sub.endAt) return false;
          const endDate = new Date(sub.endAt);
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return endDateOnly > today && endDateOnly <= thirtyDaysLater;
        });
        break;
      case "expires_90days":
        customFilters.push((sub) => {
          if (!sub.endAt) return false;
          const endDate = new Date(sub.endAt);
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return endDateOnly > today && endDateOnly <= ninetyDaysLater;
        });
        break;
    }
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    created_desc: (a: SubscriptionDto, b: SubscriptionDto) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: SubscriptionDto, b: SubscriptionDto) => 
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    startAt_desc: (a: SubscriptionDto, b: SubscriptionDto) => 
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    startAt_asc: (a: SubscriptionDto, b: SubscriptionDto) => 
      new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    renewAt_desc: (a: SubscriptionDto, b: SubscriptionDto) => {
      const aTime = a.renewAt ? new Date(a.renewAt).getTime() : 0;
      const bTime = b.renewAt ? new Date(b.renewAt).getTime() : 0;
      return bTime - aTime;
    },
    renewAt_asc: (a: SubscriptionDto, b: SubscriptionDto) => {
      const aTime = a.renewAt ? new Date(a.renewAt).getTime() : 0;
      const bTime = b.renewAt ? new Date(b.renewAt).getTime() : 0;
      return aTime - bTime;
    },
  };

  // Arama için özel filtreleme (app, plan, user isimlerinde)
  let searchFiltered = subscriptions;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    searchFiltered = subscriptions.filter(s => {
      const app = apps.find(a => a.id === s.appId);
      const plan = plans.find(p => p.id === s.planId);
      const user = users.find(u => u.userId === s.userId);
      return (
        app?.name.toLowerCase().includes(query) ||
        app?.code.toLowerCase().includes(query) ||
        plan?.name.toLowerCase().includes(query) ||
        plan?.code.toLowerCase().includes(query) ||
        user?.email.toLowerCase().includes(query) ||
        user?.userName.toLowerCase().includes(query) ||
        s.externalPaymentRef?.toLowerCase().includes(query)
      );
    });
  }

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredSubscriptions, pagination } = processItems({
    items: searchFiltered,
    searchQuery: "", // Arama zaten yukarıda yapıldı
    searchFields: [],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  const finalFiltered = filteredSubscriptions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Abonelikler</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "abonelik" : "abonelik"} bulundu
          </p>
        </div>
        <a
          href="/subscriptions/yeni"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Abonelik</span>
          <span className="sm:hidden">Yeni</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: uygulama, plan veya kullanıcı",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
            }}
          />
        </div>
      </Suspense>

      {/* Advanced Filters */}
      <Suspense fallback={<div className="h-32" />}>
        <AdvancedFilters apps={apps} users={users} />
      </Suspense>

      {/* Subscriptions List */}
      <SubscriptionsListClient 
        subscriptions={finalFiltered} 
        apps={apps} 
        plans={plans} 
        users={users}
        searchQuery={searchQuery}
        appId={appId}
        userId={userId}
        pagination={pagination}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}


