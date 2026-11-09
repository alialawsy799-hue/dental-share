import { PortalShell } from "@/components/shell";
import { requireRoles } from "@/lib/demo/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["platform_admin"]);
  return (
    <PortalShell
      title="إدارة المنصة"
      accent="pill"
      nav={[
        { href: "/admin", label: "نظرة عامة", icon: "bolt" },
        { href: "/admin/clinics", label: "العيادات", icon: "building" },
        { href: "/admin/approvals", label: "الاعتمادات", icon: "check" },
        { href: "/admin/moderation", label: "الإشراف", icon: "shield" },
        { href: "/admin/support", label: "الدعم", icon: "chat" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
