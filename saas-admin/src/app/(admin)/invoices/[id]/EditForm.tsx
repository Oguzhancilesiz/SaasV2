"use client";

import type { InvoiceDto } from "@/types/invoice";
import type { InvoiceUpdateDto } from "@/lib/invoicesService";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import Link from "next/link";
import { Save, X, Package, User, Calendar, DollarSign, Trash2, Calculator } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { updateInvoice, deleteInvoice, recalculateInvoice } from "@/lib/invoicesService";
import { CurrencyCode } from "@/types/app";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(components.input, props.className)} />
  );
}

export default function EditForm({ invoice: initialInvoice, apps, users }: { 
  invoice: InvoiceDto; 
  apps: AppDto[]; 
  users: UserDto[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [formData, setFormData] = useState({
    appId: initialInvoice.appId,
    userId: initialInvoice.userId,
    periodStart: initialInvoice.periodStart ? new Date(initialInvoice.periodStart).toISOString().slice(0, 10) : "",
    periodEnd: initialInvoice.periodEnd ? new Date(initialInvoice.periodEnd).toISOString().slice(0, 10) : "",
    currency: initialInvoice.currency,
    subtotal: initialInvoice.subtotal,
    tax: initialInvoice.tax,
    total: initialInvoice.total,
    paymentReference: initialInvoice.paymentReference || "",
  });

  const handleSubtotalChange = (value: string) => {
    const subtotal = parseFloat(value) || 0;
    const tax = subtotal * 0.20; // %20 KDV
    const total = subtotal + tax;
    setFormData({ ...formData, subtotal, tax, total });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.userId) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        const updateData: InvoiceUpdateDto = {
          id: initialInvoice.id,
          currency: formData.currency,
          subtotal: formData.subtotal,
          tax: formData.tax,
          total: formData.total,
          paymentStatus: initialInvoice.paymentStatus,
          paymentProvider: initialInvoice.paymentProvider,
          paymentReference: formData.paymentReference.trim() || null,
          dueDate: initialInvoice.dueDate,
          paidAt: initialInvoice.paidAt,
          failedAt: initialInvoice.failedAt,
          requiresAction: initialInvoice.requiresAction,
          nextRetryAt: initialInvoice.nextRetryAt,
          status: initialInvoice.status,
        };
        
        await updateInvoice(initialInvoice.id, updateData);
        
        notifySuccess("Başarılı", "Fatura güncellendi");
        router.push(`/invoices?appId=${formData.appId}&userId=${formData.userId}`);
        router.refresh();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Fatura güncellenemedi";
        setErr(errorMessage);
        notifyError("Güncelleme başarısız", errorMessage);
      }
    });
  };

  const handleDelete = async () => {
    start(async () => {
      try {
        await deleteInvoice(initialInvoice.id);
        notifySuccess("Başarılı", "Fatura silindi");
        router.push("/invoices");
        router.refresh();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Fatura silinemedi";
        notifyError("Hata", errorMessage);
      }
    });
  };

  const handleRecalculate = async () => {
    start(async () => {
      try {
        await recalculateInvoice(initialInvoice.id);
        notifySuccess("Başarılı", "Fatura toplamları yeniden hesaplandı");
        router.refresh();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Fatura yeniden hesaplanamadı";
        notifyError("Hata", errorMessage);
      }
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "max-w-2xl space-y-6",
          components.card,
          "p-6 sm:p-8"
        )}
      >
        {/* Uygulama Seçimi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Package className="w-4 h-4" />
            Uygulama *
          </label>
          <SelectBase
            value={formData.appId}
            onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
            required
          >
            <option value="">Uygulama seçin</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name} ({app.code})
              </option>
            ))}
          </SelectBase>
        </div>

        {/* Kullanıcı Seçimi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <User className="w-4 h-4" />
            Kullanıcı *
          </label>
          <SelectBase
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            required
          >
            <option value="">Kullanıcı seçin</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.email || user.userName || user.userId}
              </option>
            ))}
          </SelectBase>
        </div>

        {/* Dönem Başlangıç */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Calendar className="w-4 h-4" />
            Dönem Başlangıç *
          </label>
          <InputBase
            type="date"
            value={formData.periodStart}
            onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
            required
          />
        </div>

        {/* Dönem Bitiş */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Calendar className="w-4 h-4" />
            Dönem Bitiş *
          </label>
          <InputBase
            type="date"
            value={formData.periodEnd}
            onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
            required
          />
        </div>

        {/* Para Birimi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <DollarSign className="w-4 h-4" />
            Para Birimi *
          </label>
          <SelectBase
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: Number(e.target.value) as CurrencyCode })}
            required
          >
            <option value={CurrencyCode.TRY}>TRY (₺)</option>
            <option value={CurrencyCode.USD}>USD ($)</option>
            <option value={CurrencyCode.EUR}>EUR (€)</option>
            <option value={CurrencyCode.GBP}>GBP (£)</option>
          </SelectBase>
        </div>

        {/* Ara Toplam */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <DollarSign className="w-4 h-4" />
            Ara Toplam *
          </label>
          <InputBase
            type="number"
            step="0.01"
            value={formData.subtotal}
            onChange={(e) => handleSubtotalChange(e.target.value)}
            required
            placeholder="0.00"
          />
        </div>

        {/* KDV */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            KDV (%20)
          </label>
          <InputBase
            type="number"
            step="0.01"
            value={formData.tax.toFixed(2)}
            readOnly
            className="bg-neutral-800/30"
          />
        </div>

        {/* Toplam */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            Toplam
          </label>
          <InputBase
            type="number"
            step="0.01"
            value={formData.total.toFixed(2)}
            readOnly
            className="bg-neutral-800/30 font-semibold"
          />
        </div>

        {/* External Payment Ref */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            External Payment Ref (Opsiyonel)
          </label>
          <InputBase
            type="text"
            value={formData.paymentReference}
            onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
            placeholder="Dış ödeme referansı"
          />
        </div>

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

        <div className="flex items-center gap-3 pt-4 border-t border-neutral-800/50">
          <button
            type="submit"
            className={cn(components.buttonPrimary, "flex-1 min-w-[140px] disabled:opacity-50")}
            disabled={pending}
          >
            <Save className="w-4 h-4" />
            {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={pending}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-blue-500/10 text-blue-400 border border-blue-500/20",
              "hover:bg-blue-500/20 transition-all",
              "flex items-center gap-2",
              pending && "opacity-50 cursor-not-allowed"
            )}
            title="Fatura Toplamlarını Yeniden Hesapla"
          >
            <Calculator className="w-4 h-4" />
            Yeniden Hesapla
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={pending}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-red-500/10 text-red-400 border border-red-500/20",
              "hover:bg-red-500/20 transition-all",
              "flex items-center gap-2",
              pending && "opacity-50 cursor-not-allowed"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Sil
          </button>

          <Link href="/invoices" className={components.buttonSecondary}>
            <X className="w-4 h-4" />
            İptal
          </Link>
        </div>
      </form>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Faturayı Sil"
          message="Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
          onConfirm={() => {
            handleDelete();
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}

