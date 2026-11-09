export function ProductArt({ kind }: { kind: "impression" | "zirconia" | "burs" | "led" | "gloves" | "mask" }) {
  if (kind === "impression") {
    return (
      <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true">
        {([
          ["#2F6BFF", 18],
          ["#F4F7FB", 50],
          ["#7A5CFF", 82],
          ["#F06BB3", 114],
        ] as const).map(([color, x]) => (
          <g key={String(x)}>
            <rect x={x} y="18" width="26" height="72" rx="8" fill={color} />
            <rect x={x + 6} y="8" width="14" height="16" rx="4" fill={color === "#F4F7FB" ? "#D5DEE8" : color} />
            <rect x={x + 4} y="46" width="18" height="22" rx="3" fill="white" opacity="0.85" />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "zirconia") {
    return (
      <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true">
        <ellipse cx="78" cy="62" rx="34" ry="16" fill="#EEF3F7" />
        <ellipse cx="70" cy="54" rx="34" ry="16" fill="#F7FAFC" stroke="#E3EAF0" />
        <ellipse cx="104" cy="48" rx="30" ry="14" fill="#FFFFFF" stroke="#E3EAF0" />
      </svg>
    );
  }
  if (kind === "burs") {
    return (
      <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true">
        {["#C5CED6", "#49B6FF", "#F2C14E", "#E25B7A", "#8ED0FF", "#D5DDE4"].map((color, index) => (
          <g key={color} transform={`translate(${22 + index * 20} 18)`}>
            <rect x="6" y="28" width="6" height="52" rx="2" fill="#C9D2DA" />
            <rect x="4" y="8" width="10" height="24" rx="3" fill={color} />
            <circle cx="9" cy="8" r="5" fill="#9AA7B2" />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "led") {
    return (
      <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true">
        <path d="M18 78c22-6 36-28 42-46 4-12 16-18 28-14 14 4 20 22 12 36-10 18-8 34 6 42" fill="none" stroke="#1F2A37" strokeWidth="10" strokeLinecap="round" />
        <path d="M28 74c18-4 28-20 32-34" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="112" cy="34" r="6" fill="#111827" />
        <rect x="96" y="46" width="18" height="8" rx="3" fill="#E5E7EB" />
      </svg>
    );
  }
  if (kind === "gloves") {
    return (
      <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true">
        <rect x="48" y="22" width="64" height="70" rx="10" fill="#E8EEF5" />
        <path d="M62 48c8-16 18-16 22 0 4-16 14-16 20 2v28H62V48z" fill="#F8FBFD" stroke="#C5D0DC" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden="true">
      <path d="M40 58c8-22 72-22 80 0v24c-8 16-72 16-80 0V58z" fill="#F4F7FB" stroke="#D5DEE8" />
      <path d="M58 58c4-10 40-10 44 0" fill="none" stroke="#B7C3D0" />
    </svg>
  );
}
