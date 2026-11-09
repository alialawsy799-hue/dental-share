import { Card, PageIntro } from "@/components/kit";
import { PatientForm } from "@/components/forms/patient-form";
import { requireActor } from "@/lib/demo/session";
import { has } from "@/lib/domain/guard";
import { accessResponse } from "@/lib/ui/access";
import { AccessError } from "@/lib/domain/errors";

export default async function NewPatientPage() {
  const actor = await requireActor();
  if (!has(actor, "patients.write")) return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  return (
    <div>
      <PageIntro title="مريض جديد" description="يُحفظ الملف على عيادة الحساب، ولا يُقبل معرّف عيادة من النموذج." />
      <Card>
        <PatientForm clinical={has(actor, "patients.clinical")} />
      </Card>
    </div>
  );
}
