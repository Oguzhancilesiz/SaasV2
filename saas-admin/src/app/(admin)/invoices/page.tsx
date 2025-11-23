import { getAllInvoices } from "@/lib/invoicesService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import type { InvoiceDto } from "@/types/invoice";
import { PaymentStatus } from "@/types/invoice";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import InvoicesListClient from "./InvoicesListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import { Plus } from "lucide-react";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 12;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const userId = params.userId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const periodFilter = params.period ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  const attentionFilter = params.attention ?? "all";
  const now = new Date();
  
  const [invoices, apps, users] = await Promise.all([
    getAllInvoices().catch(() => []),
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<InvoiceDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((inv) => inv.appId === appId);
  }

  // User filtresi
  if (userId) {
    customFilters.push((inv) => inv.userId === userId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<InvoiceDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Period filtresi (tarih aralığı)
  if (periodFilter !== "all") {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    switch (periodFilter) {
      case "today":
        customFilters.push((inv) => {
          const createdDate = new Date(inv.createdDate);
          const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
          return createdDateOnly.getTime() === today.getTime();
        });
        break;
      case "yesterday":
        customFilters.push((inv) => {
          const createdDate = new Date(inv.createdDate);
          const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
          return createdDateOnly.getTime() === yesterday.getTime();
        });
        break;
      case "last_7days":
        customFilters.push((inv) => {
          const createdDate = new Date(inv.createdDate);
          return createdDate >= sevenDaysAgo && createdDate <= now;
        });
        break;
      case "last_30days":
        customFilters.push((inv) => {
          const createdDate = new Date(inv.createdDate);
          return createdDate >= thirtyDaysAgo && createdDate <= now;
        });
        break;
      case "last_90days":
        customFilters.push((inv) => {
          const createdDate = new Date(inv.createdDate);
          return createdDate >= ninetyDaysAgo && createdDate <= now;
        });
        break;
    }
  }

  const soonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  switch (attentionFilter) {
    case "requires_action":
      customFilters.push((inv) => inv.requiresAction || inv.paymentStatus === PaymentStatus.RequiresAction);
      break;
    case "retry_overdue":
      customFilters.push((inv) => {
        if (!inv.nextRetryAt) return false;
        const nextDate = new Date(inv.nextRetryAt);
        return !Number.isNaN(nextDate.getTime()) && nextDate < now;
      });
      break;
    case "retry_due":
      customFilters.push((inv) => {
        if (!inv.nextRetryAt) return false;
        const nextDate = new Date(inv.nextRetryAt);
        return !Number.isNaN(nextDate.getTime()) && nextDate >= now && nextDate <= soonThreshold;
      });
      break;
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    created_desc: (a: InvoiceDto, b: InvoiceDto) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: InvoiceDto, b: InvoiceDto) => 
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    total_desc: (a: InvoiceDto, b: InvoiceDto) => 
      (b.total || 0) - (a.total || 0),
    total_asc: (a: InvoiceDto, b: InvoiceDto) => 
      (a.total || 0) - (b.total || 0),
    periodStart_desc: (a: InvoiceDto, b: InvoiceDto) => 
      new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime(),
    periodStart_asc: (a: InvoiceDto, b: InvoiceDto) => 
      new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
  };

  // Arama için özel filtreleme (app, user isimlerinde, invoice numarasında)
  let searchFiltered = invoices;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    searchFiltered = invoices.filter(inv => {
      const app = apps.find(a => a.id === inv.appId);
      const user = users.find(u => u.userId === inv.userId);
      return (
        app?.name.toLowerCase().includes(query) ||
        app?.code.toLowerCase().includes(query) ||
        user?.email.toLowerCase().includes(query) ||
        user?.userName.toLowerCase().includes(query) ||
        inv.paymentReference?.toLowerCase().includes(query) ||
        inv.autoID.toString().includes(query)
      );
    });
  }

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredInvoices, pagination } = processItems({
    items: searchFiltered,
    searchQuery: "", // Arama zaten yukarıda yapıldı
    searchFields: [],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  const finalFiltered = filteredInvoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Faturalar</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "fatura" : "fatura"} bulundu
          </p>
        </div>
        <Link
          href="/invoices/yeni"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Fatura</span>
          <span className="sm:hidden">Yeni</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: uygulama, kullanıcı veya fatura numarası",
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

      {/* Invoices List */}
      <InvoicesListClient 
        invoices={finalFiltered} 
        apps={apps} 
        users={users}
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

