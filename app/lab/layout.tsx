import { PortalShell } from "@/components/shell";
import { requireRoles } from "@/lib/demo/session";
import type { Role } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const roles: Role[] = ["lab_manager", "lab_technician"];

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(roles);
  return (
    <PortalShell
      title="المختبر المركزي"
      nav={[
        { href: "/lab", label: "الوارد" },
        { href: "/lab/billing", label: "الفواتير" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
