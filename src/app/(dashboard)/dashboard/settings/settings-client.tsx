"use client";

import { useState, useTransition } from "react";
import type { ThemeConfig, ThemeId } from "@/lib/themes";
import { THEMES } from "@/lib/themes";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface ShopData {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  theme: string;
  alias: string;
}

interface SettingsClientProps {
  shop: ShopData;
  theme: ThemeConfig;
}

// ---------------------------------------------------------------------------
// Seletor de tema — 8 botões coloridos com preview
// ---------------------------------------------------------------------------

function ThemeSelector({
  selected,
  onChange,
  theme,
}: {
  selected: string;
  onChange: (id: ThemeId) => void;
  theme: ThemeConfig;
}) {
  const themeEntries = Object.values(THEMES);

  // Mapeamento visual de cada tema para sua cor de preview
  const themePreviewColor: Record<ThemeId, string> = {
    noir: "bg-neutral-900 border-neutral-700",
    midnight: "bg-indigo-900 border-indigo-600",
    bordeaux: "bg-rose-950 border-rose-700",
    forest: "bg-emerald-950 border-emerald-700",
    amber: "bg-amber-950 border-amber-700",
    ocean: "bg-cyan-950 border-cyan-700",
    slate: "bg-violet-950 border-violet-700",
    mono: "bg-zinc-900 border-zinc-600",
  };

  const dotColor: Record<ThemeId, string> = {
    noir: "bg-white",
    midnight: "bg-indigo-400",
    bordeaux: "bg-rose-400",
    forest: "bg-emerald-400",
    amber: "bg-amber-400",
    ocean: "bg-cyan-400",
    slate: "bg-violet-400",
    mono: "bg-neutral-300",
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {themeEntries.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          title={t.label}
          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
            themePreviewColor[t.id]
          } ${
            selected === t.id
              ? "border-white ring-2 ring-white/40 scale-105"
              : "border-transparent hover:border-white/30"
          }`}
        >
          <div className={`w-5 h-5 rounded-full ${dotColor[t.id]}`} />
          <span className="text-[10px] font-medium text-white/80">{t.name}</span>
          {selected === t.id && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Component principal
// ---------------------------------------------------------------------------

export function SettingsClient({ shop, theme: t }: SettingsClientProps) {
  const [name, setName] = useState(shop.name);
  const [address, setAddress] = useState(shop.address ?? "");
  const [phone, setPhone] = useState(shop.phone ?? "");
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(shop.theme as ThemeId);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/dashboard/shop", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, phone, theme: selectedTheme }),
        });

        if (!res.ok) {
          const data = await res.json();
          setFeedback({ type: "error", message: data.error ?? "Erro ao salvar." });
          return;
        }

        setFeedback({ type: "success", message: "Configurações salvas com sucesso!" });
        // Recarrega para aplicar o novo tema no layout
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setFeedback({ type: "error", message: "Erro de conexão. Tente novamente." });
      }
    });
  }

  const inputClass = `w-full px-4 py-3 rounded-xl ${t.surface} ${t.border} border ${t.text} text-sm outline-none focus:ring-2 ${t.borderFocus} transition-all placeholder:${t.textMuted}`;
  const labelClass = `block text-xs font-medium mb-1.5 ${t.textSecondary}`;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${t.text}`}>Configurações</h1>
        <p className={`text-sm mt-1 ${t.textMuted}`}>
          Personalize sua barbearia
        </p>
      </div>

      {/* Dados básicos */}
      <div className={`p-6 rounded-2xl border ${t.surface} ${t.border} space-y-5`}>
        <h2 className={`text-sm font-semibold ${t.accent}`}>Dados da Barbearia</h2>

        <div>
          <label className={labelClass}>Nome da barbearia</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Barbearia do João"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Endereço</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Rua das Flores, 123 — São Paulo, SP"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Telefone / WhatsApp</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ex: (11) 99999-9999"
            className={inputClass}
          />
        </div>
      </div>

      {/* Seletor de tema */}
      <div className={`p-6 rounded-2xl border ${t.surface} ${t.border} space-y-4`}>
        <div>
          <h2 className={`text-sm font-semibold ${t.accent}`}>Tema Visual</h2>
          <p className={`text-xs mt-1 ${t.textMuted}`}>
            Escolha a identidade visual da sua barbearia
          </p>
        </div>
        <ThemeSelector
          selected={selectedTheme}
          onChange={setSelectedTheme}
          theme={t}
        />
        <p className={`text-xs ${t.textMuted}`}>
          Tema selecionado:{" "}
          <span className={`font-medium ${t.accent}`}>
            {THEMES[selectedTheme]?.name ?? selectedTheme}
          </span>{" "}
          — {THEMES[selectedTheme]?.label}
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={isPending}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${t.primary} ${t.primaryHover} ${t.primaryText} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
