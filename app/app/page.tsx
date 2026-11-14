import Link from "next/link";
import { Glass } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatTime } from "@/lib/domain/format";
import { has } from "@/lib/domain/guard";
import { listNotifications } from "@/lib/domain/home";
import { DEMO_TODAY } from "@/lib/domain/types";
import { getLang, t } from "@/lib/i18n";

export default async function DoctorHome() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const db = getDb();

  const bookings = has(actor, "appointments.manage")
    ? db.appointments
        .filter((item) => item.clinicId === actor.clinicId && item.startsAt.startsWith(DEMO_TODAY) && item.status !== "cancelled")
        .filter((item) => actor.role !== "clinic_doctor" || item.doctorId === actor.id)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map((item) => ({
          id: item.id,
          name: db.patients.find((patient) => patient.id === item.patientId && patient.clinicId === actor.clinicId)?.name ?? "—",
          time: formatTime(item.startsAt),
          type: item.visitType,
        }))
    : [];

  const alerts = listNotifications(db, actor).slice(0, 5);

  return (
    <LangPage lang={lang}>
      <section className="mt-2">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-plum">{d.welcomeDoctor}</h1>
        <p className="mt-2 text-[18px] font-bold text-violet">{d.todayQuestion}</p>
      </section>

      <section className="mt-7">
        <h2 className="text-[19px] font-extrabold text-plum">{d.bookings}</h2>
        <Glass className="mt-3 overflow-x-auto">
          {bookings.length ? (
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-line text-[12px] text-muted">
                  <th className="pb-3 pe-3 font-bold">{d.customerName}</th>
                  <th className="pb-3 pe-3 font-bold">{d.bookingTime}</th>
                  <th className="pb-3 font-bold">{d.bookingType}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="py-3 pe-3 font-extrabold text-plum">{row.name}</td>
                    <td className="py-3 pe-3 font-bold tabular-nums text-plum" dir="ltr">
                      {row.time}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full bg-lavender-deep px-2.5 py-1 text-[12px] font-bold text-violet">{row.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">{d.noAppointments}</p>
          )}
        </Glass>
        <Link href="/app/clinic/appointments" className="mt-3 inline-block text-[13px] font-bold text-violet">
          {d.viewAll}
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="text-[19px] font-extrabold text-plum">{d.homeAlerts}</h2>
        {alerts.length ? (
          <ul className="mt-3 grid gap-3">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link href={alert.href} className="block">
                  <Glass>
                    <p className="text-[15px] font-extrabold text-plum">{alert.title}</p>
                    <p className="mt-1 text-[13px] leading-6 text-muted">{alert.body}</p>
                  </Glass>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Glass className="mt-3">
            <p className="text-sm text-muted">{d.noAlerts}</p>
          </Glass>
        )}
      </section>
    </LangPage>
  );
}
