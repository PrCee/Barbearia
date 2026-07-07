// ---------------------------------------------------------------------------
// Página pública de cancelamento de agendamento — /cancelar/[token]
//
// Acessível sem login. O cliente recebe o link por WhatsApp/mensagem
// e pode cancelar o agendamento diretamente nesta página.
//
// O token é validado no servidor via CancelAppointmentUseCase.
// ---------------------------------------------------------------------------

"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function CancelPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleCancel = async () => {
    setStatus("loading");

    try {
      const res = await fetch("/api/public/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelToken: params.token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Erro ao cancelar. Tente novamente.");
        return;
      }

      setStatus("success");
      setMessage("Agendamento cancelado com sucesso. O horário foi liberado.");
    } catch {
      setStatus("error");
      setMessage("Sem conexão. Verifique sua internet e tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-950 text-white">
      <div className="max-w-sm w-full text-center space-y-6">

        {/* Ícone */}
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl bg-neutral-900 border border-neutral-800">
          {status === "success" ? "✅" : status === "error" ? "❌" : "🗓️"}
        </div>

        {/* Título */}
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {status === "success" ? "Cancelamento Confirmado" :
             status === "error"   ? "Não foi possível cancelar" :
             "Cancelar Agendamento"}
          </h1>
          <p className="text-sm mt-2 text-neutral-400">
            {status === "idle"
              ? "Tem certeza que deseja cancelar? Esta ação não pode ser desfeita."
              : message}
          </p>
        </div>

        {/* Ação */}
        {status === "idle" && (
          <div className="space-y-3">
            <button
              onClick={handleCancel}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-red-600 hover:bg-red-700 transition-colors duration-200"
            >
              Sim, cancelar meu agendamento
            </button>
            <p className="text-xs text-neutral-500">
              O horário será liberado para outros clientes.
            </p>
          </div>
        )}

        {status === "loading" && (
          <div className="flex justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full opacity-60" />
          </div>
        )}

        {status === "success" && (
          <p className="text-sm text-neutral-400">
            Você pode agendar um novo horário a qualquer momento pelo link da barbearia.
          </p>
        )}

        {status === "error" && (
          <button
            onClick={() => setStatus("idle")}
            className="w-full py-3 rounded-xl text-sm border border-neutral-700 hover:border-neutral-600 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
