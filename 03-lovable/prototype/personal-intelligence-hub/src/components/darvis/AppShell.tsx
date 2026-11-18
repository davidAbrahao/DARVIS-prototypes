import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, MessageSquare, Brain, FolderKanban, CheckSquare, Plug, Settings, Menu, X } from "lucide-react";
import { Core } from "./ui";

const nav = [
  { to: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { to: "/assistant", label: "Assistente", icon: MessageSquare },
  { to: "/memory", label: "Memória", icon: Brain },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/integrations", label: "Integrações", icon: Plug },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r bg-sidebar p-4 transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center gap-3 px-2">
          <Core size={36} />
          <div>
            <p className="font-mono text-sm font-semibold tracking-[0.25em]">D.A.R.V.I.S.</p>
            <p className="label-mono !text-[9px]">Personal Intelligence</p>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="size-5" /></button>
        </div>
        <nav className="space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              activeOptions={{ exact: true }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground">
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-4 panel p-3">
          <p className="label-mono">Sistema</p>
          <p className="mt-1 text-xs text-muted-foreground">Fase 1 · Protótipo visual com dados fictícios</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-background/70 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 md:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="size-5" /></button>
          <span className="font-mono text-sm tracking-[0.25em]">D.A.R.V.I.S.</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
