import { PageTitle } from "@/components/purple";
import { SectionTiles } from "@/components/section-tiles";
import { LangPage } from "@/components/shell";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { STORE_DEPARTMENT_ICONS } from "@/lib/domain/store-departments";
import { getLang, t } from "@/lib/i18n";
import { accessResponse } from "@/lib/ui/access";

export default async function StoresHubPage() {
  const actor = await requireActor();
  if (!has(actor, "commerce.buy")) return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  const lang = await getLang();
  const d = t(lang);
  return (
    <LangPage lang={lang}>
      <PageTitle title={d.storesTitle} subtitle={d.storesTagline} />
      <SectionTiles
        items={[
          { href: "/app/stores/disposable", label: d.storeDeptDisposable, icon: STORE_DEPARTMENT_ICONS.disposable },
          { href: "/app/stores/fillings", label: d.storeDeptFillings, hint: d.storeDeptFillingsHint, icon: STORE_DEPARTMENT_ICONS.fillings },
          { href: "/app/stores/prostho", label: d.storeDeptProstho, icon: STORE_DEPARTMENT_ICONS.prostho },
          { href: "/app/stores/surgical", label: d.storeDeptSurgical, icon: STORE_DEPARTMENT_ICONS.surgical },
        ]}
      />
    </LangPage>
  );
}
