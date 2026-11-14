import { PageTitle } from "@/components/purple";
import { SectionTiles } from "@/components/section-tiles";
import { LangPage } from "@/components/shell";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { getLang, t } from "@/lib/i18n";
import { accessResponse } from "@/lib/ui/access";

export default async function ServicesPage() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  if (!has(actor, "lab.read") && !has(actor, "lab.create")) {
    return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  }
  return (
    <LangPage lang={lang}>
      <PageTitle title={d.servicesTitle} subtitle={d.servicesTagline} />
      <SectionTiles
        items={[
          { href: "/app/services/lab", label: d.centralLab, icon: "lab" },
          { label: "Soon", icon: "braces", soon: true },
          { label: "Soon", icon: "scan", soon: true },
          { label: "Soon", icon: "panorama", soon: true },
        ]}
      />
    </LangPage>
  );
}
