import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">💈</div>
        <h1 className="text-3xl font-bold mb-2">AgendaClick</h1>
        <p className="text-zinc-400 mb-8">
          Plataforma de agendamento para barbearias.
          Simples, rápido, sem app.
        </p>
        <Link
          href="/barber-shop"
          className="inline-block px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-colors"
        >
          Ver demonstração →
        </Link>
        <p className="text-zinc-600 text-sm mt-6">
          Next.js • TypeScript • PostgreSQL • TDD
        </p>
      </div>
    </div>
  );
}
