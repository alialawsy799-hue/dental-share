import { PortalShell } from "@/components/shell";
import { requireRoles } from "@/lib/demo/session";

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["clinic_desk"]);
  return (
    <PortalShell
      title="نظام العيادة"
      nav={[
        { href: "/desk", label: "الرئيسية", icon: "home" },
        { href: "/desk/patients", label: "تسجيل المريض", icon: "users" },
        { href: "/desk/book", label: "الحجز", icon: "calendar" },
        { href: "/desk/expenses", label: "الصرفيات", icon: "wallet" },
        { href: "/desk/inventory", label: "المخزن", icon: "box" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
