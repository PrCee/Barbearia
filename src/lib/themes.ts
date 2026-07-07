// Sistema de temas white-label Premium (Estética Apple-like)
// Foco em minimalismo, alto contraste e respiro visual.

export type ThemeId =
  | "minimal"
  | "silver"
  | "cream"
  | "frost"
  | "noir"
  | "midnight"
  | "slate"
  | "forest";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  label: string;
  // Cores estruturais
  bg: string;
  bgGradient: string; // Para headers ou áreas de destaque hero (agora mais sutis/inexistentes)
  surface: string;
  surfaceAlt: string;
  border: string;
  borderFocus: string;
  // Ações
  primary: string;
  primaryHover: string;
  primaryText: string;
  // Texto
  text: string;
  textSecondary: string;
  textMuted: string;
  // Detalhes
  accent: string;
  accentMuted: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  // ---- LIGHT THEMES ----
  minimal: {
    id: "minimal",
    name: "Minimal",
    label: "Branco puro, design focado e absoluto",
    bg: "bg-white",
    bgGradient: "from-neutral-50 to-white",
    surface: "bg-white",
    surfaceAlt: "hover:bg-neutral-50",
    border: "border-neutral-200",
    borderFocus: "focus:ring-neutral-900",
    primary: "bg-black",
    primaryHover: "hover:bg-neutral-800",
    primaryText: "text-white",
    text: "text-black",
    textSecondary: "text-neutral-700",
    textMuted: "text-neutral-400",
    accent: "text-neutral-500",
    accentMuted: "text-neutral-200",
  },
  silver: {
    id: "silver",
    name: "Silver",
    label: "Cinza platina com detalhes em azul",
    bg: "bg-[#f5f5f7]", // Apple's default gray background
    bgGradient: "from-[#ebebf0] to-[#f5f5f7]",
    surface: "bg-white",
    surfaceAlt: "hover:bg-blue-50/50",
    border: "border-neutral-200",
    borderFocus: "focus:ring-blue-500",
    primary: "bg-[#0071e3]", // Apple blue
    primaryHover: "hover:bg-[#0077ED]",
    primaryText: "text-white",
    text: "text-[#1d1d1f]",
    textSecondary: "text-[#515154]",
    textMuted: "text-[#86868b]",
    accent: "text-[#0071e3]",
    accentMuted: "text-blue-100",
  },
  cream: {
    id: "cream",
    name: "Cream",
    label: "Off-white quente e aconchegante",
    bg: "bg-[#faf9f6]",
    bgGradient: "from-[#f4f2ea] to-[#faf9f6]",
    surface: "bg-white",
    surfaceAlt: "hover:bg-amber-50/30",
    border: "border-stone-200",
    borderFocus: "focus:ring-stone-600",
    primary: "bg-[#3e2723]",
    primaryHover: "hover:bg-[#4e342e]",
    primaryText: "text-[#fff8e1]",
    text: "text-[#2e1d16]",
    textSecondary: "text-[#5d4037]",
    textMuted: "text-[#a1887f]",
    accent: "text-[#8d6e63]",
    accentMuted: "text-stone-200",
  },
  frost: {
    id: "frost",
    name: "Frost",
    label: "Claro, limpo, detalhes gélidos",
    bg: "bg-[#f8fcfd]",
    bgGradient: "from-[#eef8fb] to-[#f8fcfd]",
    surface: "bg-white",
    surfaceAlt: "hover:bg-cyan-50/50",
    border: "border-slate-200",
    borderFocus: "focus:ring-cyan-500",
    primary: "bg-[#082f49]",
    primaryHover: "hover:bg-[#0c4a6e]",
    primaryText: "text-white",
    text: "text-[#0f172a]",
    textSecondary: "text-[#334155]",
    textMuted: "text-[#94a3b8]",
    accent: "text-[#0ea5e9]",
    accentMuted: "text-slate-200",
  },

  // ---- DARK THEMES ----
  noir: {
    id: "noir",
    name: "Noir",
    label: "Preto absoluto (OLED), alto contraste",
    bg: "bg-black",
    bgGradient: "from-neutral-900 to-black",
    surface: "bg-[#1c1c1e]", // Apple dark mode surface
    surfaceAlt: "hover:bg-[#2c2c2e]",
    border: "border-[#38383a]",
    borderFocus: "focus:ring-white",
    primary: "bg-white",
    primaryHover: "hover:bg-neutral-200",
    primaryText: "text-black",
    text: "text-[#f5f5f7]",
    textSecondary: "text-[#ebebf0]",
    textMuted: "text-[#86868b]",
    accent: "text-neutral-400",
    accentMuted: "text-neutral-800",
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    label: "Azul escuro Apple, elegância noturna",
    bg: "bg-[#000000]",
    bgGradient: "from-[#0a0a14] to-[#000000]",
    surface: "bg-[#15151e]",
    surfaceAlt: "hover:bg-[#20202e]",
    border: "border-[#2b2b3d]",
    borderFocus: "focus:ring-indigo-500",
    primary: "bg-[#5e5ce6]", // iOS Indigo
    primaryHover: "hover:bg-[#6c6ae8]",
    primaryText: "text-white",
    text: "text-white",
    textSecondary: "text-indigo-100",
    textMuted: "text-indigo-200/50",
    accent: "text-indigo-400",
    accentMuted: "text-indigo-900/50",
  },
  slate: {
    id: "slate",
    name: "Slate",
    label: "Cinza titânio, minimalismo urbano",
    bg: "bg-[#09090b]",
    bgGradient: "from-[#18181b] to-[#09090b]",
    surface: "bg-[#18181b]",
    surfaceAlt: "hover:bg-[#27272a]",
    border: "border-[#27272a]",
    borderFocus: "focus:ring-zinc-500",
    primary: "bg-zinc-100",
    primaryHover: "hover:bg-white",
    primaryText: "text-zinc-900",
    text: "text-zinc-100",
    textSecondary: "text-zinc-400",
    textMuted: "text-zinc-600",
    accent: "text-zinc-400",
    accentMuted: "text-zinc-800",
  },
  forest: {
    id: "forest",
    name: "Forest",
    label: "Verde pinho escuro, sereno",
    bg: "bg-[#020604]",
    bgGradient: "from-[#051108] to-[#020604]",
    surface: "bg-[#06180c]",
    surfaceAlt: "hover:bg-[#0a2312]",
    border: "border-[#133c21]",
    borderFocus: "focus:ring-emerald-600",
    primary: "bg-[#10b981]",
    primaryHover: "hover:bg-[#34d399]",
    primaryText: "text-[#022c22]",
    text: "text-emerald-50",
    textSecondary: "text-emerald-200/70",
    textMuted: "text-emerald-600",
    accent: "text-[#10b981]",
    accentMuted: "text-emerald-900",
  },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id as ThemeId] ?? THEMES.minimal;
}
