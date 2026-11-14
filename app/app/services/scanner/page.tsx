import { Card, PageIntro } from "@/components/kit";
import { ScannerForm } from "@/components/forms/scanner-form";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { listCases } from "@/lib/domain/cases";
import { listPatients } from "@/lib/domain/patients";
import { accessResponse } from "@/lib/ui/access";

export default async function ScannerRequestPage() {
  const actor = await requireActor();
  if (!has(actor, "lab.create")) return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  const db = getDb();
  const patients = listPatients(db, actor).map((patient) => ({ id: patient.id, label: `${patient.name} · ${patient.fileNumber}` }));
  const cases = listCases(db, actor).map((item) => ({ id: item.id, label: `${item.code} · ${item.title}` }));
  return (
    <div>
      <PageIntro title="طلب مندوب سكنر أو حجز" description="اختر زيارة مندوب للعيادة أو حجز موعد في المختبر، مع الملاحظات اللازمة." />
      <Card>
        <ScannerForm patients={patients} cases={cases} />
      </Card>
    </div>
  );
}
