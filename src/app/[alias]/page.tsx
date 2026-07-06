"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Professional {
  id: string;
  name: string;
  image: string;
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
// Dados mockados (serão substituídos pela API real)
// ---------------------------------------------------------------------------

const MOCK_PROFESSIONALS: Professional[] = [
  { id: "1", name: "Alexandre", image: "https://agendaclick.com.br/uploads/1707930624.jpeg" },
  { id: "2", name: "Bruno", image: "https://agendaclick.com.br/uploads/1707930738.jpeg" },
];

const MOCK_SERVICES: ServiceItem[] = [
  { id: "s1", name: "Barba", durationMinutes: 30, price: 35 },
  { id: "s2", name: "Corte Degradê", durationMinutes: 45, price: 50 },
  { id: "s3", name: "Barba + Corte", durationMinutes: 60, price: 75 },
];

const MOCK_SLOTS: Record<string, TimeSlot[]> = {
  "s1": [
    { time: "08:00", endTime: "08:30" },
    { time: "08:30", endTime: "09:00" },
    { time: "09:00", endTime: "09:30" },
    { time: "10:30", endTime: "11:00" },
    { time: "11:00", endTime: "11:30" },
  ],
  "s2": [
    { time: "08:00", endTime: "08:45" },
    { time: "09:00", endTime: "09:45" },
    { time: "10:30", endTime: "11:15" },
  ],
  "s3": [
    { time: "08:00", endTime: "09:00" },
    { time: "10:30", endTime: "11:30" },
  ],
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function BookingPage() {
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

  // ---- Tela de sucesso ----
  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Agendado com Sucesso</h2>
          <p className="text-zinc-400 mb-6">Obrigado por agendar conosco!</p>
          <div className="bg-zinc-900 rounded-xl p-4 text-left space-y-2 mb-6">
            <p><span className="text-zinc-500">Profissional:</span> {selectedPro?.name}</p>
            <p><span className="text-zinc-500">Serviço:</span> {selectedService?.name}</p>
            <p><span className="text-zinc-500">Dia:</span> {formatDate(selectedDate)}</p>
            <p><span className="text-zinc-500">Hora:</span> {selectedSlot?.time}</p>
            <p className="font-bold text-emerald-400 mt-2">
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
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors"
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  // ---- Fluxo de agendamento ----
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-b from-zinc-800 to-zinc-950">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-zinc-700 mb-3 flex items-center justify-center text-3xl">
            💈
          </div>
          <h1 className="text-xl font-bold">Barber Shop</h1>
          <p className="text-zinc-400 text-sm">Av. São Paulo, 123</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex justify-center gap-2 px-4 py-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full flex-1 max-w-16 transition-colors ${
              s <= step ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          />
        ))}
      </div>

      <div className="px-4 pb-8 max-w-md mx-auto">
        {/* STEP 1: Profissional + Serviço + Data */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Profissional */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Escolha o profissional</h3>
              <div className="grid grid-cols-2 gap-3">
                {MOCK_PROFESSIONALS.map((pro) => (
                  <button
                    key={pro.id}
                    onClick={() => setSelectedPro(pro)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedPro?.id === pro.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-700 mx-auto mb-2 flex items-center justify-center text-lg">
                      {pro.name[0]}
                    </div>
                    <p className="text-sm font-medium">{pro.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Serviço */}
            {selectedPro && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Escolha o serviço</h3>
                <div className="space-y-2">
                  {MOCK_SERVICES.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedService(svc)}
                      className={`w-full p-3 rounded-xl border text-left flex justify-between items-center transition-all ${
                        selectedService?.id === svc.id
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        <p className="text-xs text-zinc-500">{svc.durationMinutes} min</p>
                      </div>
                      <span className="font-bold text-emerald-400">
                        R$ {svc.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data */}
            {selectedService && (
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Escolha o dia</h3>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:border-emerald-500 focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            )}

            {/* Botão avançar */}
            {selectedDate && (
              <button
                onClick={handleNext}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors"
              >
                Avançar →
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Horário */}
        {step === 2 && selectedService && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400">
              Escolha a hora — {formatDate(selectedDate)}
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(MOCK_SLOTS[selectedService.id] || []).map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 rounded-xl border text-center text-sm transition-all ${
                    selectedSlot?.time === slot.time
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
              >
                ← Voltar
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedSlot}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avançar →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmação */}
        {step === 3 && selectedSlot && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400 text-center">
              Revise e Confirme
            </h3>

            {/* Resumo */}
            <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-500">Profissional</span>
                <span>{selectedPro?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Serviço</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dia</span>
                <span>{formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Hora</span>
                <span>{selectedSlot.time}</span>
              </div>
              <hr className="border-zinc-800" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-emerald-400">
                  R$ {selectedService?.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulário do cliente */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="(19) 99999-9999"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-zinc-700 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors"
                >
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
