"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { InvoiceDto, InvoiceLineDto, InvoicePaymentAttemptDto, PaymentStatus } from "@/types/invoice";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import { CurrencyCode } from "@/types/app";
import {
  FileText, Eye, Download, ChevronDown, ChevronUp,
  X, Calendar, Building2, User, Edit, RotateCcw,
  Ban, AlertTriangle, Clock3
} from "lucide-react";
import Link from "next/link";
import { components, bg, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getInvoiceLines, getInvoicePaymentAttempts, retryInvoicePayment, cancelInvoicePayment } from "@/lib/invoicesService";
import Pagination from "@/components/filters/Pagination";
import type { PaginationInfo } from "@/lib/filterUtils";

// Payment status label helper
function getPaymentStatusLabel(status: PaymentStatus | number): string {
  const statusNum = typeof status === "number" ? status : Number(status);

  switch (statusNum) {
    case PaymentStatus.Succeeded:
      return "Ödendi";
    case PaymentStatus.Pending:
      return "Beklemede";
    case PaymentStatus.Processing:
      return "İşleniyor";
    case PaymentStatus.Failed:
      return "Başarısız";
    case PaymentStatus.RequiresAction:
      return "İşlem Bekliyor";
    case PaymentStatus.Canceled:
      return "İptal";
    default:
      return `Bilinmeyen (${statusNum})`;
  }
}

// Payment status style helper
function getPaymentStatusStyles(status: PaymentStatus | number) {
  const statusNum = typeof status === "number" ? status : Number(status);

  switch (statusNum) {
    case PaymentStatus.Succeeded:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400",
      };
    case PaymentStatus.Pending:
      return {
        bg: "bg-neutral-700/40",
        text: "text-neutral-300",
        border: "border-neutral-600/40",
        dot: "bg-neutral-400",
      };
    case PaymentStatus.Processing:
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-300",
        border: "border-blue-500/20",
        dot: "bg-blue-400",
      };
    case PaymentStatus.RequiresAction:
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-300",
        border: "border-orange-500/20",
        dot: "bg-orange-400",
      };
    case PaymentStatus.Failed:
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/20",
        dot: "bg-red-400",
      };
    case PaymentStatus.Canceled:
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-300",
        border: "border-purple-500/20",
        dot: "bg-purple-400",
      };
    default:
      return {
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        border: "border-neutral-700/50",
        dot: "bg-neutral-500",
      };
  }
}

// Currency format
function formatCurrency(amount: number | null | undefined, currency: CurrencyCode | number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "-";
  }
  const currencyNum = typeof currency === 'number' ? currency : (currency ? Number(currency) : CurrencyCode.TRY);
  const currencySymbol = 
    currencyNum === CurrencyCode.TRY ? "₺" : 
    currencyNum === CurrencyCode.USD ? "$" : 
    currencyNum === CurrencyCode.EUR ? "€" : 
    currencyNum === CurrencyCode.GBP ? "£" : "";
  return `${currencySymbol}${Number(amount).toFixed(2)}`;
}

// Date format
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("tr-TR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "-";
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return "-";

  const now = new Date();
  const diffSeconds = Math.round((target.getTime() - now.getTime()) / 1000);

  const formatter = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return formatter.format(diffSeconds, "second");
  }
  if (absSeconds < 3600) {
    return formatter.format(Math.round(diffSeconds / 60), "minute");
  }
  if (absSeconds < 86400) {
    return formatter.format(Math.round(diffSeconds / 3600), "hour");
  }
  if (absSeconds < 604800) {
    return formatter.format(Math.round(diffSeconds / 86400), "day");
  }
  return formatter.format(Math.round(diffSeconds / 604800), "week");
}

type RetryIndicatorVariant = "none" | "overdue" | "soon" | "scheduled";

function getNextRetryIndicator(nextRetryAt: string | null): { variant: RetryIndicatorVariant; label: string | null; date: Date | null } {
  if (!nextRetryAt) {
    return { variant: "none", label: null, date: null };
  }

  const retryDate = new Date(nextRetryAt);
  if (Number.isNaN(retryDate.getTime())) {
    return { variant: "none", label: null, date: null };
  }

  const now = new Date();
  if (retryDate < now) {
    return { variant: "overdue", label: formatRelativeTime(nextRetryAt), date: retryDate };
  }

  const diffHours = (retryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (diffHours <= 24) {
    return { variant: "soon", label: formatRelativeTime(nextRetryAt), date: retryDate };
  }

  return { variant: "scheduled", label: formatRelativeTime(nextRetryAt), date: retryDate };
}

// Invoice görüntüleme modalı
function InvoiceViewModal({ 
  invoice, 
  invoiceLines, 
  app, 
  user, 
  loadingLines,
  onClose,
  onInvoiceUpdated
}: { 
  invoice: InvoiceDto; 
  invoiceLines: InvoiceLineDto[];
  app: AppDto | undefined;
  user: UserDto | undefined;
  loadingLines: boolean;
  onClose: () => void;
  onInvoiceUpdated: (invoice: InvoiceDto) => void;
}) {
  const [attempts, setAttempts] = useState<InvoicePaymentAttemptDto[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | "retry" | "force-retry" | "cancel">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadAttempts = useCallback(async () => {
    setLoadingAttempts(true);
    try {
      const data = await getInvoicePaymentAttempts(invoice.id);
      setAttempts(data);
    } catch (error) {
      console.error("Ödeme denemeleri yüklenemedi:", error);
      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  const handleRetry = useCallback(async (force = false) => {
    setActionLoading(force ? "force-retry" : "retry");
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await retryInvoicePayment(invoice.id, force);
      onInvoiceUpdated(updated);
      setActionSuccess(force ? "Ödeme yeniden denemesi zorlandı." : "Ödeme yeniden deneme kuyruğa alındı.");
      await loadAttempts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ödeme yeniden denemesi başarısız oldu.";
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  }, [invoice.id, onInvoiceUpdated, loadAttempts]);

  const handleCancel = useCallback(async () => {
    const reason = window.prompt("İptal gerekçesi (opsiyonel):", "");
    setActionLoading("cancel");
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await cancelInvoicePayment(invoice.id, reason ?? undefined);
      onInvoiceUpdated(updated);
      setActionSuccess("Ödeme manuel olarak iptal edildi.");
      await loadAttempts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ödeme iptal edilirken hata oluştu.";
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  }, [invoice.id, onInvoiceUpdated, loadAttempts]);

  useEffect(() => {
    setActionError(null);
    setActionSuccess(null);
  }, [invoice.id]);

  const paymentStatusStyles = getPaymentStatusStyles(invoice.paymentStatus);
  const paymentStatusLabel = getPaymentStatusLabel(invoice.paymentStatus);
  const retryIndicator = getNextRetryIndicator(invoice.nextRetryAt);
  const canRetry = [PaymentStatus.Failed, PaymentStatus.Pending, PaymentStatus.RequiresAction, PaymentStatus.Processing].includes(invoice.paymentStatus);
  const canCancel = ![PaymentStatus.Succeeded, PaymentStatus.Canceled].includes(invoice.paymentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={cn(
        "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
        "max-w-4xl w-full max-h-[90vh] overflow-hidden",
        "flex flex-col"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Fatura #{invoice.autoID}
            </h2>
            <p className="text-sm text-neutral-400">
              {formatDateTime(invoice.createdDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-neutral-800/70",
              "border border-neutral-700/50",
              "text-neutral-400 hover:text-white",
              "transition-all"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingLines ? (
            <div className="text-center py-8">
              <div className="text-sm text-neutral-400">Yükleniyor...</div>
            </div>
          ) : (
            <>
          {(invoice.requiresAction || retryIndicator.variant === "overdue" || retryIndicator.variant === "soon") && (
            <div className={cn(
              "rounded-xl border px-4 py-3 flex items-start gap-3",
              invoice.requiresAction
                ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                : retryIndicator.variant === "overdue"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
            )}>
              <AlertTriangle className="w-5 h-5 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  {invoice.requiresAction ? "Ödeme sağlayıcı ek aksiyon bekliyor." : retryIndicator.variant === "overdue" ? "Planlanan yeniden deneme tarihi geçti." : "Yaklaşan yeniden deneme."}
                </div>
                <div className="text-xs opacity-80">
                  {invoice.requiresAction && "Kullanıcıdan ek doğrulama, 3DS veya manuel müdahale gerekli olabilir."}
                  {retryIndicator.label && !invoice.requiresAction && (
                    <span> Planlanan tarih {retryIndicator.label}.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Kullanıcı</div>
                <div className="flex items-center gap-2 text-white">
                  <User className="w-4 h-4" />
                  <span>{user?.email || user?.userName || "Bilinmiyor"}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-1">Uygulama</div>
                <div className="flex items-center gap-2 text-white">
                  <Building2 className="w-4 h-4" />
                  <span>{app?.name || "Bilinmiyor"} ({app?.code || "-"})</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-neutral-400 mb-1">Dönem</div>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-1">Ödeme Durumu</div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                    paymentStatusStyles.bg,
                    paymentStatusStyles.text,
                    paymentStatusStyles.border
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", paymentStatusStyles.dot)} />
                  {paymentStatusLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-400 mb-1">Ödeme Sağlayıcı</div>
              <div className="text-sm text-white">{invoice.paymentProvider || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Ödeme Referansı</div>
              <div className="font-mono text-sm text-white">{invoice.paymentReference || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Ödendi</div>
              <div className="text-sm text-white">{formatDateTime(invoice.paidAt)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Son Başarısızlık</div>
              <div className="text-sm text-white">{formatDateTime(invoice.failedAt)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Son Deneme</div>
              <div className="text-sm text-white">{formatDateTime(invoice.lastAttemptAt)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 mb-1">Sonraki Deneme</div>
              <div className="text-sm text-white">{formatDateTime(invoice.nextRetryAt)}</div>
              {retryIndicator.variant !== "none" && retryIndicator.label && (
                <div className={cn(
                  "mt-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
                  retryIndicator.variant === "overdue"
                    ? "border-red-500/40 text-red-300 bg-red-500/10"
                    : retryIndicator.variant === "soon"
                      ? "border-yellow-500/40 text-yellow-200 bg-yellow-500/10"
                      : "border-blue-500/30 text-blue-200 bg-blue-500/10"
                )}>
                  <Clock3 className="w-3 h-3" />
                  {retryIndicator.label}
                </div>
              )}
            </div>
          </div>

          {/* Payment attempts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Ödeme Denemeleri</h3>
              <button
                onClick={() => void loadAttempts()}
                className={cn(
                  "text-xs px-2 py-1 rounded-lg border transition-colors",
                  "border-neutral-700/50 text-neutral-300 hover:text-white hover:border-neutral-500/60"
                )}
                disabled={loadingAttempts}
              >
                Güncelle
              </button>
            </div>
            <div className="border border-neutral-800 rounded-lg overflow-hidden">
              {loadingAttempts ? (
                <div className="text-center py-6 text-sm text-neutral-400">Ödeme denemeleri yükleniyor...</div>
              ) : attempts.length === 0 ? (
                <div className="text-center py-6 text-sm text-neutral-400">Kayıtlı ödeme denemesi yok.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-neutral-800/60 text-neutral-300 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Tarih</th>
                      <th className="px-4 py-3 text-left font-medium">Durum</th>
                      <th className="px-4 py-3 text-left font-medium">Referans</th>
                      <th className="px-4 py-3 text-left font-medium">Mesaj</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {attempts.map(attempt => {
                      const attemptStyles = getPaymentStatusStyles(attempt.resultStatus);
                      const attemptLabel = getPaymentStatusLabel(attempt.resultStatus);
                      return (
                        <tr key={attempt.id} className="hover:bg-neutral-800/30">
                          <td className="px-4 py-3 text-neutral-200">
                            <div className="flex flex-col">
                              <span>{formatDateTime(attempt.attemptedAt)}</span>
                              <span className="text-xs text-neutral-500">{formatRelativeTime(attempt.attemptedAt)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                                attemptStyles.bg,
                                attemptStyles.text,
                                attemptStyles.border
                              )}
                            >
                              <span className={cn("w-1.5 h-1.5 rounded-full", attemptStyles.dot)} />
                              {attemptLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-300">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs break-all">{attempt.providerReference || "-"}</span>
                              <span className="text-[10px] uppercase text-neutral-500">{attempt.paymentProvider || "-"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-neutral-300">
                            {attempt.providerResponseMessage || attempt.providerResponseCode || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Invoice Lines */}
          {invoiceLines.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Fatura Kalemleri</h3>
              <div className="border border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400">Açıklama</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">Miktar</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">Birim Fiyat</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-400">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {invoiceLines.map((line) => (
                      <tr key={line.id} className="hover:bg-neutral-800/30">
                        <td className="px-4 py-3 text-sm text-white">{line.description || "-"}</td>
                        <td className="px-4 py-3 text-sm text-neutral-300 text-right">{line.quantity}</td>
                        <td className="px-4 py-3 text-sm text-neutral-300 text-right">
                          {formatCurrency(line.unitPrice, invoice.currency)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-white text-right">
                          {formatCurrency(line.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-neutral-800 pt-4">
            <div className="flex justify-end">
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Ara Toplam:</span>
                  <span className="text-white">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">KDV:</span>
                  <span className="text-white">{formatCurrency(invoice.tax, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-800">
                  <span className="text-white">Toplam:</span>
                  <span className="text-white">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {invoice.paymentReference && (
            <div>
              <span className="text-xs text-neutral-400">Ödeme Referansı</span>
              <div className="font-mono text-sm text-white">{invoice.paymentReference}</div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800">
          <div className="flex-1">
            {actionError && (
              <div className="text-xs text-red-400">{actionError}</div>
            )}
            {actionSuccess && (
              <div className="text-xs text-emerald-400">{actionSuccess}</div>
            )}
          </div>
          {canCancel && (
            <button
              onClick={() => void handleCancel()}
              disabled={actionLoading !== null}
              className={cn(
                "px-4 py-2 rounded-lg border transition-all flex items-center gap-2",
                "border-red-500/40 text-red-300 hover:text-white hover:bg-red-500/20",
                actionLoading === "cancel" && "opacity-70 cursor-not-allowed"
              )}
            >
              <Ban className="w-4 h-4" />
              İptal Et
            </button>
          )}
          {canRetry && (
            <>
              <button
                onClick={() => void handleRetry(false)}
                disabled={actionLoading !== null}
                className={cn(
                  "px-4 py-2 rounded-lg border transition-all flex items-center gap-2",
                  "border-blue-500/40 text-blue-300 hover:text-white hover:bg-blue-500/20",
                  actionLoading === "retry" && "opacity-70 cursor-not-allowed"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                Tekrar Dene
              </button>
              <button
                onClick={() => void handleRetry(true)}
                disabled={actionLoading !== null}
                className={cn(
                  "px-3 py-2 rounded-lg border transition-all text-xs font-medium",
                  "border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-500/20",
                  actionLoading === "force-retry" && "opacity-70 cursor-not-allowed"
                )}
              >
                Zorla
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className={cn(
              "px-4 py-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-neutral-800/70",
              "border border-neutral-700/50",
              "text-neutral-300 hover:text-white",
              "transition-all"
            )}
          >
            Kapat
          </button>
          <button
            onClick={() => {
              // PDF indirme fonksiyonu
              window.print();
            }}
            className={cn(
              "px-4 py-2 rounded-lg",
              "bg-gradient-to-r from-blue-500 to-purple-600",
              "hover:from-blue-600 hover:to-purple-700",
              "text-white font-medium",
              "transition-all",
              "flex items-center gap-2"
            )}
          >
            <Download className="w-4 h-4" />
            İndir
          </button>
        </div>
      </div>
    </div>
  );
}

// User Group Component - Kullanıcıya göre gruplu gösterim
function UserInvoiceGroup({
  user,
  invoices,
  apps,
  onInvoiceUpdated,
}: {
  user: UserDto;
  invoices: InvoiceDto[];
  apps: AppDto[];
  onInvoiceUpdated: (invoice: InvoiceDto) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineDto[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const selectedInvoiceId = selectedInvoice?.id;

  useEffect(() => {
    if (!selectedInvoiceId) return;
    const refreshed = invoices.find((inv) => inv.id === selectedInvoiceId);
    if (refreshed) {
      setSelectedInvoice(refreshed);
    }
  }, [invoices, selectedInvoiceId]);

  // Faturaları uygulamalara göre grupla
  const invoicesByApp = invoices.reduce((acc, invoice) => {
    const appId = invoice.appId;
    if (!acc[appId]) {
      acc[appId] = [];
    }
    acc[appId].push(invoice);
    return acc;
  }, {} as Record<string, InvoiceDto[]>);

  const handleViewInvoice = async (invoice: InvoiceDto) => {
    setSelectedInvoice(invoice);
    setLoadingLines(true);
    try {
      const lines = await getInvoiceLines(invoice.id);
      setInvoiceLines(lines);
    } catch (error) {
      console.error("Fatura kalemleri yüklenemedi:", error);
      setInvoiceLines([]);
    } finally {
      setLoadingLines(false);
    }
  };

  const handleDownloadInvoice = (invoice: InvoiceDto) => {
    // PDF indirme için - şimdilik print dialog açıyoruz
    // Gerçek uygulamada API'den PDF indirilebilir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fatura #${invoice.autoID}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .info { margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { text-align: right; font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Fatura #${invoice.autoID}</h1>
              <p>Oluşturulma Tarihi: ${formatDateTime(invoice.createdDate)}</p>
            </div>
            <div class="info">
              <p><strong>Dönem:</strong> ${formatDate(invoice.periodStart)} - ${formatDate(invoice.periodEnd)}</p>
              <p><strong>Toplam:</strong> ${formatCurrency(invoice.total, invoice.currency)}</p>
            </div>
            <div class="total">
              <p>Toplam: ${formatCurrency(invoice.total, invoice.currency)}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={cn(
      components.card,
      "p-5 sm:p-6",
      "space-y-4"
    )}>
      {/* User Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full",
            "bg-gradient-to-br from-blue-500 to-purple-600",
            "flex items-center justify-center",
            "text-white font-bold text-lg"
          )}>
            {user.userName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h3 className={cn("text-lg font-bold", text.primary)}>
              {user.userName || user.email}
            </h3>
            <p className={cn("text-sm", text.muted)}>
              {user.email}
              {user.userName && ` • ${user.userName}`}
            </p>
            <p className={cn("text-xs mt-1", text.muted)}>
              {invoices.length} {invoices.length === 1 ? "fatura" : "fatura"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "p-2 rounded-lg",
            "bg-neutral-800/50 hover:bg-neutral-800/70",
            "border border-neutral-700/50",
            "text-neutral-400 hover:text-white",
            "transition-all"
          )}
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Invoices by App */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-neutral-800/50">
          {Object.entries(invoicesByApp).map(([appIdKey, appInvoices]) => {
            const app = apps.find(a => a.id === appIdKey);
            const totalAmount = appInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
            const currency = appInvoices[0]?.currency || CurrencyCode.TRY;

            return (
              <div key={appIdKey} className={cn(
                "rounded-lg border p-4",
                "bg-neutral-800/30",
                "border-neutral-700/30"
              )}>
                {/* App Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className={cn("font-semibold", text.secondary)}>
                      {app?.name || "Bilinmeyen Uygulama"}
                    </span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-md bg-neutral-700/50 text-neutral-300")}>
                      {app?.code || "-"}
                    </span>
                  </div>
                  <div className={cn("text-sm font-bold", text.primary)}>
                    {formatCurrency(totalAmount, currency)}
                  </div>
                </div>

                {/* Invoices List */}
                <div className="space-y-2">
                  {appInvoices.map((invoice) => {
                    const retryIndicator = getNextRetryIndicator(invoice.nextRetryAt);
                    const borderline = invoice.requiresAction
                      ? "border-orange-500/50"
                      : retryIndicator.variant === "overdue"
                        ? "border-red-500/40"
                        : retryIndicator.variant === "soon"
                          ? "border-yellow-500/40"
                          : "border-neutral-700/30";
                    const backgroundAccent = invoice.requiresAction
                      ? "bg-orange-500/5"
                      : retryIndicator.variant === "overdue"
                        ? "bg-red-500/5"
                        : retryIndicator.variant === "soon"
                          ? "bg-yellow-500/5"
                          : "bg-neutral-900/50";
                    const statusStyles = getPaymentStatusStyles(invoice.paymentStatus);
                    const statusLabel = getPaymentStatusLabel(invoice.paymentStatus);
                    
                    return (
                      <div
                        key={invoice.id}
                        className={cn(
                          "rounded-lg border p-3",
                          backgroundAccent,
                          borderline,
                          "hover:border-blue-500/30",
                          "transition-all"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-neutral-400" />
                              <span className={cn("font-medium", text.secondary)}>
                                Fatura #{invoice.autoID}
                              </span>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                                  statusStyles.bg,
                                  statusStyles.text,
                                  statusStyles.border
                                )}
                              >
                                <span className={cn("w-1.5 h-1.5 rounded-full", statusStyles.dot)} />
                                {statusLabel}
                              </span>
                            </div>
                            {(invoice.requiresAction || retryIndicator.variant !== "none") && (
                              <div className="flex items-center gap-2 text-xs text-neutral-400">
                                <AlertTriangle className={cn(
                                  "w-3.5 h-3.5",
                                  invoice.requiresAction
                                    ? "text-orange-300"
                                    : retryIndicator.variant === "overdue"
                                      ? "text-red-300"
                                      : "text-yellow-300"
                                )} />
                                <span>
                                  {invoice.requiresAction
                                    ? "Ödeme sağlayıcı ek aksiyon istiyor."
                                    : retryIndicator.variant === "overdue"
                                      ? `Yeniden deneme gecikti (${retryIndicator.label}).`
                                      : retryIndicator.variant === "soon"
                                        ? `Yeniden deneme yaklaşıyor (${retryIndicator.label}).`
                                        : retryIndicator.label}
                                </span>
                              </div>
                            )}
                            <div className={cn("text-xs space-x-3", text.muted)}>
                              <span>{formatDate(invoice.createdDate)}</span>
                              <span>•</span>
                              <span>{formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className={cn(
                                "p-2 rounded-lg",
                                "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                "hover:bg-blue-500/20 transition-all",
                                "flex items-center gap-1.5"
                              )}
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <div className={cn("text-right")}>
                              <div className={cn("text-sm font-bold", text.primary)}>
                                {formatCurrency(invoice.total, invoice.currency)}
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className={cn(
                                "p-2 rounded-lg",
                                "bg-neutral-800/50 hover:bg-blue-500/20",
                                "border border-neutral-700/50 hover:border-blue-500/30",
                                "text-neutral-400 hover:text-blue-400",
                                "transition-all"
                              )}
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(invoice)}
                              className={cn(
                                "p-2 rounded-lg",
                                "bg-neutral-800/50 hover:bg-emerald-500/20",
                                "border border-neutral-700/50 hover:border-emerald-500/30",
                                "text-neutral-400 hover:text-emerald-400",
                                "transition-all"
                              )}
                              title="İndir"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice View Modal */}
      {selectedInvoice && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          invoiceLines={invoiceLines}
          app={apps.find(a => a.id === selectedInvoice.appId)}
          user={user}
          loadingLines={loadingLines}
          onClose={() => {
            setSelectedInvoice(null);
            setInvoiceLines([]);
          }}
          onInvoiceUpdated={(updated) => {
            onInvoiceUpdated(updated);
            setSelectedInvoice(updated);
          }}
        />
      )}
    </div>
  );
}

export default function InvoicesListClient({ 
  invoices, 
  apps, 
  users,
  pagination 
}: { 
  invoices: InvoiceDto[]; 
  apps: AppDto[]; 
  users: UserDto[];
  pagination: PaginationInfo;
}) {
  const [invoiceState, setInvoiceState] = useState(invoices);

  useEffect(() => {
    setInvoiceState(invoices);
  }, [invoices]);

  const handleInvoiceUpdated = useCallback((updated: InvoiceDto) => {
    setInvoiceState((prev) => {
      const index = prev.findIndex((inv) => inv.id === updated.id);
      if (index === -1) return prev;
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }, []);

  const invoicesByUser = useMemo(() => {
    return invoiceState.reduce((acc, invoice) => {
      const userId = invoice.userId;
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(invoice);
      return acc;
    }, {} as Record<string, InvoiceDto[]>);
  }, [invoiceState]);

  if (invoiceState.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 sm:py-16 px-4",
        bg.card,
        "border",
        "rounded-2xl"
      )}>
        <div className="max-w-md mx-auto">
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            bg.button
          )}>
            <FileText className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            Henüz fatura yok
          </h3>
          <p className={cn("text-sm mb-6", text.muted)}>
            İlk faturanızı oluşturmak için yukarıdaki butona tıklayın
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(invoicesByUser).map(([userIdKey, userInvoices]) => {
        const user = users.find(u => u.userId === userIdKey);
        if (!user) return null;
        
        return (
          <UserInvoiceGroup
            key={userIdKey}
            user={user}
            invoices={userInvoices}
            apps={apps}
            onInvoiceUpdated={handleInvoiceUpdated}
          />
        );
      })}

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

export function InvoicesWrapper({
  invoices,
  apps,
  users,
  pagination,
}: {
  invoices: InvoiceDto[];
  apps: AppDto[];
  users: UserDto[];
  pagination: PaginationInfo;
}) {
  return (
    <>
      <InvoicesListClient invoices={invoices} apps={apps} users={users} pagination={pagination} />
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
    </>
  );
}

