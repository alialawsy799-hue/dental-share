import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

export function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-2">
      <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-plum">{title}</h1>
      <p className="mt-1 text-[14px] leading-6 text-muted">{subtitle}</p>
    </div>
  );
}

export function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-[22px] p-4 shadow-card ${className}`}>{children}</div>;
}

export function IconBadge({
  name,
  size = "md",
  tone = "soft",
  className = "",
}: {
  name: IconName;
  size?: "sm" | "md" | "lg";
  tone?: "soft" | "solid";
  className?: string;
}) {
  const box = size === "lg" ? "h-14 w-14 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4.5 w-4.5" : "h-5.5 w-5.5";
  const colors = tone === "solid" ? "btn-violet" : "bg-lavender-deep text-violet";
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${colors} ${className}`}>
      <Icon name={name} className={icon} />
    </span>
  );
}

export function SectionHead({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[19px] font-extrabold text-plum">{title}</h2>
        {hint ? <p className="text-[13px] text-muted">{hint}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="shrink-0 text-[13px] font-bold text-violet">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

export function Chevron({ lang }: { lang: "ar" | "en" }) {
  return <Icon name="chevron" className={`h-4 w-4 shrink-0 text-[#b7adcf] ${lang === "ar" ? "rotate-180" : ""}`} />;
}

export function StatusPill({ children, tone = "violet" }: { children: ReactNode; tone?: "violet" | "amber" | "green" | "rose" }) {
  const map = {
    violet: "bg-lavender-deep text-violet",
    amber: "bg-[#fff3df] text-[#b45309]",
    green: "bg-[#e3f7ec] text-[#15803d]",
    rose: "bg-[#fde8ec] text-[#c63d53]",
  };
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${map[tone]}`}>{children}</span>;
}

export function HeroTooth({ className = "" }: { className?: string }) {
  return (
    <img
      src="/brand/hero-tooth.png"
      alt=""
      width={931}
      height={797}
      className={`object-contain ${className}`}
      aria-hidden="true"
    />
  );
}

export function Avatar({ name, className = "h-16 w-16 text-xl" }: { name: string; className?: string }) {
  const initials = name
    .replace(/^د\.\s*/, "")
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] font-extrabold text-white shadow-[0_8px_18px_rgba(124,58,237,0.3)] ${className}`}>
      {initials}
    </span>
  );
}
