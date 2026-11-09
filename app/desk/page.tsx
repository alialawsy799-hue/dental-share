import Link from "next/link";
import { AppointmentStatusForms } from "@/components/forms/appointment-status";
import { Card, PageIntro, Pill, PrimaryLink, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listAppointments, listDoctors } from "@/lib/domain/appointments";
import { formatTime } from "@/lib/domain/format";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import { listPatients } from "@/lib/domain/patients";
import { DEMO_TODAY } from "@/lib/domain/types";
import { accessResponse } from "@/lib/ui/access";

function count(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function DeskHomePage() {
  const actor = await requireActor();
  const db = getDb();
  try {
    const clinic = db.clinics.find((item) => item.id === actor.clinicId);
    const rows = listAppointments(db, actor);
    const doctors = listDoctors(db, actor);
    const patients = listPatients(db, actor);
    const confirmed = rows.filter((item) => item.status === "confirmed").length;
    const arrived = rows.filter((item) => item.status === "arrived").length;
    const dayLabel = new Intl.DateTimeFormat("ar-IQ", {
      numberingSystem: "latn",
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Baghdad",
    }).format(new Date(`${DEMO_TODAY}T12:00:00+03:00`));

    return (
      <div>
        <PageIntro
          eyebrow="نظام العيادة"
          title={clinic?.name ?? "العيادة"}
          description="الرئيسية، تسجيل المريض، الحجز، الصرفيات، والمخزن. الحجوزات تخصم المواد وتظهر في تطبيق الطبيب."
          action={<PrimaryLink href="/desk/book">حجز جديد</PrimaryLink>}
        />

        <Card className="mb-5 bg-gradient-to-l from-white to-lavender">
          <p className="text-xs font-bold text-violet">مربوط بحساب الطبيب</p>
          <p className="mt-1 text-lg font-extrabold text-plum">
            {doctors.length ? doctors.map((doctor) => doctor.name).join(" · ") : "لم يُربط طبيب بعد"}
          </p>
          <p className="mt-1 text-sm leading-7 text-muted">
            {clinic ? `${clinic.city} · ${clinic.district} · ${clinic.branchName}` : "عيادة الحساب الحالي"}
            {clinic?.phone ? (
              <>
                <br />
                <span dir="ltr">{clinic.phone}</span>
              </>
            ) : null}
          </p>
        </Card>

        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          {[
            ["مواعيد اليوم", rows.length],
            ["مؤكد", confirmed],
            ["حضر", arrived],
            ["مرضى مسجّلون", patients.length],
          ].map(([label, value]) => (
            <Card key={label} className="bg-gradient-to-br from-white to-lavender">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-violet">{count(Number(value))}</p>
            </Card>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <PrimaryLink href="/desk/patients">تسجيل مريض</PrimaryLink>
          <Link href="/desk/book" className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line">
            حجز
          </Link>
          <Link href="/desk/expenses" className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line">
            صرفيات
          </Link>
          <Link href="/desk/inventory" className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line">
            المخزن
          </Link>
        </div>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-extrabold">جدول اليوم</h2>
              <p className="text-sm text-muted">{dayLabel}</p>
            </div>
            <Link href="/desk/book" className="text-sm font-bold text-violet">
              كل الأيام
            </Link>
          </div>
          {rows.length ? (
            <ul className="mt-3 divide-y divide-line">
              {rows.map((row, index) => {
                const patient = db.patients.find((item) => item.id === row.patientId && item.clinicId === actor.clinicId);
                const doctor = doctors.find((item) => item.id === row.doctorId);
                const chair = db.chairs.find((item) => item.id === row.chairId);
                return (
                  <li key={`${row.id}-${index}`} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {formatTime(row.startsAt)} · {patient?.name ?? "مريض"}
                        </p>
                        <p className="text-sm text-muted">
                          {row.visitType} · {doctor?.name ?? "طبيب"} · {chair?.name ?? "كرسي"} · {row.durationMin} د
                        </p>
                      </div>
                      <Pill tone={statusTone(row.status)}>{appointmentStatusLabel[row.status]}</Pill>
                    </div>
                    <AppointmentStatusForms id={row.id} returnTo="/desk" date={DEMO_TODAY} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">لا مواعيد في هذا اليوم. ثبّت حجزاً ليظهر في تطبيق الطبيب.</p>
          )}
        </Card>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
