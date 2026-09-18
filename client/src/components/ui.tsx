import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Inbox } from "lucide-react";

const buttonStyles = {
  primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85",
  quiet: "border border-border bg-surface text-foreground hover:bg-muted",
  danger: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonStyles;
}) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Surface({
  children,
  className = "",
  as: Component = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Component className={`surface-card ${className}`}>{children}</Component>;
}

const statusStyles = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  warning: "bg-amber-50 text-amber-800 ring-amber-700/15",
  danger: "bg-red-50 text-red-800 ring-red-700/15",
  info: "bg-sky-50 text-sky-800 ring-sky-700/15",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof statusStyles;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function AsyncState({
  type,
  title,
  message,
}: {
  type: "loading" | "error" | "empty" | "success";
  title: string;
  message?: string;
}) {
  const Icon =
    type === "error" ? AlertCircle : type === "empty" ? Inbox : CheckCircle2;

  if (type === "loading") {
    return (
      <div className="grid gap-3" aria-label={title} role="status">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center ${
        type === "error" ? "border-red-200 bg-red-50/60" : "border-border bg-surface"
      }`}
      role={type === "error" ? "alert" : undefined}
    >
      <Icon
        aria-hidden="true"
        className={type === "error" ? "text-destructive" : "text-primary"}
        size={28}
      />
      <h2 className="mt-3 text-base font-bold">{title}</h2>
      {message && <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
