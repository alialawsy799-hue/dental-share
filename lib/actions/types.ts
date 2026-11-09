export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | null;

export function safeReturn(value: FormDataEntryValue | null, fallback: string): string {
  const path = String(value ?? "");
  const allowed = ["/app", "/lab", "/merchant", "/provider", "/admin", "/desk"];
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  if (!allowed.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return fallback;
  return path.split("?")[0] || fallback;
}
