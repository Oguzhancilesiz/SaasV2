"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { components, text } from "@/lib/theme";

interface SearchableSelectProps<T> {
  options: T[];
  value: string;
  onChange: (value: string) => void;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export default function SearchableSelect<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  emptyText = "Sonuç bulunamadı",
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = options.find(item => getValue(item) === value);

  const filteredOptions = options.filter(item =>
    getLabel(item).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (item: T) => {
    onChange(getValue(item));
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ zIndex: isOpen ? 99999 : 'auto' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl",
          "bg-neutral-900/50 border border-neutral-800/50",
          "text-sm text-neutral-200 placeholder:text-neutral-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30",
          "transition-all",
          "flex items-center justify-between gap-2"
        )}
      >
        <span className={cn(value ? text.secondary : text.muted, "truncate")}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "p-0.5 rounded hover:bg-neutral-700/50",
                "text-neutral-400 hover:text-neutral-200",
                "transition-colors"
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "transform rotate-180"
          )} />
        </div>
      </button>

      {isOpen && (
        <div 
          className={cn(
            "absolute w-full mt-1",
            "bg-neutral-900 border border-neutral-800 rounded-xl",
            "shadow-lg shadow-black/20",
            "max-h-60 overflow-hidden",
            "flex flex-col"
          )}
          style={{ zIndex: 99999 }}
        >
          <div className="p-2 border-b border-neutral-800">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-neutral-800/50 border border-neutral-700/50",
                "text-sm text-neutral-200 placeholder:text-neutral-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30"
              )}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className={cn("px-4 py-3 text-sm text-center", text.muted)}>
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((item) => {
                const itemValue = getValue(item);
                const isSelected = itemValue === value;
                return (
                  <button
                    key={itemValue}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm",
                      "hover:bg-neutral-800/50 transition-colors",
                      isSelected && "bg-blue-500/10 text-blue-400",
                      !isSelected && text.secondary
                    )}
                  >
                    {getLabel(item)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

