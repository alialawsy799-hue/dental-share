import { PortalShell } from "@/components/shell";
import { requireRoles } from "@/lib/demo/session";

export const dynamic = "force-dynamic";

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["provider"]);
  return <PortalShell title="مزود الخدمة" nav={[{ href: "/provider", label: "الطلبات" }]}>{children}</PortalShell>;
}
