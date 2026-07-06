"use client";

import { useState } from "react";
import { type ThemeConfig, getTheme } from "@/lib/themes";

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
interface ShopData {
  name: string;
  address: string;
  theme: string;
  phone?: string;
  professionals: Professional[];
  services: ServiceItem[];
  slots: Record<string, TimeSlot[]>;
}

// ---------------------------------------------------------------------------
// Mock — será substituído pelo banco
// ---------------------------------------------------------------------------

const MOCK_SHOPS: Record<string, ShopData> = {
  "barber-shop": {
    name: "Barber Shop",
    address: "Av. São Paulo, 123",
    theme: "amber",
    phone: "5519993180893",
    professionals: [{ id: "1", name: "Alexandre" }, { id: "2", name: "Bruno" }],
    services: [
      { id: "s1", name: "Barba", durationMinutes: 30, price: 35 },
      { id: "s2", name: "Corte Degradê", durationMinutes: 45, price: 50 },
      { id: "s3", name: "Barba + Corte", durationMinutes: 60, price: 75 },
    ],
    slots: {
      s1: [{ time: "08:00", endTime: "08:30" }, { time: "08:30", endTime: "09:00" }, { time: "09:30", endTime: "10:00" }, { time: "10:30", endTime: "11:00" }, { time: "11:00", endTime: "11:30" }],
      s2: [{ time: "08:00", endTime: "08:45" }, { time: "09:00", endTime: "09:45" }, { time: "10:30", endTime: "11:15" }],
      s3: [{ time: "08:00", endTime: "09:00" }, { time: "10:30", endTime: "11:30" }],
    },
  },
};

// ---------------------------------------------------------------------------
// cn helper
// ---------------------------------------------------------------------------

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Página — server component wrapper → client
// ---------------------------------------------------------------------------

export default async function BookingPage({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const shop = MOCK_SHOPS[alias] ?? MOCK_SHOPS["barber-shop"];
  const theme = getTheme(shop.theme);
  return <BookingClient shop={shop} theme={theme} />;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

function BookingClient({ shop, theme }: { shop: ShopData; theme: ThemeConfig }) {
  const [step, setStep] = useState(1);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [transition, setTransition] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const goTo = (s: number) => {
    setTransition(true);
    setTimeout(() => { setStep(s); setTransition(false); }, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName && clientPhone) setSubmitted(true);
  };

  // ---- Tela de sucesso ----
  if (submitted) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6", theme.bg, theme.text)}>
        <div className="text-center max-w-sm w-full animate-in fade-in zoom-in duration-500">
          <div className={cn("w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl", theme.surface, "ring-2 ring-green-500/20")}>
            ✅
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Agendado com Sucesso</h2>
          <p className={cn("mb-8", theme.textMuted)}>Obrigado por agendar conosco!</p>

          <div className={cn("rounded-2xl p-5 text-left space-y-3 mb-8 border", theme.surface, theme.border)}>
            <ResumeLine label="Profissional" value={selectedPro?.name ?? ""} t={theme} />
            <ResumeLine label="Serviço" value={selectedService?.name ?? ""} t={theme} />
            <ResumeLine label="Dia" value={formatDate(selectedDate)} t={theme} />
            <ResumeLine label="Hora" value={selectedSlot?.time ?? ""} t={theme} />
            <div className={cn("pt-3 mt-3 border-t", theme.border)}>
              <ResumeLine label="Total" value={`R$ ${selectedService?.price.toFixed(2)}`} t={theme} bold />
            </div>
          </div>

          <button
            onClick={() => { setStep(1); setSubmitted(false); setSelectedPro(null); setSelectedService(null); setSelectedDate(""); setSelectedSlot(null); setClientName(""); setClientPhone(""); }}
            className={cn("w-full py-3.5 rounded-xl font-medium transition-all duration-200 border", theme.surface, theme.surfaceAlt, theme.border, theme.text)}
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
      {/* Header */}
      <div className={cn("relative pt-12 pb-16 bg-gradient-to-b", theme.bgGradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
        <div className="relative flex flex-col items-center px-6">
          <div className={cn("w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-2xl shadow-lg shadow-black/20 border", theme.surface, theme.border)}>
            💈
          </div>
          <h1 className="text-xl font-bold tracking-tight">{shop.name}</h1>
          <p className={cn("text-sm mt-1", theme.textMuted)}>{shop.address}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 -mt-4 relative z-10">
        <div className={cn("rounded-2xl border p-1 flex gap-1", theme.surface, theme.border)}>
          {["Profissional", "Horário", "Confirmar"].map((label, i) => (
            <div key={i} className={cn(
              "flex-1 text-center py-2 rounded-xl text-xs font-medium transition-all duration-300",
              step > i + 1 ? cn(theme.primary, theme.primaryText) : step === i + 1 ? cn(theme.surfaceAlt, theme.text, "shadow-sm") : cn(theme.textMuted)
            )}>
              {step > i + 1 ? "✓" : i + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className={cn("px-6 pb-12 max-w-md mx-auto transition-opacity duration-150", transition && "opacity-0")}>
        {step === 1 && <StepProfessionals shop={shop} theme={theme} selectedPro={selectedPro} setSelectedPro={setSelectedPro} selectedService={selectedService} setSelectedService={setSelectedService} selectedDate={selectedDate} setSelectedDate={setSelectedDate} today={today} onNext={() => goTo(2)} />}
        {step === 2 && <StepTimeSlots shop={shop} theme={theme} selectedService={selectedService!} selectedDate={selectedDate} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} onNext={() => goTo(3)} onBack={() => goTo(1)} />}
        {step === 3 && <StepConfirm shop={shop} theme={theme} selectedPro={selectedPro!} selectedService={selectedService!} selectedDate={selectedDate} selectedSlot={selectedSlot!} clientName={clientName} setClientName={setClientName} clientPhone={clientPhone} setClientPhone={setClientPhone} onSubmit={handleSubmit} onBack={() => goTo(2)} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Profissional + Serviço + Data
// ---------------------------------------------------------------------------

function StepProfessionals({ shop, theme, selectedPro, setSelectedPro, selectedService, setSelectedService, selectedDate, setSelectedDate, today, onNext }: {
  shop: ShopData; theme: ThemeConfig;
  selectedPro: Professional | null; setSelectedPro: (p: Professional) => void;
  selectedService: ServiceItem | null; setSelectedService: (s: ServiceItem) => void;
  selectedDate: string; setSelectedDate: (d: string) => void;
  today: string; onNext: () => void;
}) {
  return (
    <div className="space-y-6 pt-6">
      {/* Profissional */}
      <Section title="Escolha o profissional" theme={theme}>
        <div className="grid grid-cols-2 gap-3">
          {shop.professionals.map((pro) => (
            <button key={pro.id} onClick={() => setSelectedPro(pro)}
              className={cn("p-4 rounded-2xl border text-center transition-all duration-200",
                selectedPro?.id === pro.id
                  ? cn(theme.primary, "border-transparent shadow-lg scale-[1.02]")
                  : cn(theme.surface, theme.border, theme.surfaceAlt))}>
              <div className={cn("w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold", theme.bg, theme.textSecondary)}>
                {pro.name[0]}
              </div>
              <p className="text-sm font-medium">{pro.name}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Serviço */}
      {selectedPro && (
        <Section title="Escolha o serviço" theme={theme}>
          <div className="space-y-2">
            {shop.services.map((svc) => (
              <button key={svc.id} onClick={() => setSelectedService(svc)}
                className={cn("w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all duration-200",
                  selectedService?.id === svc.id
                    ? cn(theme.primary, "border-transparent shadow-lg")
                    : cn(theme.surface, theme.border, theme.surfaceAlt))}>
                <div>
                  <p className="font-medium text-sm">{svc.name}</p>
                  <p className={cn("text-xs mt-0.5", theme.textMuted)}>{svc.durationMinutes} min</p>
                </div>
                <span className={cn("font-bold text-sm", theme.accent)}>R$ {svc.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Data */}
      {selectedService && (
        <Section title="Escolha o dia" theme={theme}>
          <input type="date" value={selectedDate} min={today} onChange={(e) => setSelectedDate(e.target.value)}
            className={cn("w-full p-4 rounded-2xl border transition-all duration-200 [color-scheme:dark] font-medium text-sm",
              theme.surface, theme.border, theme.text, theme.borderFocus, "focus:outline-none focus:ring-2 focus:ring-offset-0")} />
        </Section>
      )}

      {selectedDate && (
        <button onClick={onNext} className={cn("w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98]",
          theme.primary, theme.primaryHover, theme.primaryText)}>
          Avançar →
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Horários
// ---------------------------------------------------------------------------

function StepTimeSlots({ shop, theme, selectedService, selectedDate, selectedSlot, setSelectedSlot, onNext, onBack }: {
  shop: ShopData; theme: ThemeConfig; selectedService: ServiceItem; selectedDate: string;
  selectedSlot: TimeSlot | null; setSelectedSlot: (s: TimeSlot) => void;
  onNext: () => void; onBack: () => void;
}) {
  const slots = shop.slots[selectedService.id] || [];
  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-2">
        <h3 className={cn("text-sm font-medium", theme.textMuted)}>
          {formatDate(selectedDate)}
        </h3>
        <span className={cn("text-xs py-0.5 px-2 rounded-full", theme.surface, theme.border, theme.textMuted)}>
          {selectedService.durationMinutes}min
        </span>
      </div>

      {slots.length === 0 ? (
        <div className={cn("text-center py-12 rounded-2xl border", theme.surface, theme.border)}>
          <p className={theme.textMuted}>Nenhum horário disponível nesta data.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <button key={slot.time} onClick={() => setSelectedSlot(slot)}
              className={cn("p-4 rounded-xl border text-center text-sm font-medium transition-all duration-200",
                selectedSlot?.time === slot.time
                  ? cn(theme.primary, "border-transparent shadow-lg scale-[1.02]", theme.primaryText)
                  : cn(theme.surface, theme.border, theme.surfaceAlt))}>
              {slot.time}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button onClick={onBack} className={cn("flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 border", theme.surface, theme.border, theme.surfaceAlt, theme.textSecondary)}>
          ← Voltar
        </button>
        <button onClick={onNext} disabled={!selectedSlot}
          className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed",
            theme.primary, theme.primaryHover, theme.primaryText)}>
          Avançar →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Confirmação
// ---------------------------------------------------------------------------

function StepConfirm({ shop, theme, selectedPro, selectedService, selectedDate, selectedSlot, clientName, setClientName, clientPhone, setClientPhone, onSubmit, onBack }: {
  shop: ShopData; theme: ThemeConfig; selectedPro: Professional; selectedService: ServiceItem;
  selectedDate: string; selectedSlot: TimeSlot;
  clientName: string; setClientName: (n: string) => void;
  clientPhone: string; setClientPhone: (p: string) => void;
  onSubmit: (e: React.FormEvent) => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6 pt-6">
      <h3 className={cn("text-sm font-medium text-center", theme.textMuted)}>Revise e confirme</h3>

      <div className={cn("rounded-2xl p-5 space-y-3 border", theme.surface, theme.border)}>
        <ResumeLine label="Profissional" value={selectedPro.name} t={theme} />
        <ResumeLine label="Serviço" value={selectedService.name} t={theme} />
        <ResumeLine label="Dia" value={formatDate(selectedDate)} t={theme} />
        <ResumeLine label="Hora" value={`${selectedSlot.time} — ${selectedSlot.endTime}`} t={theme} />
        <div className={cn("pt-3 mt-3 border-t", theme.border)}>
          <ResumeLine label="Total" value={`R$ ${selectedService.price.toFixed(2)}`} t={theme} bold />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={cn("block text-xs font-medium mb-1.5 ml-1", theme.textMuted)}>Nome Completo</label>
          <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)}
            placeholder="Seu nome completo"
            className={cn("w-full p-4 rounded-2xl border transition-all duration-200 text-sm",
              theme.surface, theme.border, theme.text, theme.borderFocus, "focus:outline-none focus:ring-2 focus:ring-offset-0", "placeholder:" + theme.textMuted.replace("text-", "text-").replace("500","500/50").replace("400","400/50"))} />
        </div>
        <div>
          <label className={cn("block text-xs font-medium mb-1.5 ml-1", theme.textMuted)}>WhatsApp</label>
          <input type="tel" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
            placeholder="(19) 99999-9999"
            className={cn("w-full p-4 rounded-2xl border transition-all duration-200 text-sm",
              theme.surface, theme.border, theme.text, theme.borderFocus, "focus:outline-none focus:ring-2 focus:ring-offset-0")} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className={cn("flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 border",
              theme.surface, theme.border, theme.surfaceAlt, theme.textSecondary)}>
            ← Voltar
          </button>
          <button type="submit"
            className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98]",
              theme.primary, theme.primaryHover, theme.primaryText)}>
            Criar Agendamento
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componentes compartilhados
// ---------------------------------------------------------------------------

function Section({ title, theme, children }: { title: string; theme: ThemeConfig; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={cn("text-xs font-medium mb-3 ml-1 uppercase tracking-wider", theme.textMuted)}>{title}</h3>
      {children}
    </div>
  );
}

function ResumeLine({ label, value, t, bold }: { label: string; value: string; t: ThemeConfig; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn("text-sm", t.textMuted)}>{label}</span>
      <span className={cn("text-sm", bold ? cn("font-bold", t.accent) : t.textSecondary)}>{value}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
