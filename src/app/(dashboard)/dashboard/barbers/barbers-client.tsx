"use client";

import { useState, useEffect, useTransition } from "react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Barber {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  image: string | null;
}

interface ThemeClasses {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderFocus: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
}

interface BarbersClientProps {
  theme: ThemeClasses;
}

// ---------------------------------------------------------------------------
// Avatar — inicial do nome ou foto
// ---------------------------------------------------------------------------

function BarberAvatar({ barber }: { barber: Barber }) {
  if (barber.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={barber.image}
        alt={barber.name}
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400 font-bold text-sm">
      {barber.name.charAt(0).toUpperCase()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal de adição de barbeiro
// ---------------------------------------------------------------------------

interface AddBarberModalProps {
  t: ThemeClasses;
  onClose: () => void;
  onSuccess: (barber: Barber) => void;
}

function AddBarberModal({ t, onClose, onSuccess }: AddBarberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/dashboard/barbers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Erro ao cadastrar barbeiro.");
          return;
        }

        // Se imageUrl foi fornecido, atualiza o barbeiro criado
        if (imageUrl.trim() && data.id) {
          await fetch(`/api/dashboard/barbers/${data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl }),
          });
          data.image = imageUrl;
        }

        onSuccess(data as Barber);
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  }

  const inputClass = `w-full px-4 py-3 rounded-xl ${t.surface} ${t.border} border ${t.text} text-sm outline-none focus:ring-2 ${t.borderFocus} transition-all placeholder:text-neutral-600`;
  const labelClass = `block text-xs font-medium mb-1.5 ${t.textSecondary}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl border ${t.surface} ${t.border} p-6 shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${t.text}`}>Novo Barbeiro</h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${t.surfaceAlt} ${t.textMuted} text-lg`}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carlos Souza"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@barbearia.com"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Senha *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>URL da foto (opcional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/30">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl text-sm font-medium ${t.surfaceAlt} ${t.textSecondary} border ${t.border}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${t.primary} ${t.primaryHover} ${t.primaryText} disabled:opacity-50`}
            >
              {isPending ? "Criando..." : "Criar barbeiro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function BarbersClient({ theme: t }: BarbersClientProps) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/barbers")
      .then((r) => r.json())
      .then((data) => setBarbers(Array.isArray(data) ? data : []))
      .catch(() => setBarbers([]))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(barber: Barber) {
    setTogglingId(barber.id);
    try {
      const res = await fetch(`/api/dashboard/barbers/${barber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !barber.active }),
      });

      if (res.ok) {
        setBarbers((prev) =>
          prev.map((b) =>
            b.id === barber.id ? { ...b, active: !barber.active } : b
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${t.text}`}>Barbeiros</h1>
          <p className={`text-sm mt-1 ${t.textMuted}`}>
            {barbers.length} barbeiro{barbers.length !== 1 ? "s" : ""} cadastrado{barbers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${t.primary} ${t.primaryHover} ${t.primaryText}`}
        >
          <span className="text-lg leading-none">+</span>
          Novo barbeiro
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className={`py-20 text-center ${t.textMuted}`}>Carregando...</div>
      ) : barbers.length === 0 ? (
        <div className={`py-20 text-center rounded-2xl border ${t.surface} ${t.border}`}>
          <p className={`text-4xl mb-3`}>👤</p>
          <p className={`font-medium ${t.textSecondary}`}>Nenhum barbeiro cadastrado</p>
          <p className={`text-sm mt-1 ${t.textMuted}`}>Adicione o primeiro barbeiro da equipe</p>
        </div>
      ) : (
        <div className={`rounded-2xl border ${t.surface} ${t.border} overflow-hidden`}>
          {barbers.map((barber, idx) => (
            <div
              key={barber.id}
              className={`flex items-center gap-4 px-6 py-4 transition-all ${t.surfaceAlt} ${
                idx < barbers.length - 1 ? `border-b ${t.border}` : ""
              }`}
            >
              <BarberAvatar barber={barber} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium text-sm ${t.text} truncate`}>
                    {barber.name}
                  </p>
                  {barber.role === "admin" && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.accent} bg-amber-500/10`}>
                      Admin
                    </span>
                  )}
                </div>
                <p className={`text-xs ${t.textMuted} truncate`}>{barber.email}</p>
              </div>

              {/* Badge ativo/inativo */}
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  barber.active
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-neutral-500 bg-neutral-500/10"
                }`}
              >
                {barber.active ? "Ativo" : "Inativo"}
              </span>

              {/* Botão toggle */}
              <button
                onClick={() => toggleActive(barber)}
                disabled={togglingId === barber.id}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${t.border} ${t.surfaceAlt} ${t.textSecondary} hover:${t.text} disabled:opacity-50`}
              >
                {togglingId === barber.id
                  ? "..."
                  : barber.active
                  ? "Desativar"
                  : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddBarberModal
          t={t}
          onClose={() => setShowModal(false)}
          onSuccess={(barber) => {
            setBarbers((prev) => [...prev, barber]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
