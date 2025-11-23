"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { components, text, transition } from "@/lib/theme";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const updatePage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;

      const params = new URLSearchParams(sp.toString());
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });

      if (onPageChange) {
        onPageChange(page);
      }
    },
    [router, pathname, sp, totalPages, onPageChange]
  );

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className={cn("text-sm", text.muted)}>
        <span className={cn("font-medium", text.secondary)}>{startItem}</span> -{" "}
        <span className={cn("font-medium", text.secondary)}>{endItem}</span> /{" "}
        <span className={cn("font-medium", text.secondary)}>{totalItems}</span> kayıt
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => updatePage(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            components.buttonSecondary,
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-xs sm:text-sm"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Önceki</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => {
            if (pageNum === "...") {
              return (
                <span key={`ellipsis-${index}`} className={cn("px-2", text.disabled)}>
                  ...
                </span>
              );
            }

            const page = pageNum as number;
            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => updatePage(page)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-sm min-w-[40px] font-medium",
                  transition.default,
                  isActive
                    ? components.buttonPrimary
                    : cn(
                        components.buttonSecondary,
                        "hover:" + text.primary
                      )
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => updatePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            components.buttonSecondary,
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-xs sm:text-sm"
          )}
        >
          <span className="hidden sm:inline">Sonraki</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
