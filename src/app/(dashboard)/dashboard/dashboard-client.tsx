"use client";

import { useState, useEffect } from "react";
import type { ThemeConfig } from "@/lib/themes";

interface ScheduleAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "completed" | "cancelled";
  totalPrice: number | null;
  client: { name: string; phone: string };
  service: { name: string; durationMinutes: number };
  barber: { id: string; name: string };
}

interface CommissionEntry {
  barberId: string;
  barberName: string;
  totalAppointments: number;
  grossRevenue: number;
  commission: number;
}

export default function DashboardClient({
  theme,
  userRole,
}: {
  theme: ThemeConfig;
  userRole: string;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async (d: string) => {
    setLoading(true);
    try {
      const [schedRes, commRes] = await Promise.all([
        fetch(`/api/dashboard/schedule?date=${d}`),
        fetch(`/api/dashboard/commissions?date=${d}`)
      ]);
      if (schedRes.ok) setAppointments(await schedRes.json());
      if (commRes.ok) setCommissions(await commRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(date);
  }, [date]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/dashboard/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchSchedule(date);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeAppointments = appointments.filter(a => a.status !== "cancelled");
  const confirmed = appointments.filter((a) => a.status === "confirmed");
  const completed = appointments.filter((a) => a.status === "completed");
  const totalRevenue = appointments.reduce((sum, a) => a.status === "completed" ? sum + (a.totalPrice || 0) : sum, 0);

  // Formata a data para pt-BR
  const todayDateObj = new Date(date + "T12:00:00Z");
  const todayStr = todayDateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${theme.text}`}>
      {/* Header do dia e Seletor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight capitalize">{todayStr}</h1>
          <p className={`text-sm mt-1 ${theme.textMuted}`}>
            {userRole === "admin" ? "Visão geral de todos os barbeiros" : "Sua agenda do dia"}
          </p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border focus:ring-2 focus:outline-none transition-all [color-scheme:dark] ${theme.surface} ${theme.border} ${theme.borderFocus}`}
        />
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <MetricCard label="Agendados" value={confirmed.length.toString()} theme={theme} />
        <MetricCard label="Concluídos" value={completed.length.toString()} theme={theme} />
        <MetricCard label="Faturamento" value={`R$ ${totalRevenue.toFixed(2)}`} theme={theme} />
      </div>

      {/* Lista de agendamentos */}
      <div>
        <h2 className={`text-sm font-medium mb-3 ${theme.textMuted}`}>AGENDAMENTOS</h2>

        {loading ? (
          <div className={`text-center py-12 rounded-2xl border ${theme.surface} ${theme.border}`}>
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto opacity-50" />
          </div>
        ) : appointments.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border ${theme.surface} ${theme.border}`}>
            <p className={`text-sm ${theme.textMuted}`}>Nenhum agendamento para esta data.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${theme.surface} ${theme.border} ${apt.status === "cancelled" ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Time */}
                  <div className="flex-shrink-0 w-14 text-center">
                    <p className="text-lg font-bold tracking-tight">{apt.startTime}</p>
                  </div>

                  {/* Status indicator */}
                  <div
                    className={`flex-shrink-0 w-1.5 h-10 rounded-full ${
                      apt.status === "completed"
                        ? "bg-emerald-500"
                        : apt.status === "cancelled"
                        ? "bg-red-500"
                        : theme.primary
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{apt.client.name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {apt.service.name} • {apt.service.durationMinutes}min
                      {userRole === "admin" && ` • ${apt.barber.name}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${theme.accent}`}>R$ {apt.totalPrice?.toFixed(2) || "0.00"}</p>
                    {/* Botão de contato rápido no WhatsApp */}
                    {apt.status !== "cancelled" && (
                       <a href={`https://wa.me/55${apt.client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`text-xs flex items-center gap-1 hover:underline mt-0.5 ${theme.textMuted}`}>
                         WhatsApp <span className="text-[10px]">↗</span>
                       </a>
                    )}
                  </div>
                  
                  {/* Ações */}
                  <div className="flex gap-2">
                    {apt.status === "confirmed" && (
                      <>
                        <button onClick={() => updateStatus(apt.id, "cancelled")} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors`}>
                          Cancelar
                        </button>
                        <button onClick={() => updateStatus(apt.id, "completed")} className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-colors`}>
                          Concluir
                        </button>
                      </>
                    )}
                    {apt.status === "completed" && (
                      <span className="text-xs font-medium text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        Concluído
                      </span>
                    )}
                    {apt.status === "cancelled" && (
                      <span className="text-xs font-medium text-red-400 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                        Cancelado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comissões - visível apenas se houver comissões no dia */}
      {commissions.length > 0 && (
        <div className="pt-4">
          <h2 className={`text-sm font-medium mb-3 ${theme.textMuted}`}>RESUMO DE COMISSÕES (50%)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {commissions.map((comm) => (
                <div key={comm.barberId} className={`p-4 rounded-2xl border flex justify-between items-center ${theme.surface} ${theme.border}`}>
                   <div>
                      <p className="text-sm font-medium">{comm.barberName}</p>
                      <p className={`text-xs ${theme.textMuted}`}>{comm.totalAppointments} serviços finalizados</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-green-400 mb-0.5">Comissão</p>
                      <p className="font-bold text-sm">R$ {comm.commission.toFixed(2)}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, theme }: { label: string; value: string; theme: ThemeConfig }) {
  return (
    <div className={`p-4 rounded-2xl border ${theme.surface} ${theme.border}`}>
      <p className={`text-xs font-medium mb-1 ${theme.textMuted}`}>{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
