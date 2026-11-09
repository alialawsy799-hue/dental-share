import Link from "next/link";
import { Card, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import { getPatient } from "@/lib/domain/patients";
import { accessResponse } from "@/lib/ui/access";

const upper = ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"];
const lower = ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"];

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const db = getDb();
  let patient;
  try {
    patient = getPatient(db, actor, id);
  } catch (error) {
    return accessResponse(error);
  }
  const visits = db.appointments
    .filter((appointment) => appointment.clinicId === actor.clinicId && appointment.patientId === patient.id)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const cases = db.cases.filter((item) => item.clinicId === actor.clinicId && item.patientId === patient.id);
  const marked = patient.access === "clinical" ? new Set(patient.teeth.map((tooth) => tooth.fdi)) : new Set<string>();
  return (
    <div>
      <PageIntro eyebrow={patient.fileNumber} title={patient.name} description={patient.access === "desk" ? "عرض الاستقبال يقتصر على بيانات التواصل." : "ملف داخل عيادة الحساب الحالي."} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-extrabold">التواصل</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">الهاتف</dt><dd dir="ltr">{patient.phone}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">الميلاد</dt><dd>{patient.birthYear}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">الموافقة</dt><dd>{patient.consentStatus === "granted" ? "ممنوحة" : "بانتظار التوقيع"}</dd></div>
          </dl>
        </Card>
        {patient.access === "clinical" ? (
          <Card>
            <h2 className="font-extrabold">تاريخ طبي مختصر</h2>
            <p className="mt-3 text-sm leading-7">{patient.medicalHistory || "لا توجد ملاحظة."}</p>
            <p className="mt-2 text-sm text-muted">الحساسية: {patient.allergies || "غير مذكورة"}</p>
            <p className="mt-2 text-sm leading-7">{patient.notes}</p>
          </Card>
        ) : null}
      </div>
      {patient.access === "clinical" ? (
        <Card className="mt-4">
          <h2 className="font-extrabold">مخطط FDI</h2>
          {[upper, lower].map((row) => (
            <div key={row[0]} className="mt-3 flex flex-wrap gap-1" dir="ltr">
              {row.map((tooth) => (
                <span key={tooth} className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold ${marked.has(tooth) ? "bg-teal text-navy" : "bg-mist text-muted"}`}>
                  {tooth}
                </span>
              ))}
            </div>
          ))}
          <ul className="mt-3 text-sm leading-7">
            {patient.teeth.map((tooth) => (
              <li key={tooth.fdi}>
                {tooth.fdi}: {tooth.note}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card className="mt-4">
        <h2 className="font-extrabold">الزيارات</h2>
        {visits.length ? (
          <ul className="mt-3 divide-y divide-line">
            {visits.map((visit) => (
              <li key={visit.id} className="flex items-center justify-between py-3 text-sm">
                <span>{formatDateTime(visit.startsAt)} · {visit.visitType}</span>
                <Pill>{appointmentStatusLabel[visit.status]}</Pill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">لا زيارات مسجلة.</p>
        )}
      </Card>
      {cases.length && patient.access === "clinical" ? (
        <div className="mt-4 grid gap-3">
          {cases.map((item) => (
            <Link key={item.id} href={`/app/cases/${item.id}`} className="rounded-card border border-line bg-white p-4 shadow-card">
              <p className="text-sm text-teal">{item.code}</p>
              <p className="font-extrabold">{item.title}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
