import Link from "next/link";
import type { ReactNode } from "react";
import { formatIqd } from "@/lib/domain/format";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-card border border-line bg-white p-4 shadow-card sm:p-5", className)}>{children}</section>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="mb-1 text-sm font-medium text-teal">{eyebrow}</p> : null}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, tone = "navy" }: { children: ReactNode; tone?: "navy" | "teal" | "warn" | "danger" | "mist" }) {
  const tones = {
    navy: "bg-navy/8 text-navy",
    teal: "bg-teal/12 text-success",
    warn: "bg-warning/12 text-warning",
    danger: "bg-danger/10 text-danger",
    mist: "bg-mist text-muted",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", tones[tone])}>{children}</span>;
}

export function statusTone(status: string): "navy" | "teal" | "warn" | "danger" | "mist" {
  if (["delivered", "arrived", "paid", "result_ready", "active", "published", "approved", "confirmed"].includes(status)) return "teal";
  if (["cancelled", "rejected", "no_show", "removed", "returned"].includes(status)) return "danger";
  if (["urgent", "unpaid", "needs_revision", "on_hold", "needs_info", "pending", "pending_review", "estimated"].includes(status)) return "warn";
  if (["closed"].includes(status)) return "mist";
  return "navy";
}

export const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/25";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted">{hint}</span> : null}
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function Denied({ message = "لا تملك صلاحية الوصول إلى هذا السجل." }: { message?: string }) {
  return (
    <div role="alert" className="rounded-card border border-danger/20 bg-white p-6 shadow-card">
      <p className="text-sm font-bold text-danger">غير مسموح</p>
      <h1 className="mt-2 text-2xl font-extrabold">هذه البيانات خارج صلاحيتك</h1>
      <p className="mt-2 text-sm leading-7 text-muted">{message}</p>
      <Link href="/app" className="mt-4 inline-flex h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white">
        العودة للرئيسية
      </Link>
    </div>
  );
}

export function Money({ value }: { value: number }) {
  return <span className="font-bold tabular-nums">{formatIqd(value)}</span>;
}

export function Timeline({ items }: { items: { at?: string; label: string; meta?: string }[] }) {
  if (!items.length) return <p className="text-sm text-muted">لا أحداث بعد.</p>;
  return (
    <ol className="space-y-0">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="relative border-s border-line py-3 ps-4">
          <span className="absolute -start-1.5 top-5 h-3 w-3 rounded-full border-2 border-white bg-teal" />
          <p className="text-sm font-bold leading-6">{item.label}</p>
          {item.meta ? <p className="text-xs text-muted">{item.meta}</p> : null}
          {item.at ? <p className="text-xs text-muted">{item.at}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="btn-violet inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold">
      {children}
    </Link>
  );
}

export function GhostLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-4 text-sm font-bold text-navy">
      {children}
    </Link>
  );
}

export function buttonClass(variant: "primary" | "ghost" | "danger" = "primary") {
  const base = "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold disabled:opacity-60";
  if (variant === "ghost") return cn(base, "border border-line bg-white text-navy");
  if (variant === "danger") return cn(base, "bg-danger text-white");
  return cn(base, "btn-violet");
}
