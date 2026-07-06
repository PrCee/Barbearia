// Sistema de temas white-label — 5 paletas predefinidas
// Cada barbearia escolhe uma. CSS vars injetadas via Tailwind.

export type ThemeId =
  | "classic-dark"
  | "clean-light"
  | "warm-gold"
  | "urban-slate"
  | "minimal-mono";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  label: string;        // Nome amigável p/ painel admin
  bg: string;           // Background principal
  surface: string;      // Cards, inputs
  surfaceHover: string; // Hover de cards/botões secundários
  border: string;       // Bordas
  primary: string;      // Cor principal (botões, destaques)
  primaryHover: string; // Hover do primary
  text: string;         // Texto principal
  textMuted: string;    // Texto secundário/labels
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  "classic-dark": {
    id: "classic-dark",
    name: "Classic Dark",
    label: "Escuro Clássico",
    bg: "bg-zinc-950",
    surface: "bg-zinc-900",
    surfaceHover: "hover:bg-zinc-800",
    border: "border-zinc-800",
    primary: "bg-emerald-600",
    primaryHover: "hover:bg-emerald-500",
    text: "text-white",
    textMuted: "text-zinc-400",
  },
  "clean-light": {
    id: "clean-light",
    name: "Clean Light",
    label: "Claro Limpo",
    bg: "bg-white",
    surface: "bg-gray-50",
    surfaceHover: "hover:bg-gray-100",
    border: "border-gray-200",
    primary: "bg-blue-600",
    primaryHover: "hover:bg-blue-500",
    text: "text-gray-900",
    textMuted: "text-gray-500",
  },
  "warm-gold": {
    id: "warm-gold",
    name: "Warm Gold",
    label: "Dourado Quente",
    bg: "bg-stone-950",
    surface: "bg-stone-900",
    surfaceHover: "hover:bg-stone-800",
    border: "border-amber-900/30",
    primary: "bg-amber-500",
    primaryHover: "hover:bg-amber-400",
    text: "text-amber-50",
    textMuted: "text-amber-200/60",
  },
  "urban-slate": {
    id: "urban-slate",
    name: "Urban Slate",
    label: "Urbano",
    bg: "bg-slate-950",
    surface: "bg-slate-900",
    surfaceHover: "hover:bg-slate-800",
    border: "border-slate-800",
    primary: "bg-orange-500",
    primaryHover: "hover:bg-orange-400",
    text: "text-slate-50",
    textMuted: "text-slate-400",
  },
  "minimal-mono": {
    id: "minimal-mono",
    name: "Minimal Mono",
    label: "Minimalista",
    bg: "bg-black",
    surface: "bg-neutral-950",
    surfaceHover: "hover:bg-neutral-900",
    border: "border-neutral-800",
    primary: "bg-white",
    primaryHover: "hover:bg-neutral-200",
    text: "text-white",
    textMuted: "text-neutral-500",
  },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id as ThemeId] ?? THEMES["classic-dark"];
}

export function getThemeClasses(themeId: string): string {
  const t = getTheme(themeId);
  return [
    t.bg,
    t.text,
    "[color-scheme:" + (themeId === "clean-light" ? "light" : "dark") + "]",
  ].join(" ");
}
