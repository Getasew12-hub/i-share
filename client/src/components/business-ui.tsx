import type { ReactNode } from "react";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, StatusBadge, Surface } from "./ui";

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="page-surface">
      <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: typeof Circle;
  tone?: "primary" | "secondary" | "success" | "warning";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/20 text-secondary-foreground",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <span className={`flex size-10 items-center justify-center rounded-xl ${toneClass}`}><Icon aria-hidden="true" size={19} /></span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-[-0.03em]">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </Surface>
  );
}

export function ActionTile({
  to,
  label,
  description,
  icon: Icon,
}: {
  to: string;
  label: string;
  description: string;
  icon: typeof Circle;
}) {
  return (
    <Link className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" to={to}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><Icon aria-hidden="true" size={18} /></span>
      <span className="min-w-0 flex-1"><span className="block font-bold group-hover:text-primary">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span>
      <ArrowUpRight aria-hidden="true" className="text-muted-foreground group-hover:text-primary" size={17} />
    </Link>
  );
}

export function StepRail({
  steps,
  current,
}: {
  steps: Array<{ label: string; description: string; complete: boolean }>;
  current: number;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => (
        <div className={`rounded-xl border p-4 ${index === current ? "border-primary bg-primary/5" : "border-border bg-surface"}`} key={step.label}>
          <div className="flex items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-full text-xs font-black ${step.complete ? "bg-primary text-primary-foreground" : index === current ? "border border-primary text-primary" : "bg-muted text-muted-foreground"}`}>{step.complete ? <Check aria-hidden="true" size={14} /> : index + 1}</span><span className="text-sm font-bold">{step.label}</span></div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

export function WorkspaceStatus({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }) {
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
