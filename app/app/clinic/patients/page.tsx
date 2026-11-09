import Link from "next/link";
import { EmptyState, PageIntro, Pill, PrimaryLink } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { has } from "@/lib/domain/guard";
import { listPatients } from "@/lib/domain/patients";
import { accessResponse } from "@/lib/ui/access";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const actor = await requireActor();
  const { q = "" } = await searchParams;
  let patients;
  try {
    patients = listPatients(getDb(), actor, q);
  } catch (error) {
    return accessResponse(error);
  }
  return (
    <div>
      <PageIntro
        title="المرضى"
        description="القائمة من عيادة الحساب الحالي فقط."
        action={has(actor, "patients.write") ? <PrimaryLink href="/app/clinic/patients/new">مريض جديد</PrimaryLink> : null}
      />
      <form action="/app/clinic/patients" className="mb-4 flex gap-2">
        <label className="sr-only" htmlFor="q">
          بحث
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="الاسم أو رقم الملف" className="h-11 flex-1 rounded-xl border border-line bg-white px-3" />
        <button className="h-11 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line" type="submit">
          بحث
        </button>
      </form>
      {patients.length ? (
        <ul className="grid gap-3">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link href={`/app/clinic/patients/${patient.id}`} className="flex items-center justify-between rounded-card border border-line bg-white p-4 shadow-card">
                <div>
                  <p className="font-extrabold">{patient.name}</p>
                  <p className="text-sm text-muted" dir="ltr">
                    {patient.fileNumber}
                  </p>
                </div>
                <Pill tone={patient.access === "clinical" ? "teal" : "mist"}>{patient.access === "clinical" ? "ملف سريري" : "بيانات تواصل"}</Pill>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="لا نتائج" body="جرّب اسماً آخر أو أضف مريضاً داخل هذه العيادة." />
      )}
    </div>
  );
}
