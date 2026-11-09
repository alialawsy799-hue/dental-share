import { setAppointmentStatusAction } from "@/lib/actions/clinic";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Card, PageIntro, Pill, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listAppointments, listChairs, listDoctors } from "@/lib/domain/appointments";
import { formatTime, weekContaining } from "@/lib/domain/format";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import { listPatients } from "@/lib/domain/patients";
import { DEMO_TODAY } from "@/lib/domain/types";
import { accessResponse } from "@/lib/ui/access";

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ date?: string; error?: string }> }) {
  const actor = await requireActor();
  const query = await searchParams;
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : DEMO_TODAY;
  const db = getDb();
  try {
    const rows = listAppointments(db, actor, date);
    const patients = listPatients(db, actor).map((patient) => ({ id: patient.id, label: `${patient.name} · ${patient.fileNumber}` }));
    const doctors = listDoctors(db, actor);
    const chairs = listChairs(db, actor);
    const week = weekContaining(date);
    return (
      <div>
        <PageIntro title="الحجوزات" description="التعارض يُفحص على الخادم لنفس العيادة: الطبيب أو الكرسي. الموعد الملغى لا يحجز الوقت." />
        {query.error ? <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{query.error}</p> : null}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {week.map((day) => (
            <a key={day} href={`/app/clinic/appointments?date=${day}`} className={`shrink-0 rounded-2xl px-3 py-2 text-sm font-bold ${day === date ? "bg-navy text-white" : "bg-white ring-1 ring-line"}`}>
              {day === DEMO_TODAY ? "اليوم" : day.slice(5)}
            </a>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card>
            <h2 className="font-extrabold">مواعيد {date}</h2>
            {rows.length ? (
              <ul className="mt-3 divide-y divide-line">
                {rows.map((row, index) => {
                  const patient = db.patients.find((item) => item.id === row.patientId);
                  return (
                    <li key={`${row.id}-${index}`} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{formatTime(row.startsAt)} · {patient?.name}</p>
                          <p className="text-sm text-muted">{row.visitType} · {row.durationMin} د · {db.chairs.find((chair) => chair.id === row.chairId)?.name}</p>
                        </div>
                        <Pill tone={statusTone(row.status)}>{appointmentStatusLabel[row.status]}</Pill>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["arrived", "cancelled", "no_show", "confirmed"] as const).map((status) => (
                          <form key={status} action={setAppointmentStatusAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="status" value={status} />
                            <button type="submit" className="rounded-full bg-mist px-3 py-1 text-xs font-bold">
                              {appointmentStatusLabel[status]}
                            </button>
                          </form>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">لا مواعيد في هذا اليوم.</p>
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-extrabold">حجز جديد</h2>
            <AppointmentForm patients={patients} doctors={doctors} chairs={chairs} date={date < DEMO_TODAY ? DEMO_TODAY : date} />
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
