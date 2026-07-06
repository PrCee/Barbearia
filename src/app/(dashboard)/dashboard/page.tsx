import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTheme } from "@/lib/themes";

// ---------------------------------------------------------------------------
// Mock data — será substituído pelo GetBarberScheduleUseCase com banco real
// ---------------------------------------------------------------------------

interface AppointmentMock {
  id: string;
  time: string;
  clientName: string;
  service: string;
  price: number;
  status: "confirmed" | "completed" | "cancelled";
}

const MOCK_APPOINTMENTS: AppointmentMock[] = [
  { id: "1", time: "08:00", clientName: "Carlos Silva", service: "Barba", price: 35, status: "completed" },
  { id: "2", time: "08:30", clientName: "João Santos", service: "Corte Degradê", price: 50, status: "completed" },
  { id: "3", time: "09:30", clientName: "Pedro Alves", service: "Barba + Corte", price: 75, status: "confirmed" },
  { id: "4", time: "10:30", clientName: "Lucas Mendes", service: "Barba", price: 35, status: "confirmed" },
  { id: "5", time: "11:00", clientName: "Rafael Costa", service: "Corte Degradê", price: 50, status: "confirmed" },
  { id: "6", time: "14:00", clientName: "Marcos Lima", service: "Barba + Corte", price: 75, status: "confirmed" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as { name: string; role: string };
  const theme = getTheme("amber");
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const confirmed = MOCK_APPOINTMENTS.filter((a) => a.status === "confirmed");
  const completed = MOCK_APPOINTMENTS.filter((a) => a.status === "completed");
  const totalRevenue = MOCK_APPOINTMENTS.reduce((sum, a) => a.status !== "cancelled" ? sum + a.price : sum, 0);

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${theme.text}`}>
      {/* Header do dia */}
      <div>
        <h1 className="text-xl font-bold tracking-tight capitalize">{today}</h1>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>
          {user.role === "admin" ? "Visão geral de todos os barbeiros" : "Sua agenda do dia"}
        </p>
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

        {MOCK_APPOINTMENTS.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl border ${theme.surface} ${theme.border}`}>
            <p className={`text-sm ${theme.textMuted}`}>Nenhum agendamento hoje.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_APPOINTMENTS.map((apt) => (
              <div
                key={apt.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${theme.surface} ${theme.border}`}
              >
                {/* Time */}
                <div className="flex-shrink-0 w-14 text-center">
                  <p className="text-lg font-bold tracking-tight">{apt.time}</p>
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
                  <p className="text-sm font-medium truncate">{apt.clientName}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{apt.service}</p>
                </div>

                {/* Price + status */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${theme.accent}`}>R$ {apt.price.toFixed(2)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      apt.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : apt.status === "cancelled"
                        ? "bg-red-500/10 text-red-400"
                        : `bg-white/5 ${theme.textMuted}`
                    }`}
                  >
                    {apt.status === "confirmed" ? "Confirmado" : apt.status === "completed" ? "Concluído" : "Cancelado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card de métrica
// ---------------------------------------------------------------------------

function MetricCard({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof getTheme> }) {
  return (
    <div className={`p-4 rounded-2xl border ${theme.surface} ${theme.border}`}>
      <p className={`text-xs ${theme.textMuted}`}>{label}</p>
      <p className="text-xl font-bold mt-1 tracking-tight">{value}</p>
    </div>
  );
}
