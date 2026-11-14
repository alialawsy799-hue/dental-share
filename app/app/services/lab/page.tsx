import Link from "next/link";
import { Chevron, PageTitle } from "@/components/purple";
import { LabRequestPanel } from "@/components/lab-request-panel";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { getLang, t } from "@/lib/i18n";
import { accessResponse } from "@/lib/ui/access";

export default async function LabSectionPage() {
  const actor = await requireActor();
  if (!has(actor, "lab.create") && !has(actor, "lab.read")) {
    return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  }
  const lang = await getLang();
  const d = t(lang);
  const clinic = getDb().clinics.find((item) => item.id === actor.clinicId);
  const clinicLocation = clinic ? `${clinic.name} — ${clinic.city} · ${clinic.district} · ${clinic.address}` : "موقع العيادة";
  return (
    <LangPage lang={lang}>
      <Link href="/app/services" className="mb-1 inline-flex items-center gap-1 text-[13px] font-bold text-violet">
        <Chevron lang={lang} />
        {d.servicesTitle}
      </Link>
      <PageTitle title={d.centralLab} subtitle={d.labRequestVia} />
      {has(actor, "lab.create") ? (
        <LabRequestPanel clinicLocation={clinicLocation} />
      ) : (
        <p className="mt-5 text-sm text-muted">عرض فقط. لا تملك صلاحية إنشاء طلب مختبر.</p>
      )}
    </LangPage>
  );
}
