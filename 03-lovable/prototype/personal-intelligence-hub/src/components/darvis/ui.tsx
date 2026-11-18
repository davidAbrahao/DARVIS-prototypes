import type { ReactNode } from "react";
import type { Status } from "@/lib/darvis-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<Status, string> = {
  implementado: "text-success border-success/40 bg-success/10",
  simulado: "text-warning border-warning/40 bg-warning/10",
  planejado: "text-muted-foreground border-border bg-muted",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", statusStyles[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Panel({ title, status, action, children, className }: { title?: string; status?: Status; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-5", className)}>
      {(title || status) && (
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="label-mono">{title}</h2>
          <div className="flex items-center gap-2">{action}{status && <StatusBadge status={status} />}</div>
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ eyebrow, title, desc, status }: { eyebrow: string; title: string; desc?: string; status?: Status }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label-mono text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {desc && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {status && <StatusBadge status={status} />}
    </div>
  );
}

export function Core({ size = 64 }: { size?: number }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div className="animate-ring absolute inset-0 rounded-full border border-dashed border-primary/40" />
      <div className="absolute inset-[18%] rounded-full border border-primary/30" />
      <div className="animate-core absolute inset-[28%] rounded-full" style={{ background: "var(--gradient-core)" }} />
      <div className="size-[14%] rounded-full bg-primary glow" />
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
    </div>
  );
}
