export function Mark({ size = 40, title = "Dental Share" }: { size?: number; title?: string }) {
  return (
    <img
      src="/brand/logo-mark.png"
      alt={title}
      width={789}
      height={692}
      className="object-contain"
      style={{ width: size, height: "auto" }}
    />
  );
}

export function AppLogo({ compact = false }: { tone?: "onLight" | "onDark"; compact?: boolean }) {
  if (compact) return <Mark size={36} />;
  return (
    <img
      src="/brand/logo-lockup.png"
      alt="Dental Share"
      width={982}
      height={401}
      className="h-12 w-auto object-contain object-right"
    />
  );
}

export function BrandLockup({ compact = false }: { tone?: "onLight" | "onDark"; compact?: boolean }) {
  if (compact) return <Mark size={40} />;
  return (
    <img
      src="/brand/logo-lockup.png"
      alt="Dental Share"
      width={982}
      height={401}
      className="h-14 w-auto object-contain"
    />
  );
}
