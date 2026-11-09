import { ClinicHubNav } from "@/components/clinic-hub-nav";
import { requireActor } from "@/lib/demo/session";
import { has } from "@/lib/domain/guard";
import { getLang, t } from "@/lib/i18n";

export default async function ClinicSectionLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const items = [
    { href: "/app/clinic", label: d.hubOverview, show: true },
    { href: "/app/clinic/patients", label: d.patients, show: has(actor, "patients.read") },
    { href: "/app/clinic/appointments", label: d.bookings, show: has(actor, "appointments.manage") },
    { href: "/app/clinic/expenses", label: d.expenses, show: has(actor, "expenses.read") },
    { href: "/app/clinic/inventory", label: d.inventory, show: has(actor, "inventory.read") },
    { href: "/app/clinic/purchases", label: d.purchases, show: has(actor, "purchases.read") },
  ].filter((item) => item.show);
  return (
    <>
      <ClinicHubNav items={items.map(({ href, label }) => ({ href, label }))} />
      {children}
    </>
  );
}
