import Link from "next/link";
import { type IconName } from "@/components/icons";
import { IconBadge, PageTitle } from "@/components/purple";
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
      <div className="mt-5 grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="glass flex aspect-square flex-col items-center justify-center rounded-[22px] p-4 text-center shadow-card"
          >
            <IconBadge name={section.icon} size="lg" />
            <h2 className="mt-4 text-[16px] font-extrabold leading-5 text-plum">{section.label}</h2>
          </Link>
        ))}
      </div>
    </LangPage>
  );
}
