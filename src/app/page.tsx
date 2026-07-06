import Link from "next/link";
import { THEMES, type ThemeId } from "@/lib/themes";

const DEMOS: { alias: string; name: string; theme: ThemeId }[] = [
  { alias: "barber-shop", name: "Barber Shop", theme: "classic-dark" },
  { alias: "barbearia-premium", name: "Premium", theme: "warm-gold" },
  { alias: "urban-cut", name: "Urban Cut", theme: "urban-slate" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-lg w-full">
        <div className="text-6xl mb-6">💈</div>
        <h1 className="text-3xl font-bold mb-2">AgendaClick</h1>
        <p className="text-zinc-400 mb-2">
          Plataforma white-label de agendamento para barbearias.
        </p>
        <p className="text-zinc-600 text-sm mb-8">
          Simples, rápido, sem app. O cliente agenda só com nome e WhatsApp.
        </p>

        <div className="space-y-3 mb-8">
          <p className="text-sm text-zinc-500 uppercase tracking-wider">Demonstrações por tema</p>
          {DEMOS.map((demo) => {
            const t = THEMES[demo.theme];
            return (
              <Link
                key={demo.alias}
                href={`/${demo.alias}`}
                className="block w-full"
              >
                <div className={`flex items-center justify-between p-4 rounded-xl border ${t.border} ${t.surface} ${t.surfaceHover} transition-colors text-left`}>
                  <div>
                    <p className={`font-medium ${t.text}`}>{demo.name}</p>
                    <p className={`text-xs ${t.textMuted}`}>{t.label}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={`w-4 h-4 rounded-full ${t.primary}`} />
                    <span className={`w-4 h-4 rounded-full ${t.bg} border ${t.border}`} />
                    <span className={`w-4 h-4 rounded-full ${t.surface}`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-zinc-600 text-xs">
          Next.js • TypeScript • PostgreSQL • 26 testes • TDD
        </p>
      </div>
    </div>
  );
}
