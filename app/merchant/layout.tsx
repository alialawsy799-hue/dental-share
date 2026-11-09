import { PortalShell } from "@/components/shell";
import { requireRoles } from "@/lib/demo/session";

export const dynamic = "force-dynamic";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(["merchant"]);
  return (
    <PortalShell
      title="لوحة المتجر"
      nav={[
        { href: "/merchant", label: "الطلبات" },
        { href: "/merchant/products", label: "المنتجات" },
        { href: "/merchant/reports", label: "التقرير" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
