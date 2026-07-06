"use client";

import { useState } from "react";
import { type ThemeConfig, getTheme, THEMES } from "@/lib/themes";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Professional {
  id: string;
  name: string;
}

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface TimeSlot {
  time: string;
  endTime: string;
}

// ---------------------------------------------------------------------------
// Dados mockados por barbearia (serão substituídos pela API real)
// ---------------------------------------------------------------------------

interface ShopData {
  name: string;
  address: string;
  theme: string;
  professionals: Professional[];
  services: ServiceItem[];
  slots: Record<string, TimeSlot[]>;
}

const MOCK_SHOPS: Record<string, ShopData> = {
  "barber-shop": {
    name: "Barber Shop",
    address: "Av. São Paulo, 123",
    theme: "classic-dark",
    professionals: [
      { id: "1", name: "Alexandre" },
      { id: "2", name: "Bruno" },
    ],
    services: [
      { id: "s1", name: "Barba", durationMinutes: 30, price: 35 },
      { id: "s2", name: "Corte Degradê", durationMinutes: 45, price: 50 },
      { id: "s3", name: "Barba + Corte", durationMinutes: 60, price: 75 },
    ],
    slots: {
      s1: [
        { time: "08:00", endTime: "08:30" },
        { time: "08:30", endTime: "09:00" },
        { time: "09:00", endTime: "09:30" },
        { time: "10:30", endTime: "11:00" },
        { time: "11:00", endTime: "11:30" },
      ],
      s2: [
        { time: "08:00", endTime: "08:45" },
        { time: "09:00", endTime: "09:45" },
        { time: "10:30", endTime: "11:15" },
      ],
      s3: [
        { time: "08:00", endTime: "09:00" },
        { time: "10:30", endTime: "11:30" },
      ],
    },
  },
  // Demo de outro tema
  "barbearia-premium": {
    name: "Barbearia Premium",
    address: "Rua das Palmeiras, 456",
    theme: "warm-gold",
    professionals: [
      { id: "1", name: "Ricardo" },
      { id: "2", name: "Felipe" },
    ],
    services: [
      { id: "s1", name: "Barba Premium", durationMinutes: 40, price: 55 },
      { id: "s2", name: "Corte VIP", durationMinutes: 60, price: 80 },
    ],
    slots: {
      s1: [
        { time: "08:00", endTime: "08:40" },
        { time: "09:00", endTime: "09:40" },
        { time: "10:00", endTime: "10:40" },
      ],
      s2: [
        { time: "08:00", endTime: "09:00" },
        { time: "09:30", endTime: "10:30" },
      ],
    },
  },
  "urban-cut": {
    name: "Urban Cut",
    address: "Av. Central, 789",
    theme: "urban-slate",
    professionals: [
      { id: "1", name: "Diego" },
    ],
    services: [
      { id: "s1", name: "Social", durationMinutes: 30, price: 40 },
      { id: "s2", name: "Undercut", durationMinutes: 45, price: 60 },
    ],
    slots: {
      s1: [
        { time: "08:00", endTime: "08:30" },
        { time: "09:00", endTime: "09:30" },
        { time: "10:00", endTime: "10:30" },
        { time: "11:00", endTime: "11:30" },
      ],
      s2: [
        { time: "08:00", endTime: "08:45" },
        { time: "09:00", endTime: "09:45" },
        { time: "10:30", endTime: "11:15" },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Classes helper
// ---------------------------------------------------------------------------

function btn(primary: string, primaryHover: string, surface: string, surfaceHover: string, border: string) {
  return {
    primary: `${primary} ${primaryHover} text-white font-bold`,
    outline: `border ${border} ${surface} ${surfaceHover}`,
    ghost: `${surface} ${surfaceHover}`,
  };
}

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default async function BookingPage({
  params,
}: {
  params: Promise<{ alias: string }>;
}) {
  const { alias } = await params;
  const shop = MOCK_SHOPS[alias] ?? MOCK_SHOPS["barber-shop"];
  const theme = getTheme(shop.theme);

  return <BookingClient shop={shop} theme={theme} />;
}

// ---------------------------------------------------------------------------
// Client component (precisa de estado para o fluxo de steps)
// ---------------------------------------------------------------------------

function BookingClient({
  shop,
  theme,
}: {
  shop: ShopData;
  theme: ThemeConfig;
}) {
  const [step, setStep] = useState(1);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleNext = () => {
    if (step === 1 && selectedPro && selectedService && selectedDate) setStep(2);
    if (step === 2 && selectedSlot) setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && clientPhone) setSubmitted(true);
  };

  const b = btn(theme.primary, theme.primaryHover, theme.surface, theme.surfaceHover, theme.border);
  const inputClass = cn("w-full p-3 rounded-xl border", theme.border, theme.surface, theme.text, "focus:outline-none focus:ring-2 focus:ring-offset-0", theme.primary.replace("bg-", "focus:ring-").replace("500", "400").replace("600", "500").replace("white", "neutral-400"));

  // ---- Tela de sucesso ----
  if (submitted) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-4", theme.bg, theme.text)}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Agendado com Sucesso</h2>
          <p className={cn("mb-6", theme.textMuted)}>Obrigado por agendar conosco!</p>
          <div className={cn("rounded-xl p-4 text-left space-y-2 mb-6", theme.surface)}>
            <p><span className={theme.textMuted}>Profissional:</span> {selectedPro?.name}</p>
            <p><span className={theme.textMuted}>Serviço:</span> {selectedService?.name}</p>
            <p><span className={theme.textMuted}>Dia:</span> {formatDate(selectedDate)}</p>
            <p><span className={theme.textMuted}>Hora:</span> {selectedSlot?.time}</p>
            <p className={cn("font-bold mt-2", theme.primary.replace("bg-", "text-"))}>
              Total: R$ {selectedService?.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => {
              setStep(1);
              setSubmitted(false);
              setSelectedPro(null);
              setSelectedService(null);
              setSelectedDate("");
              setSelectedSlot(null);
              setClientName("");
              setClientPhone("");
            }}
            className={cn("w-full py-3 rounded-xl font-medium transition-colors", b.ghost)}
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  // ---- Fluxo de agendamento ----
  return (
    <div className={cn("min-h-screen", theme.bg, theme.text)}>
      {/* Header da barbearia */}
      <div className="relative h-48 bg-gradient-to-b from-neutral-800 to-transparent">
        <div className={cn("absolute inset-0", theme.bg, "bg-gradient-to-b from-neutral-800/50 to-transparent")} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("w-20 h-20 rounded-full mb-3 flex items-center justify-center text-3xl", theme.surface)}>
            💈
          </div>
          <h1 className="text-xl font-bold">{shop.name}</h1>
          <p className={cn("text-sm", theme.textMuted)}>{shop.address}</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex justify-center gap-2 px-4 py-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full flex-1 max-w-16 transition-colors",
              s <= step ? theme.primary : theme.surface
            )}
          />
        ))}
      </div>

      <div className="px-4 pb-8 max-w-md mx-auto">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className={cn("text-sm font-medium mb-3", theme.textMuted)}>Escolha o profissional</h3>
              <div className="grid grid-cols-2 gap-3">
                {shop.professionals.map((pro) => (
                  <button
                    key={pro.id}
                    onClick={() => setSelectedPro(pro)}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-all",
                      selectedPro?.id === pro.id
                        ? cn(theme.primary, "border-transparent bg-opacity-15")
                        : cn(theme.border, theme.surface, theme.surfaceHover)
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg", theme.bg)}>
                      {pro.name[0]}
                    </div>
                    <p className="text-sm font-medium">{pro.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedPro && (
              <div>
                <h3 className={cn("text-sm font-medium mb-3", theme.textMuted)}>Escolha o serviço</h3>
                <div className="space-y-2">
                  {shop.services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedService(svc)}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all",
                        selectedService?.id === svc.id
                          ? cn(theme.primary, "border-transparent bg-opacity-15")
                          : cn(theme.border, theme.surface, theme.surfaceHover)
                      )}
                    >
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        <p className={cn("text-xs", theme.textMuted)}>{svc.durationMinutes} min</p>
                      </div>
                      <span className={cn("font-bold", theme.primary.replace("bg-", "text-"))}>
                        R$ {svc.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedService && (
              <div>
                <h3 className={cn("text-sm font-medium mb-3", theme.textMuted)}>Escolha o dia</h3>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={cn("w-full p-3 rounded-xl border transition-colors [color-scheme:dark]", theme.border, theme.surface, theme.text, "focus:outline-none focus:ring-2", theme.primary.replace("bg-", "focus:ring-").replace("600","500").replace("500","400"))}
                />
              </div>
            )}

            {selectedDate && (
              <button onClick={handleNext} className={cn("w-full py-3 rounded-xl transition-colors", b.primary)}>
                Avançar →
              </button>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && selectedService && (
          <div className="space-y-6">
            <h3 className={cn("text-sm font-medium", theme.textMuted)}>
              Escolha a hora — {formatDate(selectedDate)}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(shop.slots[selectedService.id] || []).map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "p-3 rounded-xl border text-center text-sm transition-all",
                    selectedSlot?.time === slot.time
                      ? cn(theme.primary, "border-transparent")
                      : cn(theme.border, theme.surface, theme.surfaceHover)
                  )}
                >
                  {slot.time}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className={cn("flex-1 py-3 rounded-xl font-medium transition-colors", b.outline)}>
                ← Voltar
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedSlot}
                className={cn("flex-1 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed", b.primary)}
              >
                Avançar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && selectedSlot && (
          <div className="space-y-6">
            <h3 className={cn("text-sm font-medium text-center", theme.textMuted)}>
              Revise e Confirme
            </h3>

            <div className={cn("rounded-xl p-4 space-y-3", theme.surface)}>
              <Row label="Profissional" value={selectedPro?.name ?? ""} muted={theme.textMuted} />
              <Row label="Serviço" value={selectedService?.name ?? ""} muted={theme.textMuted} />
              <Row label="Dia" value={formatDate(selectedDate)} muted={theme.textMuted} />
              <Row label="Hora" value={selectedSlot.time} muted={theme.textMuted} />
              <hr className={theme.border} />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className={theme.primary.replace("bg-", "text-")}>
                  R$ {selectedService?.price.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={cn("block text-sm mb-1", theme.textMuted)}>Nome Completo</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={inputClass}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className={cn("block text-sm mb-1", theme.textMuted)}>WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className={inputClass}
                  placeholder="(19) 99999-9999"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className={cn("flex-1 py-3 rounded-xl font-medium transition-colors", b.outline)}>
                  ← Voltar
                </button>
                <button type="submit" className={cn("flex-1 py-3 rounded-xl transition-colors", b.primary)}>
                  Criar Agendamento
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Row({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <div className="flex justify-between">
      <span className={muted}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
