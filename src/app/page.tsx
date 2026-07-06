import Link from "next/link";
import { getTheme } from "@/lib/themes";

const t = getTheme("noir");

export default function Home() {
  return (
    <div className={`min-h-screen ${t.bg} ${t.text} flex flex-col items-center justify-center p-6`}>
      <div className="text-center max-w-md w-full">
        <div className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl shadow-white/5 border ${t.surface} ${t.border}`}>
          💈
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-3">AgendaClick</h1>
        <p className={`mb-1 ${t.textSecondary}`}>
          Plataforma white-label de agendamento para barbearias.
        </p>
        <p className={`text-sm mb-12 ${t.textMuted}`}>
          O cliente agenda só com nome e WhatsApp. Sem app, sem fricção.
        </p>

        <div className="space-y-3">
          <Link
            href="/barber-shop"
            className={`block w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98] ${t.primary} ${t.primaryHover} ${t.primaryText}`}
          >
            Ver demonstração →
          </Link>
          <Link
            href="/temas"
            className={`block w-full py-4 rounded-2xl font-medium text-sm transition-all duration-200 border ${t.surface} ${t.border} ${t.surfaceAlt} ${t.textSecondary}`}
          >
            Explorar temas 🎨
          </Link>
        </div>

        <p className={`text-xs mt-12 ${t.accentMuted}`}>
          Next.js • TypeScript • PostgreSQL • 26 testes • TDD
        </p>
      </div>
    </div>
  );
}
