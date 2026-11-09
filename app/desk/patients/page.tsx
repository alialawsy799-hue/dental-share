import Link from "next/link";
import { DeskPatientForm } from "@/components/forms/desk-patient-form";
import { Card, EmptyState, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listPatients } from "@/lib/domain/patients";
import { accessResponse } from "@/lib/ui/access";

export default async function DeskPatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
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
      <PageIntro title="تسجيل المريض" description="الاسم ورقم الهاتف فقط. الملف يُحفظ على هذه العيادة ويظهر مباشرة في تبويب الحجز." />
      <Card className="mb-5">
        <h2 className="mb-3 font-extrabold">مريض جديد</h2>
        <DeskPatientForm />
      </Card>
      <form action="/desk/patients" className="mb-4 flex gap-2">
        <label className="sr-only" htmlFor="q">
          بحث
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="الاسم أو الهاتف" className="h-11 flex-1 rounded-xl border border-line bg-white px-3" />
        <button className="h-11 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line" type="submit">
          بحث
        </button>
      </form>
      {patients.length ? (
        <ul className="grid gap-3">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link href={`/desk/patients/${patient.id}`} className="flex items-center justify-between rounded-card border border-line bg-white p-4 shadow-card">
                <div>
                  <p className="font-extrabold">{patient.name}</p>
                  <p className="text-sm text-muted" dir="ltr">
                    {patient.phone}
                  </p>
                </div>
                <Pill tone="mist">{patient.fileNumber}</Pill>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="لا مرضى بعد" body="سجّل الاسم والهاتف أعلاه ليظهر المريض في قائمة الحجز." />
      )}
    </div>
  );
}
