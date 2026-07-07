"use client";

// ---------------------------------------------------------------------------
// BookingClient — componente cliente do fluxo de agendamento
//
// Recebe dados da shop do Server Component (page.tsx) e gerencia
// o fluxo em 3 passos:
//   1. Escolha de profissional, serviço e data
//   2. Escolha de horário (busca em tempo real via /api/public/slots)
//   3. Confirmação com nome e WhatsApp
//
// Separado em arquivo próprio para manter page.tsx como Server Component puro,
// seguindo as regras de arquitetura do projeto (arquivos curtos e focados).
// ---------------------------------------------------------------------------

import { useState } from "react";
import type { ThemeConfig } from "@/lib/themes";
import type { Professional, ServiceItem, ShopPublicData } from "./page";

// ---------------------------------------------------------------------------
// Tipos locais
// ---------------------------------------------------------------------------

// Slot retornado pela API pública — apenas horário e disponibilidade
interface PublicSlot {
  time: string;
  endTime: string;
  available: boolean;
}

// ---------------------------------------------------------------------------
// Helper: concatena classes condicionalmente (sem dependência externa)
// ---------------------------------------------------------------------------

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function BookingClient({
  shop,
  theme,
}: {
  shop: ShopPublicData;
  theme: ThemeConfig;
}) {
  const [step, setStep] = useState(1);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [transition, setTransition] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Animação suave entre passos
  const goTo = (s: number) => {
    setTransition(true);
    setTimeout(() => {
      setStep(s);
      setTransition(false);
    }, 150);
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
            onClick={() => {
              setStep(1); setSubmitted(false); setSelectedPro(null);
              setSelectedService(null); setSelectedDate(""); setSelectedSlot(null);
              setClientName(""); setClientPhone("");
            }}
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
      {/* Cabeçalho com nome e endereço da barbearia */}
      <div className={cn("relative pt-12 pb-16 bg-gradient-to-b", theme.bgGradient)}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
        <div className="relative flex flex-col items-center px-6">
          <div className={cn("w-16 h-16 rounded-2xl mb-4 flex items-center justify-center text-2xl shadow-lg shadow-black/20 border", theme.surface, theme.border)}>
            💈
          </div>
          <h1 className="text-xl font-bold tracking-tight">{shop.name}</h1>
          {shop.address && (
            <p className={cn("text-sm mt-1", theme.textMuted)}>{shop.address}</p>
          )}
        </div>
      </div>

      {/* Indicador de passos */}
      <div className="px-6 -mt-4 relative z-10">
        <div className={cn("rounded-2xl border p-1 flex gap-1", theme.surface, theme.border)}>
          {["Profissional", "Horário", "Confirmar"].map((label, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 text-center py-2 rounded-xl text-xs font-medium transition-all duration-300",
                step > i + 1
                  ? cn(theme.primary, theme.primaryText)
                  : step === i + 1
                  ? cn(theme.surfaceAlt, theme.text, "shadow-sm")
                  : cn(theme.textMuted)
              )}
            >
              {step > i + 1 ? "✓" : i + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdo do passo atual */}
      <div className={cn("px-6 pb-12 max-w-md mx-auto transition-opacity duration-150", transition && "opacity-0")}>
        {step === 1 && (
          <StepProfessionals
            shop={shop}
            theme={theme}
            selectedPro={selectedPro}
            setSelectedPro={setSelectedPro}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            today={today}
            onNext={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <StepTimeSlots
            theme={theme}
            selectedPro={selectedPro!}
            selectedService={selectedService!}
            shopAlias={shop.alias} // alias da URL — usado na query da API pública de slots
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            onNext={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        )}
        {step === 3 && (
          <StepConfirm
            shop={shop}
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
            onBack={() => goTo(2)}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Profissional + Serviço + Data
// ---------------------------------------------------------------------------

function StepProfessionals({
  shop, theme, selectedPro, setSelectedPro, selectedService, setSelectedService,
  selectedDate, setSelectedDate, today, onNext,
}: {
  shop: ShopPublicData; theme: ThemeConfig;
  selectedPro: Professional | null; setSelectedPro: (p: Professional) => void;
  selectedService: ServiceItem | null; setSelectedService: (s: ServiceItem) => void;
  selectedDate: string; setSelectedDate: (d: string) => void;
  today: string; onNext: () => void;
}) {
  return (
    <div className="space-y-6 pt-6">
      {/* Seleção de profissional */}
      <Section title="Escolha o profissional" theme={theme}>
        <div className="grid grid-cols-2 gap-3">
          {shop.professionals.map((pro) => (
            <button
              key={pro.id}
              onClick={() => setSelectedPro(pro)}
              className={cn(
                "p-4 rounded-2xl border text-center transition-all duration-200",
                selectedPro?.id === pro.id
                  ? cn(theme.primary, "border-transparent shadow-lg scale-[1.02]")
                  : cn(theme.surface, theme.border, theme.surfaceAlt)
              )}
            >
              <div className={cn("w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold", theme.bg, theme.textSecondary)}>
                {pro.name[0]}
              </div>
              <p className="text-sm font-medium">{pro.name}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* Seleção de serviço — aparece após escolher o profissional */}
      {selectedPro && (
        <Section title="Escolha o serviço" theme={theme}>
          <div className="space-y-2">
            {shop.services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc)}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all duration-200",
                  selectedService?.id === svc.id
                    ? cn(theme.primary, "border-transparent shadow-lg")
                    : cn(theme.surface, theme.border, theme.surfaceAlt)
                )}
              >
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

      {/* Seleção de data — aparece após escolher o serviço */}
      {selectedService && (
        <Section title="Escolha o dia" theme={theme}>
          <input
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={cn(
              "w-full p-4 rounded-2xl border transition-all duration-200 [color-scheme:dark] font-medium text-sm",
              theme.surface, theme.border, theme.text, theme.borderFocus,
              "focus:outline-none focus:ring-2 focus:ring-offset-0"
            )}
          />
        </Section>
      )}

      {selectedDate && (
        <button
          onClick={onNext}
          className={cn("w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98]", theme.primary, theme.primaryHover, theme.primaryText)}
        >
          Avançar →
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Horários disponíveis (busca em tempo real)
//
// Ao montar este componente, dispara um fetch para /api/public/slots.
// O cliente vê:
//   - Slots livres: botão normal, clicável
//   - Slots ocupados: botão desabilitado, visual diferente (sem revelar quem agendou)
//   - Loading: spinner enquanto busca
//   - Erro: mensagem amigável com botão de retry
// ---------------------------------------------------------------------------

function StepTimeSlots({
  theme, selectedPro, selectedService, shopAlias,
  selectedDate, selectedSlot, setSelectedSlot, onNext, onBack,
}: {
  theme: ThemeConfig; selectedPro: Professional; selectedService: ServiceItem;
  shopAlias: string; selectedDate: string;
  selectedSlot: PublicSlot | null; setSelectedSlot: (s: PublicSlot) => void;
  onNext: () => void; onBack: () => void;
}) {
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Busca slots ao montar (ou ao clicar em retry)
  // Separado em função para permitir retry sem remover o componente
  const fetchSlots = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      // A API pública não requer autenticação — retorna apenas disponibilidade
      const params = new URLSearchParams({
        shopAlias,
        barberId: selectedPro.id,
        serviceId: selectedService.id,
        date: selectedDate,
      });

      const res = await fetch(`/api/public/slots?${params}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFetchError(data.error ?? "Erro ao carregar horários.");
        return;
      }

      const data: PublicSlot[] = await res.json();
      setSlots(data);
    } catch {
      setFetchError("Sem conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  // Carrega ao montar o componente (quando o usuário chega no passo 2)
  if (!loaded && !loading && !fetchError) {
    fetchSlots();
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-6 pt-6">
      {/* Cabeçalho do passo */}
      <div className="flex items-center gap-2">
        <h3 className={cn("text-sm font-medium", theme.textMuted)}>
          {formatDate(selectedDate)} · {selectedPro.name}
        </h3>
        <span className={cn("text-xs py-0.5 px-2 rounded-full", theme.surface, theme.border, theme.textMuted)}>
          {selectedService.durationMinutes}min
        </span>
      </div>

      {/* Estado: carregando */}
      {loading && (
        <div className={cn("text-center py-12 rounded-2xl border", theme.surface, theme.border)}>
          <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full mx-auto mb-3 opacity-50" />
          <p className={theme.textMuted}>Verificando disponibilidade...</p>
        </div>
      )}

      {/* Estado: erro com retry */}
      {fetchError && !loading && (
        <div className={cn("text-center py-10 rounded-2xl border", theme.surface, theme.border)}>
          <p className={cn("mb-4", theme.textMuted)}>{fetchError}</p>
          <button
            onClick={fetchSlots}
            className={cn("px-6 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200", theme.surface, theme.border, theme.surfaceAlt)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado: sem horários disponíveis */}
      {loaded && !loading && !fetchError && availableCount === 0 && slots.length === 0 && (
        <div className={cn("text-center py-12 rounded-2xl border", theme.surface, theme.border)}>
          <p className={theme.textMuted}>Nenhum horário disponível nesta data.</p>
        </div>
      )}

      {/* Lista de slots: livres e ocupados */}
      {loaded && !loading && !fetchError && slots.length > 0 && (
        <>
          {/* Legenda visual */}
          <div className="flex items-center gap-4 text-xs">
            <span className={cn("flex items-center gap-1.5", theme.textMuted)}>
              <span className={cn("w-3 h-3 rounded-sm inline-block", theme.surfaceAlt)} />
              Disponível ({availableCount})
            </span>
            <span className={cn("flex items-center gap-1.5 opacity-50", theme.textMuted)}>
              <span className="w-3 h-3 rounded-sm inline-block bg-current opacity-30" />
              Ocupado ({slots.length - availableCount})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.available && setSelectedSlot(slot)}
                disabled={!slot.available}
                title={slot.available ? `Disponível: ${slot.time}` : "Horário ocupado"}
                className={cn(
                  "p-4 rounded-xl border text-center text-sm font-medium transition-all duration-200",
                  // Slot selecionado
                  selectedSlot?.time === slot.time && slot.available
                    ? cn(theme.primary, "border-transparent shadow-lg scale-[1.02]", theme.primaryText)
                    // Slot disponível (não selecionado)
                    : slot.available
                    ? cn(theme.surface, theme.border, theme.surfaceAlt)
                    // Slot ocupado: desabilitado com visual claro para o cliente
                    : "opacity-40 cursor-not-allowed line-through bg-transparent border-dashed"
                )}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Botões de navegação */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className={cn("flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 border", theme.surface, theme.border, theme.surfaceAlt, theme.textSecondary)}
        >
          ← Voltar
        </button>
        <button
          onClick={onNext}
          disabled={!selectedSlot}
          className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed", theme.primary, theme.primaryHover, theme.primaryText)}
        >
          Avançar →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Confirmação com nome e WhatsApp do cliente
// ---------------------------------------------------------------------------

function StepConfirm({
  shop, theme, selectedPro, selectedService, selectedDate, selectedSlot,
  clientName, setClientName, clientPhone, setClientPhone, onSubmit, onBack,
}: {
  shop: ShopPublicData; theme: ThemeConfig; selectedPro: Professional; selectedService: ServiceItem;
  selectedDate: string; selectedSlot: PublicSlot;
  clientName: string; setClientName: (n: string) => void;
  clientPhone: string; setClientPhone: (p: string) => void;
  onSubmit: (e: React.FormEvent) => void; onBack: () => void;
}) {
  return (
    <div className="space-y-6 pt-6">
      <h3 className={cn("text-sm font-medium text-center", theme.textMuted)}>Revise e confirme</h3>

      {/* Resumo do agendamento */}
      <div className={cn("rounded-2xl p-5 space-y-3 border", theme.surface, theme.border)}>
        <ResumeLine label="Profissional" value={selectedPro.name} t={theme} />
        <ResumeLine label="Serviço" value={selectedService.name} t={theme} />
        <ResumeLine label="Dia" value={formatDate(selectedDate)} t={theme} />
        <ResumeLine label="Hora" value={`${selectedSlot.time} — ${selectedSlot.endTime}`} t={theme} />
        <div className={cn("pt-3 mt-3 border-t", theme.border)}>
          <ResumeLine label="Total" value={`R$ ${selectedService.price.toFixed(2)}`} t={theme} bold />
        </div>
      </div>

      {/* Formulário com dados mínimos do cliente */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={cn("block text-xs font-medium mb-1.5 ml-1", theme.textMuted)}>
            Nome Completo
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Seu nome completo"
            className={cn(
              "w-full p-4 rounded-2xl border transition-all duration-200 text-sm",
              theme.surface, theme.border, theme.text, theme.borderFocus,
              "focus:outline-none focus:ring-2 focus:ring-offset-0"
            )}
          />
        </div>
        <div>
          <label className={cn("block text-xs font-medium mb-1.5 ml-1", theme.textMuted)}>
            WhatsApp
          </label>
          <input
            type="tel"
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="(19) 99999-9999"
            className={cn(
              "w-full p-4 rounded-2xl border transition-all duration-200 text-sm",
              theme.surface, theme.border, theme.text, theme.borderFocus,
              "focus:outline-none focus:ring-2 focus:ring-offset-0"
            )}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className={cn("flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 border", theme.surface, theme.border, theme.surfaceAlt, theme.textSecondary)}
          >
            ← Voltar
          </button>
          <button
            type="submit"
            className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98]", theme.primary, theme.primaryHover, theme.primaryText)}
          >
            Criar Agendamento
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componentes auxiliares reutilizáveis
// ---------------------------------------------------------------------------

function Section({
  title, theme, children,
}: {
  title: string; theme: ThemeConfig; children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className={cn("text-xs font-medium mb-3 ml-1 uppercase tracking-wider", theme.textMuted)}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ResumeLine({
  label, value, t, bold,
}: {
  label: string; value: string; t: ThemeConfig; bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn("text-sm", t.textMuted)}>{label}</span>
      <span className={cn("text-sm", bold ? cn("font-bold", t.accent) : t.textSecondary)}>
        {value}
      </span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
