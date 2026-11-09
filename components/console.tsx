import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

export function ConsoleCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[24px] border border-white/8 bg-[#1c1433] p-5 shadow-[0_18px_40px_rgba(8,4,20,0.35)] ${className}`}>
      {children}
    </section>
  );
}

export function KpiTile({
  icon,
  tone,
  value,
  label,
}: {
  icon: IconName;
  tone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-[22px] bg-[#251b42] px-3 py-4 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: tone }}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <p className="mt-3 text-[22px] font-extrabold leading-none text-white">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-[#9b8fb8]">{label}</p>
    </div>
  );
}

export function Gauge({ score, max = 1000 }: { score: number; max?: number }) {
  const ratio = Math.min(1, Math.max(0, score / max));
  const angle = ratio * 180;
  const label = score >= 700 ? "مرتفع" : score >= 400 ? "متوسط" : "منخفض";
  return (
    <div className="relative mx-auto mt-1 h-44 w-56">
      <svg viewBox="0 0 200 118" className="h-28 w-full" aria-hidden>
        <path d="M24 100 A76 76 0 0 1 176 100" fill="none" stroke="#2d2150" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M24 100 A76 76 0 0 1 176 100"
          fill="none"
          stroke="url(#gauge)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${ratio * 239} 239`}
        />
        <defs>
          <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="55%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <g transform={`rotate(${angle - 90} 100 100)`}>
          <rect x="97" y="36" width="6" height="22" rx="3" fill="white" />
        </g>
      </svg>
      <div className="text-center">
        <p className="text-[11px] font-bold text-[#9b8fb8]">النتيجة</p>
        <p className="text-[32px] font-extrabold leading-none text-white">{new Intl.NumberFormat("en-US").format(score)}</p>
        <span className="mt-2 inline-flex rounded-full bg-[#7c3aed] px-3 py-1 text-[11px] font-extrabold text-white">{label}</span>
      </div>
    </div>
  );
}

export function AreaChart({
  points,
  highlight,
}: {
  points: { key: string; value: number; label: string }[];
  highlight?: { key: string; caption: string };
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const width = 640;
  const height = 220;
  const padX = 28;
  const padY = 24;
  const coords = points.map((point, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (point.value / max) * (height - padY * 2);
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M${coords[0]?.x ?? 0},${height - padY} L${line} L${coords.at(-1)?.x ?? width},${height - padY} Z`;
  const mark = coords.find((point) => point.key === highlight?.key);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="ملخص النشاط الشهري">
      {[0.25, 0.5, 0.75, 1].map((tick) => (
        <line
          key={tick}
          x1={padX}
          x2={width - padX}
          y1={height - padY - tick * (height - padY * 2)}
          y2={height - padY - tick * (height - padY * 2)}
          stroke="#2d2150"
        />
      ))}
      <path d={area} fill="url(#area)" opacity="0.35" />
      <polyline points={line} fill="none" stroke="#a78bfa" strokeWidth="3" />
      {mark ? (
        <>
          <line x1={mark.x} x2={mark.x} y1={padY} y2={height - padY} stroke="#7c3aed" strokeDasharray="4 6" />
          <circle cx={mark.x} cy={mark.y} r="6" fill="#7c3aed" stroke="white" strokeWidth="3" />
          <rect x={mark.x - 58} y={Math.max(6, mark.y - 48)} width="116" height="36" rx="12" fill="#7c3aed" />
          <text x={mark.x} y={Math.max(20, mark.y - 34)} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
            {highlight?.caption}
          </text>
          <text x={mark.x} y={Math.max(36, mark.y - 18)} textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
            {new Intl.NumberFormat("en-US").format(mark.value)}
          </text>
        </>
      ) : null}
      {coords.map((point) => (
        <text key={point.key} x={point.x} y={height - 6} textAnchor="middle" fill="#9b8fb8" fontSize="11">
          {point.label}
        </text>
      ))}
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#1c1433" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Donut({
  slices,
  total,
}: {
  slices: { label: string; value: number; color: string }[];
  total: number;
}) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#2d2150" strokeWidth="14" />
          {slices.map((slice) => {
            const len = (slice.value / Math.max(total, 1)) * circ;
            const dash = `${len} ${circ - len}`;
            const current = offset;
            offset += len;
            return (
              <circle
                key={slice.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-current}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <p className="text-[11px] font-bold text-[#9b8fb8]">المجموع</p>
          <p className="text-xl font-extrabold text-white">{new Intl.NumberFormat("en-US").format(total)}</p>
        </div>
      </div>
      <ul className="grid gap-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-[#d9ccff]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
            {slice.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniRing({ value }: { value: number }) {
  const ratio = Math.min(1, Math.max(0, value / 100));
  const circ = 2 * Math.PI * 16;
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <circle cx="20" cy="20" r="16" fill="none" stroke="#2d2150" strokeWidth="5" />
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="5"
        strokeDasharray={`${ratio * circ} ${circ}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}
