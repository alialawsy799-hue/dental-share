import { Card, PageIntro } from "@/components/kit";
import { ServiceForm } from "@/components/forms/service-form";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { listCases } from "@/lib/domain/cases";
import { listPatients } from "@/lib/domain/patients";
import { accessResponse } from "@/lib/ui/access";

export default async function NewServicePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const actor = await requireActor();
  if (!has(actor, "lab.create")) return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  const { kind = "lab" } = await searchParams;
  const db = getDb();
  const patients = listPatients(db, actor).map((patient) => ({ id: patient.id, label: `${patient.name} · ${patient.fileNumber}` }));
  const cases = listCases(db, actor).map((item) => ({ id: item.id, label: `${item.code} · ${item.title}` }));
  return (
    <div>
      <PageIntro title="طلب جديد" description="النموذج يتبدل حسب الخدمة. المختبر المركزي جهة واحدة ولا يُختار من قائمة مختبرات." />
      <Card>
        <ServiceForm kind={kind} patients={patients} cases={cases} />
      </Card>
    </div>
  );
}
