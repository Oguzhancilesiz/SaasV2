"use client";

import { Menu, Sun, Moon, Search, User, X, AppWindow, Loader2, ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { globalSearch, type SearchResult } from "@/lib/searchService";
import { zIndex, bg, border, text, blur, transition } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from "@/lib/config";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AppWindow,
};

const API_BASE_URL = getApiBaseUrl();

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLFormElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showResults]);

  // Search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await globalSearch(searchQuery, 5);
        setSearchResults(response.results);
        setShowResults(response.results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // İlk sonuca git veya apps sayfasına yönlendir
      if (searchResults.length > 0) {
        router.push(searchResults[0].url);
        setShowResults(false);
        setSearchQuery("");
      } else {
        router.push(`/apps?q=${encodeURIComponent(searchQuery)}`);
        setShowResults(false);
        setSearchQuery("");
      }
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setShowResults(false);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header
      className={cn(
        "h-16 border-b",
        border.default,
        bg.surfaceElevated,
        blur.xl,
        "sticky top-0",
        "shadow-sm shadow-black/10"
      )}
      style={{ zIndex: zIndex.topbar }}
    >
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Menu button (mobile) */}
        <button
          className={cn(
            "lg:hidden p-2 rounded-lg hover:bg-neutral-800/50",
            transition.default,
            text.tertiary
          )}
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center: Global Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-2xl mx-4 lg:mx-8 relative"
          ref={dropdownRef}
        >
          <div className={cn(
            "relative group",
            searchFocused && "ring-2 ring-blue-500/20 rounded-xl"
          )}>
            <Search className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
              searchFocused ? "text-blue-400" : text.muted,
              transition.default
            )} />
            <input
              type="text"
              placeholder="Genel arama yapın... (uygulamalar, planlar, kullanıcılar)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                // Delay to allow click on results
                setTimeout(() => setSearchFocused(false), 200);
              }}
              className={cn(
                "w-full pl-11 pr-11 py-2.5 rounded-xl text-sm",
                bg.input,
                border.default,
                "border",
                text.secondary,
                "placeholder:" + text.disabled,
                "focus:outline-none",
                transition.default,
                "focus:" + border.focus.split(" ")[0]
              )}
            />
            {isSearching && (
              <Loader2 className="absolute right-11 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowResults(false);
                }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg",
                  "hover:bg-neutral-800/50",
                  transition.default,
                  text.muted
                )}
                title="Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div
              className={cn(
                "absolute top-full mt-2 w-full",
                bg.surface,
                border.default,
                "border rounded-xl",
                blur.md,
                "shadow-xl shadow-black/50",
                "max-h-[400px] overflow-y-auto",
                "z-50"
              )}
              style={{ zIndex: zIndex.popover }}
            >
              <div className="p-2">
                {searchResults.map((result) => {
                  const Icon = iconMap[result.icon || "AppWindow"] || AppWindow;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "hover:bg-neutral-800/60",
                        transition.default,
                        "text-left"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        "bg-blue-500/10 text-blue-400"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm font-medium mb-0.5", text.primary)}>
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className={cn("text-xs", text.muted)}>
                            {result.subtitle}
                          </div>
                        )}
                        <div className={cn("text-[10px] uppercase tracking-wide mt-1", text.disabled)}>
                          {result.type === "app" && "Uygulama"}
                          {result.type === "plan" && "Plan"}
                          {result.type === "user" && "Kullanıcı"}
                          {result.type === "subscription" && "Abonelik"}
                        </div>
                      </div>
                      <ArrowRight className={cn("w-4 h-4 flex-shrink-0", text.muted)} />
                    </button>
                  );
                })}
              </div>
              {searchQuery && (
                <div className={cn(
                  "border-t p-2",
                  border.default
                )}>
                  <button
                    onClick={() => {
                      router.push(`/apps?q=${encodeURIComponent(searchQuery)}`);
                      setShowResults(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
                      "hover:bg-neutral-800/60",
                      transition.default,
                      text.tertiary,
                      "text-sm"
                    )}
                  >
                    <span>Tüm sonuçları gör</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults && !isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div
              className={cn(
                "absolute top-full mt-2 w-full",
                bg.surface,
                border.default,
                "border rounded-xl",
                blur.md,
                "shadow-xl shadow-black/50",
                "p-4 text-center",
                "z-50"
              )}
              style={{ zIndex: zIndex.popover }}
            >
              <div className={cn("text-sm", text.muted)}>
                Sonuç bulunamadı
              </div>
            </div>
          )}
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationPanel />
          
          {/* Theme toggle */}
          <button
            className={cn(
              "p-2 rounded-lg hover:bg-neutral-800/50",
              transition.default,
              text.tertiary
            )}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Tema değiştir"
          >
            {mounted && theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          <button
            className={cn(
              "px-3 py-2 rounded-lg border border-neutral-700/70",
              "bg-neutral-900/60 hover:bg-neutral-800/70",
              transition.default,
              "flex items-center gap-2 text-sm",
              text.secondary,
              loggingOut && "opacity-60 cursor-not-allowed"
            )}
            onClick={handleLogout}
            disabled={loggingOut}
            title="Çıkış yap"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span>{loggingOut ? "Çıkış yapılıyor" : "Çıkış"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
