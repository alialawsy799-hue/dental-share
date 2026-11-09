import Link from "next/link";
import { Card, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import { getPatient } from "@/lib/domain/patients";
import { accessResponse } from "@/lib/ui/access";

export default async function DeskPatientPage({ params }: { params: Promise<{ id: string }> }) {
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
  return (
    <div>
      <PageIntro eyebrow={patient.fileNumber} title={patient.name} description="عرض نظام الحجوزات يقتصر على بيانات التواصل ومواعيد العيادة." />
      <div className="mb-4">
        <Link href="/desk/book" className="text-sm font-bold text-violet">
          حجز موعد لهذا المريض
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-extrabold">التواصل</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">الهاتف</dt>
              <dd dir="ltr">{patient.phone}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">الميلاد</dt>
              <dd>{patient.birthYear}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">الموافقة</dt>
              <dd>{patient.consentStatus === "granted" ? "ممنوحة" : "بانتظار التوقيع"}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-extrabold">الطبيب المرتبط</h2>
          <p className="mt-3 text-sm leading-7 text-muted">التاريخ الطبي ومخطط الأسنان يظهران في تطبيق الطبيب لنفس العيادة، وليس هنا.</p>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="font-extrabold">الزيارات</h2>
        {visits.length ? (
          <ul className="mt-3 divide-y divide-line">
            {visits.map((visit) => (
              <li key={visit.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  {formatDateTime(visit.startsAt)} · {visit.visitType}
                </span>
                <Pill>{appointmentStatusLabel[visit.status]}</Pill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">لا زيارات مسجلة.</p>
        )}
      </Card>
    </div>
  );
}
