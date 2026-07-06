"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTheme } from "@/lib/themes";

const t = getTheme("noir");

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou senha inválidos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${t.bg} ${t.text}`}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl border ${t.surface} ${t.border}`}>
            💈
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AgendaClick</h1>
          <p className={`text-sm mt-1 ${t.textMuted}`}>Acesse seu painel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1.5 ml-1 ${t.textMuted}`}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-4 rounded-2xl border text-sm transition-all duration-200 ${t.surface} ${t.border} ${t.text} focus:outline-none focus:ring-2 focus:ring-offset-0 ${t.borderFocus}`}
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1.5 ml-1 ${t.textMuted}`}>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 rounded-2xl border text-sm transition-all duration-200 ${t.surface} ${t.border} ${t.text} focus:outline-none focus:ring-2 focus:ring-offset-0 ${t.borderFocus}`}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg active:scale-[0.98] disabled:opacity-50 ${t.primary} ${t.primaryHover} ${t.primaryText}`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
