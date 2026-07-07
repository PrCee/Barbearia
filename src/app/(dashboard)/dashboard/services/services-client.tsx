"use client";

import { useState, useEffect, useTransition } from "react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
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

interface ServicesClientProps {
  theme: ThemeClasses;
}

// ---------------------------------------------------------------------------
// Formatação de preço e duração
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Modal de adição/edição de serviço
// ---------------------------------------------------------------------------

interface ServiceModalProps {
  t: ThemeClasses;
  onClose: () => void;
  onSuccess: (service: Service) => void;
  initial?: Service | null;
}

function ServiceModal({ t, onClose, onSuccess, initial }: ServiceModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    String(initial?.durationMinutes ?? "")
  );
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedDuration = parseInt(durationMinutes, 10);
    const parsedPrice = parseFloat(price.replace(",", "."));

    if (!name.trim()) { setError("Nome é obrigatório."); return; }
    if (isNaN(parsedDuration) || parsedDuration <= 0) { setError("Duração inválida."); return; }
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Preço inválido."); return; }

    startTransition(async () => {
      try {
        const url = isEditing
          ? `/api/dashboard/services/${initial.id}`
          : "/api/dashboard/services";
        const method = isEditing ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            durationMinutes: parsedDuration,
            price: parsedPrice,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Erro ao salvar serviço.");
          return;
        }

        onSuccess(data as Service);
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
          <h2 className={`text-lg font-bold ${t.text}`}>
            {isEditing ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${t.surfaceAlt} ${t.textMuted} text-lg`}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome do serviço *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corte + Barba"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Duração (min) *</label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="Ex: 45"
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Preço (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 45,00"
                className={inputClass}
                required
              />
            </div>
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
              {isPending ? "Salvando..." : isEditing ? "Salvar" : "Criar serviço"}
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

export function ServicesClient({ theme: t }: ServicesClientProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/services")
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(service: Service) {
    setTogglingId(service.id);
    try {
      const res = await fetch(`/api/dashboard/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !service.active }),
      });

      if (res.ok) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === service.id ? { ...s, active: !service.active } : s
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  function handleOpenEdit(service: Service) {
    setEditingService(service);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setEditingService(null);
  }

  function handleSuccess(saved: Service) {
    setServices((prev) => {
      const exists = prev.find((s) => s.id === saved.id);
      if (exists) return prev.map((s) => (s.id === saved.id ? saved : s));
      return [...prev, saved];
    });
    handleCloseModal();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${t.text}`}>Serviços</h1>
          <p className={`text-sm mt-1 ${t.textMuted}`}>
            {services.filter((s) => s.active).length} ativo{services.filter((s) => s.active).length !== 1 ? "s" : ""}{" "}
            de {services.length} serviço{services.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditingService(null); setShowModal(true); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${t.primary} ${t.primaryHover} ${t.primaryText}`}
        >
          <span className="text-lg leading-none">+</span>
          Novo serviço
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className={`py-20 text-center ${t.textMuted}`}>Carregando...</div>
      ) : services.length === 0 ? (
        <div className={`py-20 text-center rounded-2xl border ${t.surface} ${t.border}`}>
          <p className="text-4xl mb-3">✂️</p>
          <p className={`font-medium ${t.textSecondary}`}>Nenhum serviço cadastrado</p>
          <p className={`text-sm mt-1 ${t.textMuted}`}>Adicione o primeiro serviço da barbearia</p>
        </div>
      ) : (
        <div className={`rounded-2xl border ${t.surface} ${t.border} overflow-hidden`}>
          {services.map((service, idx) => (
            <div
              key={service.id}
              className={`flex items-center gap-4 px-6 py-4 transition-all ${t.surfaceAlt} ${
                idx < services.length - 1 ? `border-b ${t.border}` : ""
              }`}
            >
              {/* Ícone */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${t.bg}`}>
                ✂️
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${t.text}`}>{service.name}</p>
                <p className={`text-xs ${t.textMuted}`}>
                  {formatDuration(service.durationMinutes)}
                </p>
              </div>

              {/* Preço */}
              <p className={`text-sm font-semibold ${t.accent} min-w-[70px] text-right`}>
                {formatPrice(service.price)}
              </p>

              {/* Badge */}
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium min-w-[60px] text-center ${
                  service.active
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-neutral-500 bg-neutral-500/10"
                }`}
              >
                {service.active ? "Ativo" : "Inativo"}
              </span>

              {/* Botões */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(service)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${t.border} ${t.surfaceAlt} ${t.textSecondary}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(service)}
                  disabled={togglingId === service.id}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${t.border} ${t.surfaceAlt} ${t.textSecondary} disabled:opacity-50`}
                >
                  {togglingId === service.id
                    ? "..."
                    : service.active
                    ? "Desativar"
                    : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ServiceModal
          t={t}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          initial={editingService}
        />
      )}
    </div>
  );
}
