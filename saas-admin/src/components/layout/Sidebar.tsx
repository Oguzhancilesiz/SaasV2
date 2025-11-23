"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { zIndex, bg, border, text, shadow, blur, transition } from "@/lib/theme";
import {
  LayoutDashboard,
  AppWindow,
  Users,
  Settings,
  ReceiptText,
  ShoppingCart,
  KeyRound,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Zap,
  Webhook,
  FileText,
  Package,
  UserPlus,
  Shield,
  Activity,
  Send,
  Inbox,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavCategory = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
};

const navCategories: NavCategory[] = [
  {
    label: "Genel",
    icon: LayoutDashboard,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
    defaultOpen: true,
  },
  {
    label: "Uygulama Yönetimi",
    icon: Package,
    items: [
      { href: "/apps", label: "Uygulamalar", icon: AppWindow },
      { href: "/plans", label: "Planlar", icon: ReceiptText },
      { href: "/features", label: "Özellikler", icon: Zap },
    ],
    defaultOpen: true,
  },
  {
    label: "Abonelik ve Ödeme",
    icon: ShoppingCart,
    items: [
      { href: "/subscriptions", label: "Abonelikler", icon: ShoppingCart },
      { href: "/invoices", label: "Faturalar", icon: FileText },
      { href: "/usage-records", label: "Kullanım Kayıtları", icon: Activity },
    ],
    defaultOpen: true,
  },
  {
    label: "Kullanıcı Yönetimi",
    icon: Users,
    items: [
      { href: "/users", label: "Kullanıcılar", icon: Users },
      { href: "/app-user-registrations", label: "Kullanıcı Kayıtları", icon: UserPlus },
      { href: "/roles", label: "Roller", icon: Shield },
    ],
    defaultOpen: true,
  },
  {
    label: "Entegrasyonlar",
    icon: KeyRound,
    items: [
      { href: "/apikeys", label: "API Anahtarları", icon: KeyRound },
      { href: "/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/webhook-deliveries", label: "Webhook Teslimatları", icon: Send },
    ],
    defaultOpen: true,
  },
  {
    label: "Sistem",
    icon: Settings,
    items: [
      { href: "/settings", label: "Ayarlar", icon: Settings },
      { href: "/outbox", label: "Outbox", icon: Inbox },
      { href: "/activity-logs", label: "Aktivite Logları", icon: Activity },
    ],
    defaultOpen: false,
  },
];

function NavCategoryComponent({
  category,
  pathname,
  onClose,
}: {
  category: NavCategory;
  pathname: string | null;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(category.defaultOpen ?? true);
  const hasActive = category.items.some((item) => pathname?.startsWith(item.href));
  const CategoryIcon = category.icon;

  return (
    <div className="space-y-1">
      {/* Category Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold",
          transition.default,
          hasActive
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50"
        )}
      >
        <div className="flex items-center gap-2">
          <CategoryIcon className="w-4 h-4" />
          <span>{category.label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Category Items */}
      {isOpen && (
        <div className="ml-4 space-y-1 pl-3 border-l border-neutral-800/50">
          {category.items.map((item) => {
            const active = pathname?.startsWith(item.href);
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                  transition.default,
                  active
                    ? cn(
                        "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white",
                        "border border-blue-500/30",
                        shadow.sm
                      )
                    : cn(
                        text.tertiary,
                        "hover:bg-neutral-800/60 hover:text-white hover:border-neutral-700/50",
                        "border border-transparent"
                      )
                )}
                onClick={onClose}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                    transition.default,
                    active
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-neutral-800/40 text-neutral-400 group-hover:bg-neutral-700/50 group-hover:text-neutral-300"
                  )}
                >
                  <ItemIcon className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 lg:hidden transition-opacity duration-300",
          bg.overlay,
          blur.md,
          open ? "opacity-100 z-[60]" : "pointer-events-none opacity-0 z-0"
        )}
        style={{ zIndex: open ? zIndex.overlay : 0 }}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64",
          bg.surface,
          border.default,
          "border-r",
          "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          shadow.xl,
          blur.md,
          open ? "translate-x-0" : "-translate-x-full",
          "overflow-y-auto"
        )}
        style={{ zIndex: zIndex.sidebar }}
      >
        {/* Logo/Brand */}
        <div
          className={cn(
            "h-16 px-5 flex items-center border-b",
            border.default,
            "bg-gradient-to-r from-blue-500/10 to-purple-600/10"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl",
                "bg-gradient-to-br from-blue-500 to-purple-600",
                "flex items-center justify-center",
                shadow.primary,
                "ring-2 ring-blue-500/20"
              )}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white">SaaS Admin</span>
              <span className="text-[10px] text-neutral-400">Management Panel</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-2 mt-2">
          {navCategories.map((category) => (
            <NavCategoryComponent
              key={category.label}
              category={category}
              pathname={pathname}
              onClose={onClose}
            />
          ))}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "mt-auto p-4 border-t",
            border.default,
            "bg-neutral-900/50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-xs font-medium", text.disabled)}>Version</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              )}
            >
              v0.1
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className={cn("text-xs", text.muted)}>Sistem Aktif</span>
          </div>
        </div>
      </aside>
    </>
  );
}
