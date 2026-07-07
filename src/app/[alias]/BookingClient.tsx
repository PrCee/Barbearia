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

// Resposta da API de criação de agendamento
interface CreatedAppointmentResponse {
  id: string;
  startTime: string;
  endTime: string;
  cancelToken: string;
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

  // Animação suave entre passos
  const goTo = (s: number) => {
    setTransition(true);
    setTimeout(() => {
      setStep(s);
      setTransition(false);
    }, 150);
  };

  // Envia o agendamento para a API real e salva no banco
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
        // Se conflito de concorrência, volta para a tela de slots para o cliente escolher outro
        if (data.type === "CONCURRENCY_CONFLICT") {
          setSubmitError(data.error ?? "Este horário acabou de ser reservado. Escolha outro.");
          goTo(2);
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

  // ---- Tela de sucesso ----
  if (submitted) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6", theme.bg, theme.text)}>
        <div className="text-center max-w-sm w-full animate-in fade-in zoom-in duration-500">
          <div className={cn("w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl", theme.surface, "ring-2 ring-green-500/20")}>
            ✅
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Agendado com Sucesso</h2>
          <p className={cn("mb-6", theme.textMuted)}>Obrigado por agendar conosco!</p>

          <div className={cn("rounded-2xl p-5 text-left space-y-3 mb-6 border", theme.surface, theme.border)}>
            <ResumeLine label="Profissional" value={selectedPro?.name ?? ""} t={theme} />
            <ResumeLine label="Serviço" value={selectedService?.name ?? ""} t={theme} />
            <ResumeLine label="Dia" value={formatDate(selectedDate)} t={theme} />
            <ResumeLine label="Hora" value={selectedSlot?.time ?? ""} t={theme} />
            <div className={cn("pt-3 mt-3 border-t", theme.border)}>
              <ResumeLine label="Total" value={`R$ ${selectedService?.price.toFixed(2)}`} t={theme} bold />
            </div>
          </div>

          {/* Link de cancelamento — permite o cliente cancelar sem login */}
          {cancelToken && (
            <p className={cn("text-xs mb-6", theme.textMuted)}>
              Precisa cancelar?{" "}
              <a
                href={`/cancelar/${cancelToken}`}
                className="underline underline-offset-2 hover:opacity-80"
              >
                Clique aqui para cancelar este agendamento
              </a>
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={() => {
                setStep(1); setSubmitted(false); setSelectedPro(null);
                setSelectedService(null); setSelectedDate(""); setSelectedSlot(null);
                setClientName(""); setClientPhone(""); setCancelToken(null);
              }}
              className={cn("w-full py-3.5 rounded-xl font-medium transition-all duration-200 border", theme.surface, theme.surfaceAlt, theme.border, theme.text)}
            >
              Novo Agendamento
            </button>
            {onClose && (
               <button
                 onClick={onClose}
                 className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${theme.primary} ${theme.primaryHover} ${theme.primaryText}`}
               >
                 Voltar para o Início
               </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Fluxo de agendamento ----
  return (
    <div className={cn("min-h-screen flex flex-col", theme.bg, theme.text)}>
      {/* Botão de Fechar no Topo (Mobile Modal Style) */}
      {onClose && (
        <div className="flex justify-end p-4">
          <button 
            onClick={onClose}
            className={`w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors backdrop-blur-md border ${theme.border}`}
          >
            ✕
          </button>
        </div>
      )}

      {/* Indicador de passos */}
      <div className="px-6 pt-2">
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
      <div className={cn("px-6 pb-24 max-w-md mx-auto transition-opacity duration-150", transition && "opacity-0")}>
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
            shopAlias={shop.alias}
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
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>

      {/* Botão flutuante de WhatsApp — contato direto com a barbearia */}
      {shop.phone && (
        <a
          href={`https://wa.me/${shop.phone.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Gostaria de mais informações sobre agendamentos.")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/40 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Profissional + Serviço + Data
// ---------------------------------------------------------------------------

// Professional agora inclui campo opcional de imagem
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
              {/* Foto do barbeiro — exibe imagem se disponível, inicial do nome como fallback */}
              <div className={cn("w-14 h-14 rounded-xl mx-auto mb-2 overflow-hidden flex items-center justify-center text-lg font-bold", theme.bg, theme.textSecondary)}>
                {pro.image ? (
                  <img src={pro.image} alt={pro.name} className="w-full h-full object-cover" />
                ) : (
                  pro.name[0]
                )}
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
  submitting, submitError,
}: {
  shop: ShopPublicData; theme: ThemeConfig; selectedPro: Professional; selectedService: ServiceItem;
  selectedDate: string; selectedSlot: PublicSlot;
  clientName: string; setClientName: (n: string) => void;
  clientPhone: string; setClientPhone: (p: string) => void;
  onSubmit: (e: React.FormEvent) => void; onBack: () => void;
  submitting: boolean; submitError: string | null;
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

        {/* Mensagem de erro do POST */}
        {submitError && (
          <p className="text-sm text-red-400 text-center px-2">{submitError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className={cn("flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 border disabled:opacity-50", theme.surface, theme.border, theme.surfaceAlt, theme.textSecondary)}
          >
            ← Voltar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn("flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed", theme.primary, theme.primaryHover, theme.primaryText)}
          >
            {submitting ? "Agendando..." : "Criar Agendamento"}
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
