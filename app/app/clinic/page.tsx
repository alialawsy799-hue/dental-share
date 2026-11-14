import { type IconName } from "@/components/icons";
import { PageTitle } from "@/components/purple";
import { SectionTiles } from "@/components/section-tiles";
import { LangPage } from "@/components/shell";
import { requireActor } from "@/lib/demo/session";
import { has } from "@/lib/domain/guard";
import { getLang, t } from "@/lib/i18n";

export default async function ClinicHubPage() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const sections = (
    [
      { href: "/app/clinic/overview", label: d.hubOverview, icon: "building", show: true },
      { href: "/app/clinic/patients", label: d.patients, icon: "users", show: has(actor, "patients.read") },
      { href: "/app/clinic/appointments", label: d.bookings, icon: "calendar", show: has(actor, "appointments.manage") },
      { href: "/app/clinic/expenses", label: d.expenses, icon: "wallet", show: has(actor, "expenses.read") },
      { href: "/app/clinic/inventory", label: d.inventory, icon: "box", show: has(actor, "inventory.read") },
    ] satisfies { href: string; label: string; icon: IconName; show: boolean }[]
  ).filter((item) => item.show);

  return (
    <LangPage lang={lang}>
      <PageTitle title={d.clinicTitle} subtitle={d.clinicHubTagline} />
      <SectionTiles items={sections} />
    </LangPage>
  );
}
