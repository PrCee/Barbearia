"use client";

import { useState } from "react";
import { THEMES, type ThemeId, type ThemeConfig, getTheme } from "@/lib/themes";

const THEME_IDS: ThemeId[] = ["minimal", "silver", "cream", "frost", "noir", "midnight", "slate", "forest"];

function cn(...c: (string | false | undefined | null)[]): string {
  return c.filter(Boolean).join(" ");
}

export default function ThemeShowcase() {
  const [active, setActive] = useState<ThemeId>("minimal");
  const theme = getTheme(active);

  return (
    <div className={cn("min-h-screen p-6 md:p-10", theme.bg, theme.text)}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Escolha o tema</h1>
          <p className={cn("text-sm max-w-md mx-auto", theme.textMuted)}>
            Selecione o visual da sua barbearia. A pré-visualização muda em tempo real.
          </p>
        </div>

        {/* Grid de temas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all duration-200",
                  isActive ? cn(t.primary, "shadow-lg scale-[1.02] border-transparent") : cn(t.bg, t.border, "hover:scale-[1.01]")
                )}
              >
                {/* Swatches */}
                <div className="flex gap-1.5 mb-3">
                  <div className={cn("w-6 h-6 rounded-full", t.primary)} />
                  <div className={cn("w-6 h-6 rounded-full border", t.surface, t.border)} />
                  <div className={cn("w-6 h-6 rounded-full", t.accent.replace("text-", "bg-"))} />
                </div>
                <p className={cn("text-sm font-bold", isActive ? t.primaryText : t.text)}>{t.name}</p>
                <p className={cn("text-xs mt-0.5", isActive ? cn(t.primaryText, "opacity-70") : t.textMuted)}>
                  {t.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Preview do tema ativo */}
        <div className={cn("rounded-2xl border overflow-hidden", theme.surface, theme.border)}>
          {/* Mock do header da barbearia */}
          <div className={cn("p-8 text-center bg-gradient-to-b", theme.bgGradient)}>
            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl border shadow-lg shadow-black/10", theme.surface, theme.border)}>
              💈
            </div>
            <h2 className={cn("text-lg font-bold", theme.text)}>Sua Barbearia</h2>
            <p className={cn("text-xs mt-1", theme.textMuted)}>Rua Exemplo, 123</p>
          </div>

          {/* Mock do conteúdo */}
          <div className="p-6 space-y-4">
            {/* Card de serviço */}
            <div className={cn("p-4 rounded-xl border flex justify-between items-center", theme.bg, theme.border)}>
              <div>
                <p className={cn("text-sm font-medium", theme.textSecondary)}>Corte Degradê</p>
                <p className={cn("text-xs", theme.textMuted)}>45 min</p>
              </div>
              <span className={cn("text-sm font-bold", theme.accent)}>R$ 50,00</span>
            </div>

            {/* Grid de horários */}
            <div className="grid grid-cols-4 gap-2">
              {["08:00", "09:00", "10:00", "11:00"].map((time, i) => (
                <div key={time} className={cn(
                  "p-3 rounded-xl border text-center text-xs font-medium",
                  i === 1 ? cn(theme.primary, "border-transparent shadow-sm", theme.primaryText) : cn(theme.bg, theme.border, theme.textMuted)
                )}>
                  {time}
                </div>
              ))}
            </div>

            {/* Botão primário */}
            <button className={cn("w-full py-3.5 rounded-xl font-bold text-sm shadow-lg", theme.primary, theme.primaryHover, theme.primaryText)}>
              Criar Agendamento
            </button>

            {/* Botão secundário */}
            <button className={cn("w-full py-3 rounded-xl font-medium text-sm border", theme.bg, theme.border, theme.textSecondary, theme.surfaceAlt)}>
              Cancelar
            </button>
          </div>
        </div>

        {/* Info do tema */}
        <p className={cn("text-center text-xs mt-8", theme.textMuted)}>
          💡 No painel admin, o dono da barbearia poderá trocar o tema a qualquer momento com preview ao vivo.
        </p>
      </div>
    </div>
  );
}
