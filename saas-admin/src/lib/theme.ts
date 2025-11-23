/**
 * Global Tema Sistemi
 * Tüm stil sabitleri burada tanımlanır - tek yerden yönetim
 */

// Z-Index Katmanları (katmanlı yapı)
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  sidebar: 40,
  topbar: 50,
  overlay: 60,
  modal: 70,
  popover: 80,
  tooltip: 90,
  notification: 100,
} as const;

// Spacing (Tutarlı boşluklar)
export const spacing = {
  xs: "0.5rem",    // 8px
  sm: "0.75rem",   // 12px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "2.5rem", // 40px
  "3xl": "3rem",   // 48px
} as const;

// Background Colors (Saydamlık efektleri ile)
export const bg = {
  base: "bg-neutral-950",
  surface: "bg-neutral-900",
  surfaceElevated: "bg-neutral-900/80",
  card: "bg-neutral-900/60",
  cardHover: "bg-neutral-900/80",
  input: "bg-neutral-900/50",
  button: "bg-neutral-800/50",
  buttonHover: "bg-neutral-800",
  overlay: "bg-black/60",
  primary: "bg-gradient-to-r from-blue-500 to-purple-600",
  primaryHover: "hover:from-blue-600 hover:to-purple-700",
} as const;

// Border Colors
export const border = {
  default: "border-neutral-800/50",
  hover: "hover:border-neutral-700/50",
  focus: "focus:border-blue-500/30",
  active: "border-blue-500/20",
} as const;

// Text Colors
export const text = {
  primary: "text-white",
  secondary: "text-neutral-200",
  tertiary: "text-neutral-300",
  muted: "text-neutral-400",
  disabled: "text-neutral-500",
} as const;

// Shadows (Derinlik hissi)
export const shadow = {
  sm: "shadow-sm shadow-black/10",
  md: "shadow-lg shadow-black/20",
  lg: "shadow-xl shadow-black/20",
  xl: "shadow-2xl shadow-black/20",
  primary: "shadow-lg shadow-blue-500/20",
} as const;

// Blur Effects (Saydamlık)
export const blur = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
} as const;

// Border Radius
export const radius = {
  sm: "rounded-lg",    // 8px
  md: "rounded-xl",    // 12px
  lg: "rounded-2xl",   // 16px
  full: "rounded-full",
} as const;

// Transitions
export const transition = {
  fast: "transition-all duration-150",
  default: "transition-all duration-200",
  slow: "transition-all duration-300",
} as const;

// Layout Constants
export const layout = {
  sidebarWidth: "w-64",
  sidebarWidthDesktop: "lg:pl-64",
  topbarHeight: "h-14",
  contentPadding: "p-6 lg:p-8",
  contentMaxWidth: "max-w-7xl mx-auto",
} as const;

// Component Presets (Hazır stil kombinasyonları)
export const components = {
  // Glassmorphism Card
  card: [
    bg.card,
    blur.md,
    border.default,
    radius.lg,
    shadow.md,
    transition.default,
    "hover:" + border.hover.split(" ")[0],
    "hover:" + shadow.lg.split(" ")[0],
  ].join(" "),
  
  // Primary Button
  buttonPrimary: [
    "inline-flex items-center justify-center gap-2",
    "px-4 py-2.5",
    radius.md,
    bg.primary,
    "text-white text-sm font-medium",
    shadow.primary,
    transition.default,
    bg.primaryHover,
  ].join(" "),
  
  // Secondary Button
  buttonSecondary: [
    "inline-flex items-center justify-center gap-2",
    "px-4 py-2.5",
    radius.md,
    bg.button,
    text.tertiary,
    border.default,
    "border",
    transition.default,
    bg.buttonHover,
    "hover:" + text.secondary,
  ].join(" "),
  
  // Input Field
  input: [
    "w-full",
    "px-4 py-2.5",
    radius.md,
    bg.input,
    border.default,
    "border",
    text.secondary,
    "placeholder:" + text.disabled,
    "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
    border.focus,
    transition.default,
  ].join(" "),
} as const;

// Helper function for combining classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

