"use client";

import { useState } from "react";
import type { ThemeConfig } from "@/lib/themes";
import type { Professional, ServiceItem, ShopPublicData } from "./page";

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------

interface PublicSlot {
  time: string;
  endTime: string;
  available: boolean;
}

interface CreatedAppointmentResponse {
  id: string;
  startTime: string;
  endTime: string;
  cancelToken: string;
}

// ---------------------------------------------------------------------------
// Helper: concatena classes condicionalmente
// ---------------------------------------------------------------------------
function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Componente de Calendário Mensal Nativo (React)
// ---------------------------------------------------------------------------
function MonthlyCalendar({
  selectedDate,
  onChange,
  minDate,
  theme,
}: {
  selectedDate: string;
  onChange: (d: string) => void;
  minDate: string;
  theme: ThemeConfig;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isBeforeMinDate = (date: Date) => {
    const dStr = date.toISOString().split("T")[0];
    return dStr < minDate;
  };

  const isSelected = (date: Date) => {
    const dStr = date.toISOString().split("T")[0];
    return dStr === selectedDate;
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className={cn("w-full max-w-sm mx-auto p-4 rounded-3xl border shadow-sm", theme.surface, theme.border)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={handlePrevMonth}
          className={cn("w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors")}
        >
          &larr;
        </button>
        <div className="font-semibold text-[15px]">
          {monthNames[month]} {year}
        </div>
        <button
          onClick={handleNextMonth}
          className={cn("w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors")}
        >
          &rarr;
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((wd, i) => (
          <div key={i} className={cn("text-center text-[11px] font-semibold tracking-widest", theme.textMuted)}>
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-2 gap-x-1">
        {days.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="h-10" />;
          }
          
          const disabled = isBeforeMinDate(date);
          const selected = isSelected(date);
          
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(date.toISOString().split("T")[0])}
              className={cn(
                "h-10 w-full flex items-center justify-center rounded-full text-[15px] font-medium transition-all duration-200",
                disabled ? cn("opacity-30 cursor-not-allowed") : "",
                !disabled && !selected ? "hover:bg-black/5 dark:hover:bg-white/5 active:scale-95" : "",
                selected ? cn(theme.primary, theme.primaryText, "shadow-md scale-105") : ""
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function BookingClient({
  shop,
  theme,
  onClose,
}: {
  shop: ShopPublicData;
  theme: ThemeConfig;
  onClose?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelToken, setCancelToken] = useState<string | null>(null);
  const [transition, setTransition] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const goTo = (s: number) => {
    setTransition(true);
    setTimeout(() => {
      setStep(s);
      setTransition(false);
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedPro || !selectedService || !selectedSlot) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopAlias: shop.alias,
          barberId: selectedPro.id,
          serviceId: selectedService.id,
          date: selectedDate,
          startTime: selectedSlot.time,
          clientName,
          clientPhone,
        }),
      });

      const data: CreatedAppointmentResponse & { error?: string; type?: string } = await res.json();

      if (!res.ok) {
        if (data.type === "CONCURRENCY_CONFLICT") {
          setSubmitError(data.error ?? "Este horário acabou de ser reservado. Escolha outro.");
          goTo(2); // Volta para slots
          return;
        }
        setSubmitError(data.error ?? "Erro ao criar agendamento. Tente novamente.");
        return;
      }

      setCancelToken(data.cancelToken);
      setSubmitted(true);
    } catch {
      setSubmitError("Sem conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 font-sans", theme.bg, theme.text)}>
        <div className="text-center max-w-sm w-full animate-in fade-in zoom-in duration-500">
          <div className={cn("w-20 h-20 rounded-[24px] mx-auto mb-6 flex items-center justify-center text-3xl shadow-sm border", theme.surface, theme.border)}>
            ✅
          </div>
          <h2 className="text-2xl font-semibold mb-2 tracking-tight">Agendado!</h2>
          <p className={cn("mb-8 text-[15px]", theme.textMuted)}>Sua vaga está garantida.</p>

          <div className={cn("rounded-[24px] p-6 text-left space-y-4 mb-8 border shadow-sm", theme.surface, theme.border)}>
            <ResumeLine label="Profissional" value={selectedPro?.name ?? ""} t={theme} />
            <ResumeLine label="Serviço" value={selectedService?.name ?? ""} t={theme} />
            <ResumeLine label="Dia" value={formatDate(selectedDate)} t={theme} />
            <ResumeLine label="Hora" value={selectedSlot?.time ?? ""} t={theme} />
            <div className={cn("pt-4 mt-4 border-t", theme.border)}>
              <ResumeLine label="Total" value={`R$ ${selectedService?.price.toFixed(2)}`} t={theme} bold />
            </div>
          </div>

          {cancelToken && (
            <p className={cn("text-[13px] mb-8", theme.textMuted)}>
              Precisa cancelar?{" "}
              <a href={`/cancelar/${cancelToken}`} className="underline underline-offset-4 hover:text-red-400">
                Clique aqui
              </a>
            </p>
          )}

          <button
            onClick={() => window.location.reload()}
            className={cn("w-full py-4 rounded-[20px] font-semibold text-[15px] transition-all duration-200 border", theme.surface, theme.border, "hover:bg-black/5 dark:hover:bg-white/5")}
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col font-sans", theme.bg, theme.text)}>
      {/* Botão de Fechar no Topo */}
      {onClose && (
        <div className="flex justify-end p-4">
          <button 
            onClick={onClose}
            className={`w-9 h-9 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors backdrop-blur-md`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Indicador de passos Minimalista */}
      <div className="px-6 pt-2 mb-6">
        <div className={cn("rounded-full border p-1 flex gap-1", theme.surface, theme.border)}>
          {["Profissional", "Horário", "Confirmar"].map((label, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 text-center py-2 rounded-full text-[13px] font-semibold transition-all duration-300",
                step > i + 1
                  ? cn(theme.primary, theme.primaryText)
                  : step === i + 1
                  ? cn(theme.bg, theme.text, "shadow-sm border border-black/5 dark:border-white/5")
                  : cn(theme.textMuted)
              )}
            >
              {step > i + 1 ? "✓" : i + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo do passo atual */}
      <div className={cn("px-6 pb-24 max-w-md w-full mx-auto transition-opacity duration-200", transition && "opacity-0")}>
        {step === 1 && (
          <StepProfessionals
            shop={shop}
            theme={theme}
            selectedPro={selectedPro}
            setSelectedPro={setSelectedPro}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            onNext={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <StepDateTime
            theme={theme}
            selectedPro={selectedPro!}
            selectedService={selectedService!}
            shopAlias={shop.alias}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            today={today}
            onNext={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            theme={theme}
            selectedPro={selectedPro!}
            selectedService={selectedService!}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot!}
            clientName={clientName}
            setClientName={setClientName}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
            onBack={() => goTo(2)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo 1: Escolha do Profissional e Serviço
// ---------------------------------------------------------------------------
function StepProfessionals({
  shop, theme,
  selectedPro, setSelectedPro,
  selectedService, setSelectedService,
  onNext
}: {
  shop: ShopPublicData; theme: ThemeConfig;
  selectedPro: Professional | null; setSelectedPro: (p: Professional) => void;
  selectedService: ServiceItem | null; setSelectedService: (s: ServiceItem) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      
      <Section title="Escolha o Profissional" theme={theme}>
        <div className="grid grid-cols-3 gap-3">
          {shop.professionals.map((pro) => (
            <button
              key={pro.id}
              onClick={() => {
                setSelectedPro(pro);
                // Reseta próximos passos caso o usuário mude
                setSelectedService(null as any); 
              }}
              className={cn(
                "flex flex-col items-center p-3 rounded-[20px] border transition-all duration-200",
                selectedPro?.id === pro.id
                  ? cn(theme.primary, theme.primaryText, "shadow-md scale-105")
                  : cn(theme.surface, theme.border, "hover:bg-black/5 dark:hover:bg-white/5 active:scale-95")
              )}
            >
              <div className="w-12 h-12 rounded-full mb-2 overflow-hidden flex items-center justify-center text-lg font-bold bg-white/20">
                {pro.image ? <img src={pro.image} alt={pro.name} className="w-full h-full object-cover" /> : pro.name[0]}
              </div>
              <span className="text-[13px] font-semibold truncate w-full">{pro.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {selectedPro && (
        <Section title="Qual serviço?" theme={theme}>
          <div className="space-y-3">
            {shop.services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc)}
                className={cn(
                  "w-full flex items-center justify-between p-5 rounded-[24px] border text-left transition-all duration-200",
                  selectedService?.id === svc.id
                    ? cn(theme.primary, theme.primaryText, "shadow-md scale-[1.02]")
                    : cn(theme.surface, theme.border, "hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]")
                )}
              >
                <div>
                  <p className="font-semibold text-[15px]">{svc.name}</p>
                  <p className={cn("text-[13px] mt-1 opacity-80")}>{svc.durationMinutes} min</p>
                </div>
                <span className={cn("font-bold text-[16px]")}>R$ {svc.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {selectedService && (
        <button
          onClick={onNext}
          className={cn("w-full py-4 rounded-[20px] font-semibold text-[16px] transition-all shadow-sm active:scale-[0.98]", theme.primary, theme.primaryText)}
        >
          Continuar
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo 2: Calendário e Horários
// ---------------------------------------------------------------------------
function StepDateTime({
  theme, selectedPro, selectedService, shopAlias,
  selectedDate, setSelectedDate,
  selectedSlot, setSelectedSlot,
  today, onNext, onBack,
}: {
  theme: ThemeConfig; selectedPro: Professional; selectedService: ServiceItem;
  shopAlias: string; selectedDate: string; setSelectedDate: (d: string) => void;
  selectedSlot: PublicSlot | null; setSelectedSlot: (s: PublicSlot) => void;
  today: string; onNext: () => void; onBack: () => void;
}) {
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSlotsForDate = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null as any);
    setLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams({
        shopAlias,
        barberId: selectedPro.id,
        serviceId: selectedService.id,
        date: date,
      });

      const res = await fetch(`/api/public/slots?${params}`);
      if (!res.ok) throw new Error("Erro na busca");

      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setFetchError("Não foi possível carregar os horários.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <Section title="Escolha a Data" theme={theme}>
        <MonthlyCalendar 
          selectedDate={selectedDate}
          onChange={fetchSlotsForDate}
          minDate={today}
          theme={theme}
        />
      </Section>

      {selectedDate && (
        <Section title="Horários Livres" theme={theme}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-t-transparent border-black/20 dark:border-white/20 rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <div className={cn("p-6 text-center rounded-[24px] border", theme.surface, theme.border)}>
              <p className="text-sm text-red-500 mb-4">{fetchError}</p>
              <button onClick={() => fetchSlotsForDate(selectedDate)} className={cn("px-4 py-2 rounded-full text-sm", theme.bg, theme.text, theme.border, "border")}>
                Tentar novamente
              </button>
            </div>
          ) : slots.length === 0 ? (
            <div className={cn("p-6 text-center rounded-[24px] border", theme.surface, theme.border)}>
              <p className={cn("text-[14px]", theme.textMuted)}>Nenhum horário livre neste dia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.time === slot.time;
                return (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "py-3 rounded-[16px] text-[15px] font-semibold transition-all duration-200",
                      !slot.available
                        ? cn("opacity-30 cursor-not-allowed", theme.surface, theme.border, "border")
                        : isSelected
                        ? cn(theme.primary, theme.primaryText, "shadow-md scale-105")
                        : cn(theme.surface, theme.border, "border hover:bg-black/5 dark:hover:bg-white/5 active:scale-95")
                    )}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      )}

      <div className="flex gap-3 pt-4">
        <button onClick={onBack} className={cn("flex-1 py-4 rounded-[20px] font-semibold text-[15px] border hover:bg-black/5 dark:hover:bg-white/5 transition-colors", theme.surface, theme.border)}>
          Voltar
        </button>
        <button
          disabled={!selectedSlot}
          onClick={onNext}
          className={cn(
            "flex-1 py-4 rounded-[20px] font-semibold text-[15px] transition-all shadow-sm",
            !selectedSlot ? "opacity-50 cursor-not-allowed bg-black/10 dark:bg-white/10" : cn(theme.primary, theme.primaryText, "active:scale-[0.98]")
          )}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo 3: Confirmação e Dados do Cliente
// ---------------------------------------------------------------------------
function StepConfirm({
  theme, selectedPro, selectedService, selectedDate, selectedSlot,
  clientName, setClientName, clientPhone, setClientPhone,
  onSubmit, submitting, submitError, onBack,
}: {
  theme: ThemeConfig; selectedPro: Professional; selectedService: ServiceItem;
  selectedDate: string; selectedSlot: PublicSlot;
  clientName: string; setClientName: (n: string) => void;
  clientPhone: string; setClientPhone: (p: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean; submitError: string | null; onBack: () => void;
}) {
  const inputClass = cn(
    "w-full px-5 py-4 rounded-[20px] text-[15px] font-medium border transition-all duration-200 outline-none focus:ring-2 bg-transparent",
    theme.border, theme.borderFocus
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      
      <div className={cn("p-6 rounded-[28px] border shadow-sm", theme.surface, theme.border)}>
        <h3 className="font-semibold text-[18px] mb-4">Resumo</h3>
        <div className="space-y-4">
          <ResumeLine label="Serviço" value={selectedService.name} t={theme} />
          <ResumeLine label="Profissional" value={selectedPro.name} t={theme} />
          <ResumeLine label="Data" value={`${formatDate(selectedDate)} às ${selectedSlot.time}`} t={theme} />
          <div className={cn("pt-4 mt-4 border-t", theme.border)}>
            <ResumeLine label="Total" value={`R$ ${selectedService.price.toFixed(2)}`} t={theme} bold />
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className={cn("block text-[13px] font-semibold mb-2 ml-2 uppercase tracking-wide", theme.textMuted)}>Seu Nome</label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: João Silva"
            className={inputClass}
          />
        </div>

        <div>
          <label className={cn("block text-[13px] font-semibold mb-2 ml-2 uppercase tracking-wide", theme.textMuted)}>WhatsApp</label>
          <input
            type="tel"
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="Ex: 11999999999"
            className={inputClass}
          />
        </div>

        {submitError && (
          <div className="p-4 rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-500 text-[14px] font-medium text-center">
            {submitError}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className={cn("flex-1 py-4 rounded-[20px] font-semibold text-[15px] border hover:bg-black/5 dark:hover:bg-white/5 transition-colors", theme.surface, theme.border)}
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "flex-[2] py-4 rounded-[20px] font-semibold text-[15px] transition-all shadow-sm",
              submitting ? "opacity-50 cursor-wait" : cn(theme.primary, theme.primaryText, "active:scale-[0.98]")
            )}
          >
            {submitting ? "Agendando..." : "Confirmar Reserva"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers visuais
// ---------------------------------------------------------------------------
function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: ThemeConfig }) {
  return (
    <div>
      <h2 className={cn("text-[13px] font-semibold tracking-widest uppercase mb-4 text-center", theme.textMuted)}>{title}</h2>
      {children}
    </div>
  );
}

function ResumeLine({ label, value, bold, t }: { label: string; value: string; bold?: boolean; t: ThemeConfig }) {
  return (
    <div className="flex justify-between items-center text-[15px]">
      <span className={t.textSecondary}>{label}</span>
      <span className={cn(bold ? "font-bold text-[17px]" : "font-medium", t.text)}>{value}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
