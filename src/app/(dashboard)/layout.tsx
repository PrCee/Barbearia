import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTheme } from "@/lib/themes";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as { name: string; email: string; role: string; shopId: string };
  const t = getTheme("amber"); // será dinâmico: busca shopId → theme

  const navItems = [
    { href: "/dashboard", label: "Agenda", icon: "📅" },
    { href: "/dashboard/barbers", label: "Barbeiros", icon: "👤", admin: true },
    { href: "/dashboard/services", label: "Serviços", icon: "✂️", admin: true },
    { href: "/dashboard/settings", label: "Configurações", icon: "⚙️", admin: true },
  ];

  return (
    <div className={`min-h-screen flex ${t.bg} ${t.text}`}>
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${t.surface} ${t.border}`}>
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${t.bg} ${t.border}`}>
              💈
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">AgendaClick</p>
              <p className={`text-xs ${t.textMuted}`}>{user.role === "admin" ? "Administrador" : "Barbeiro"}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems
            .filter((item) => !item.admin || user.role === "admin")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${t.surfaceAlt} ${t.textSecondary}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className={`px-4 py-3 rounded-xl ${t.bg}`}>
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className={`text-xs truncate ${t.textMuted}`}>{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile header + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`md:hidden flex items-center justify-between p-4 border-b ${t.surface} ${t.border}`}>
          <div className="flex items-center gap-2">
            <span>💈</span>
            <span className="font-bold text-sm">AgendaClick</span>
          </div>
          <span className={`text-xs py-1 px-2 rounded-lg ${t.surface} ${t.textMuted}`}>{user.name}</span>
        </header>

        {/* Mobile nav */}
        <nav className={`md:hidden flex gap-1 p-2 border-b ${t.surface} ${t.border} overflow-x-auto`}>
          {navItems
            .filter((item) => !item.admin || user.role === "admin")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium ${t.surfaceAlt} ${t.textSecondary}`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
