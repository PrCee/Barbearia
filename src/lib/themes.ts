// Sistema de temas white-label — premium, clean, com personalidade
// Cada barbearia escolhe no painel admin com pré-visualização ao vivo.

export type ThemeId =
  | "noir"
  | "midnight"
  | "bordeaux"
  | "forest"
  | "amber"
  | "ocean"
  | "slate"
  | "mono";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  label: string;
  // Cores estruturais
  bg: string;
  bgGradient: string;       // gradiente sutil no header
  surface: string;
  surfaceAlt: string;       // superfície alternativa (hover, cards secundários)
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
  accent: string;           // badges, ícones, detalhes
  accentMuted: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  noir: {
    id: "noir",
    name: "Noir",
    label: "Preto absoluto, elegância máxima",
    bg: "bg-black",
    bgGradient: "from-neutral-900 via-black to-black",
    surface: "bg-neutral-950",
    surfaceAlt: "hover:bg-neutral-900",
    border: "border-neutral-800",
    borderFocus: "focus:ring-neutral-500",
    primary: "bg-white",
    primaryHover: "hover:bg-neutral-200",
    primaryText: "text-black",
    text: "text-white",
    textSecondary: "text-neutral-300",
    textMuted: "text-neutral-500",
    accent: "text-neutral-400",
    accentMuted: "text-neutral-700",
  },
  midnight: {
    id: "midnight",
    name: "Midnight",
    label: "Azul profundo, sofisticação noturna",
    bg: "bg-[#0a0e1a]",
    bgGradient: "from-[#111827] via-[#0a0e1a] to-[#0a0e1a]",
    surface: "bg-[#111827]",
    surfaceAlt: "hover:bg-[#1a2236]",
    border: "border-[#1e2d4a]",
    borderFocus: "focus:ring-indigo-400/50",
    primary: "bg-indigo-500",
    primaryHover: "hover:bg-indigo-400",
    primaryText: "text-white",
    text: "text-slate-100",
    textSecondary: "text-slate-300",
    textMuted: "text-slate-500",
    accent: "text-indigo-400",
    accentMuted: "text-indigo-400/40",
  },
  bordeaux: {
    id: "bordeaux",
    name: "Bordeaux",
    label: "Vinho escuro, toque europeu",
    bg: "bg-[#0d0610]",
    bgGradient: "from-[#1a0f1e] via-[#0d0610] to-[#0d0610]",
    surface: "bg-[#1a0f1e]",
    surfaceAlt: "hover:bg-[#261525]",
    border: "border-[#2d1a2b]",
    borderFocus: "focus:ring-rose-400/40",
    primary: "bg-rose-700",
    primaryHover: "hover:bg-rose-600",
    primaryText: "text-white",
    text: "text-rose-50",
    textSecondary: "text-rose-200/80",
    textMuted: "text-rose-300/50",
    accent: "text-rose-400",
    accentMuted: "text-rose-500/40",
  },
  forest: {
    id: "forest",
    name: "Forest",
    label: "Verde musgo, natural e acolhedor",
    bg: "bg-[#0a0f0a]",
    bgGradient: "from-[#111a11] via-[#0a0f0a] to-[#0a0f0a]",
    surface: "bg-[#111a11]",
    surfaceAlt: "hover:bg-[#1a261a]",
    border: "border-[#1c2e1c]",
    borderFocus: "focus:ring-emerald-500/40",
    primary: "bg-emerald-600",
    primaryHover: "hover:bg-emerald-500",
    primaryText: "text-white",
    text: "text-emerald-50",
    textSecondary: "text-emerald-100/80",
    textMuted: "text-emerald-200/50",
    accent: "text-emerald-400",
    accentMuted: "text-emerald-500/40",
  },
  amber: {
    id: "amber",
    name: "Amber",
    label: "Âmbar quente, barbearia premium",
    bg: "bg-[#0f0b07]",
    bgGradient: "from-[#1a1410] via-[#0f0b07] to-[#0f0b07]",
    surface: "bg-[#1a1410]",
    surfaceAlt: "hover:bg-[#261d15]",
    border: "border-[#2d2016]",
    borderFocus: "focus:ring-amber-500/40",
    primary: "bg-amber-600",
    primaryHover: "hover:bg-amber-500",
    primaryText: "text-amber-950",
    text: "text-amber-50",
    textSecondary: "text-amber-100/80",
    textMuted: "text-amber-200/50",
    accent: "text-amber-400",
    accentMuted: "text-amber-500/40",
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    label: "Azul oceano, calmo e moderno",
    bg: "bg-[#07101a]",
    bgGradient: "from-[#0d1a2a] via-[#07101a] to-[#07101a]",
    surface: "bg-[#0d1a2a]",
    surfaceAlt: "hover:bg-[#14273d]",
    border: "border-[#1a3050]",
    borderFocus: "focus:ring-cyan-400/40",
    primary: "bg-cyan-600",
    primaryHover: "hover:bg-cyan-500",
    primaryText: "text-white",
    text: "text-cyan-50",
    textSecondary: "text-cyan-100/80",
    textMuted: "text-cyan-200/50",
    accent: "text-cyan-400",
    accentMuted: "text-cyan-500/30",
  },
  slate: {
    id: "slate",
    name: "Slate",
    label: "Cinza urbano, contemporâneo limpo",
    bg: "bg-[#0c0d10]",
    bgGradient: "from-[#16171d] via-[#0c0d10] to-[#0c0d10]",
    surface: "bg-[#16171d]",
    surfaceAlt: "hover:bg-[#20222a]",
    border: "border-[#252730]",
    borderFocus: "focus:ring-violet-400/40",
    primary: "bg-violet-600",
    primaryHover: "hover:bg-violet-500",
    primaryText: "text-white",
    text: "text-slate-100",
    textSecondary: "text-slate-300",
    textMuted: "text-slate-500",
    accent: "text-violet-400",
    accentMuted: "text-violet-500/40",
  },
  mono: {
    id: "mono",
    name: "Mono",
    label: "Monocromático, minimalismo puro",
    bg: "bg-[#0a0a0a]",
    bgGradient: "from-[#141414] via-[#0a0a0a] to-[#0a0a0a]",
    surface: "bg-[#141414]",
    surfaceAlt: "hover:bg-[#1f1f1f]",
    border: "border-[#262626]",
    borderFocus: "focus:ring-neutral-400",
    primary: "bg-neutral-200",
    primaryHover: "hover:bg-white",
    primaryText: "text-black",
    text: "text-neutral-100",
    textSecondary: "text-neutral-300",
    textMuted: "text-neutral-500",
    accent: "text-neutral-400",
    accentMuted: "text-neutral-700",
  },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id as ThemeId] ?? THEMES.noir;
}
