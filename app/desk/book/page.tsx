import { DeskBookForm } from "@/components/forms/desk-book-form";
import { AppointmentStatusForms } from "@/components/forms/appointment-status";
import { Card, PageIntro, Pill, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listAppointments, listChairs, listDoctors } from "@/lib/domain/appointments";
import { formatTime } from "@/lib/domain/format";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import { listPatients } from "@/lib/domain/patients";
import { suppliesForService } from "@/lib/domain/supplies";
import { DEMO_TODAY } from "@/lib/domain/types";
import { accessResponse } from "@/lib/ui/access";

export default async function DeskBookPage({ searchParams }: { searchParams: Promise<{ date?: string; error?: string }> }) {
  const actor = await requireActor();
  const query = await searchParams;
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : DEMO_TODAY;
  const db = getDb();
  try {
    const rows = listAppointments(db, actor, date);
    const patients = listPatients(db, actor).map((patient) => ({ id: patient.id, label: `${patient.name} · ${patient.phone}` }));
    const doctors = listDoctors(db, actor);
    const chairs = listChairs(db, actor);
    return (
      <div>
        <PageIntro title="الحجز" description="اختر المريض والوقت والخدمة. مواد الخدمة تُخصم من المخزن عند تثبيت الموعد." />
        {query.error ? (
          <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {query.error}
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="mb-3 font-extrabold">حجز جديد</h2>
            {patients.length && doctors.length && chairs.length ? (
              <DeskBookForm patients={patients} doctors={doctors} chairs={chairs} date={date < DEMO_TODAY ? DEMO_TODAY : date} />
            ) : (
              <p className="text-sm leading-7 text-muted">
                {patients.length ? "أضف طبيباً من إدارة المنصة قبل الحجز." : "سجّل مريضاً من تبويب تسجيل المريض أولاً."}
              </p>
            )}
          </Card>
          <Card>
            <h2 className="font-extrabold">مواعيد اليوم</h2>
            {rows.length ? (
              <ul className="mt-3 divide-y divide-line">
                {rows.map((row, index) => {
                  const patient = db.patients.find((item) => item.id === row.patientId && item.clinicId === actor.clinicId);
                  const used = suppliesForService(row.visitType);
                  return (
                    <li key={`${row.id}-${index}`} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {formatTime(row.startsAt)} · {patient?.name}
                          </p>
                          <p className="text-sm text-muted">
                            {row.visitType}
                            {used.length ? ` · يخصم ${used.length} صنفاً من المخزن` : ""}
                          </p>
                        </div>
                        <Pill tone={statusTone(row.status)}>{appointmentStatusLabel[row.status]}</Pill>
                      </div>
                      <AppointmentStatusForms id={row.id} returnTo="/desk/book" date={date} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">لا مواعيد في هذا اليوم.</p>
            )}
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
