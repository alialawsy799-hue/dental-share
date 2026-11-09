import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, Chevron, Glass, IconBadge, PageTitle, SectionHead, StatusPill } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listAppointments } from "@/lib/domain/appointments";
import { expenseLedger } from "@/lib/domain/expenses";
import { formatTime } from "@/lib/domain/format";
import { has } from "@/lib/domain/guard";
import { inventoryWarnings, listInventory } from "@/lib/domain/inventory";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import { DEMO_TODAY } from "@/lib/domain/types";
import { fill, formatMoney, formatNumber, getLang, t } from "@/lib/i18n";

const appointmentStatusEn = { confirmed: "Confirmed", arrived: "Arrived", cancelled: "Cancelled", no_show: "No show" } as const;

export default async function ClinicPage() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const db = getDb();
  const clinic = db.clinics.find((item) => item.id === actor.clinicId);
  const team = db.users.filter((user) => user.clinicId === actor.clinicId);
  const chairs = db.chairs.filter((chair) => chair.clinicId === actor.clinicId);

  const appointments = has(actor, "appointments.manage") ? listAppointments(db, actor) : null;
  const confirmed = appointments?.filter((item) => item.status === "confirmed").length ?? 0;
  const activeCases = has(actor, "patients.clinical") ? db.cases.filter((item) => item.clinicId === actor.clinicId && item.status === "active").length : null;

  type Stat = { href: string; icon: IconName; title: string; value: string; caption: string; badge?: { text: string; tone: "violet" | "amber" | "green" | "rose" } };
  const stats: Stat[] = [];

  if (has(actor, "patients.read")) {
    const own = db.patients.filter((patient) => patient.clinicId === actor.clinicId);
    const month = DEMO_TODAY.slice(0, 7);
    const fresh = own.filter((patient) => patient.createdAt.startsWith(month)).length;
    stats.push({
      href: "/app/clinic/patients",
      icon: "users",
      title: d.patients,
      value: formatNumber(lang, own.length),
      caption: d.registeredPatients,
      badge: fresh ? { text: `+${formatNumber(lang, fresh)} ${d.newThisMonth}`, tone: "green" } : undefined,
    });
  }
  if (has(actor, "expenses.read")) {
    const { summary } = expenseLedger(db, actor);
    stats.push({
      href: "/app/clinic/expenses",
      icon: "wallet",
      title: d.expenses,
      value: formatMoney(lang, summary.settledIqd),
      caption: d.settledThisMonth,
      badge: summary.unpaidIqd ? { text: `${formatMoney(lang, summary.unpaidIqd)} ${d.unpaidAmount}`, tone: "amber" } : undefined,
    });
  }
  let lowCount = 0;
  if (has(actor, "inventory.read")) {
    const items = listInventory(db, actor);
    const warnings = inventoryWarnings(db, actor);
    lowCount = warnings.filter((item) => item.kind === "low").length;
    stats.push({
      href: "/app/clinic/inventory",
      icon: "box",
      title: d.inventory,
      value: formatNumber(lang, items.length),
      caption: d.itemsInStock,
      badge: warnings.length ? { text: `${formatNumber(lang, warnings.length)} ${d.lowItems}`, tone: "rose" } : { text: d.stockStable, tone: "green" },
    });
  }
  let unpaidOrders = 0;
  if (has(actor, "purchases.read")) {
    const open = db.commerceOrders.filter((order) => order.clinicId === actor.clinicId && !["delivered", "cancelled", "returned"].includes(order.status));
    unpaidOrders = db.commerceOrders.filter((order) => order.clinicId === actor.clinicId && order.paymentStatus === "unpaid" && order.status !== "cancelled").length;
    const worth = open.reduce((sum, order) => sum + order.totalIqd, 0);
    stats.push({
      href: "/app/clinic/purchases",
      icon: "cart",
      title: d.purchases,
      value: formatNumber(lang, open.length),
      caption: d.openPurchases,
      badge: worth ? { text: `${d.worth} ${formatMoney(lang, worth)}`, tone: "violet" } : undefined,
    });
  }

  const alerts: { id: string; icon: IconName; title: string; body: string; href: string; action: string; tone: "amber" | "rose" }[] = [];
  if (lowCount) {
    alerts.push({ id: "low", icon: "warning", title: d.lowStock, body: fill(d.lowStockBody, { n: formatNumber(lang, lowCount) }), href: "/app/clinic/inventory", action: d.viewItems, tone: "rose" });
  }
  if (unpaidOrders) {
    alerts.push({ id: "pay", icon: "card", title: d.pendingPayment, body: d.pendingPaymentBody, href: "/app/clinic/purchases", action: d.details, tone: "amber" });
  }

  const dayLabel = new Intl.DateTimeFormat(lang === "ar" ? "ar-IQ" : "en-GB", {
    numberingSystem: "latn",
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Baghdad",
  }).format(new Date(`${DEMO_TODAY}T12:00:00Z`));

  return (
    <LangPage lang={lang}>
      <PageTitle title={clinic?.name ?? d.clinicTitle} subtitle={d.clinicTagline} />

      <Glass className="mt-5 overflow-hidden">
        <div className="flex items-center gap-3">
          <IconBadge name="building" size="lg" tone="solid" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-violet">{d.clinicPulse}</p>
            <h2 className="truncate text-[18px] font-extrabold text-plum">{clinic?.name ?? d.clinicTitle}</h2>
            <p className="text-[13px] text-muted">
              {clinic ? `${clinic.city} · ${clinic.district} · ${clinic.branchName}` : d.clinicKind}
            </p>
            {clinic?.phone ? (
              <p className="text-[12px] text-muted" dir="ltr">
                {clinic.phone}
              </p>
            ) : null}
          </div>
          {actor.verified ? <Icon name="check" className="h-5 w-5 text-violet" /> : null}
        </div>
        {appointments || activeCases !== null ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {appointments ? (
              <div className="rounded-2xl bg-lavender px-3 py-3">
                <p className="text-[12px] font-bold text-muted">{d.todayBookings}</p>
                <p className="mt-1 text-[24px] font-extrabold leading-none text-violet">{formatNumber(lang, appointments.length)}</p>
                <p className="mt-1 text-[11px] text-muted">{formatNumber(lang, confirmed)} {d.confirmedAppointments}</p>
              </div>
            ) : null}
            {activeCases !== null ? (
              <div className="rounded-2xl bg-lavender px-3 py-3">
                <p className="text-[12px] font-bold text-muted">{d.activeCases}</p>
                <p className="mt-1 text-[24px] font-extrabold leading-none text-violet">{formatNumber(lang, activeCases)}</p>
                <p className="mt-1 text-[11px] text-muted">{d.inProgress}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-bold text-muted">{d.teamOnDuty}</p>
            <div className="mt-2 flex -space-x-2 space-x-reverse">
              {team.slice(0, 5).map((member) => (
                <Avatar key={member.id} name={member.name} className="h-9 w-9 text-[11px] ring-2 ring-white" />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted">{formatNumber(lang, team.length)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted">{d.chairsLabel}</p>
            <p className="mt-2 text-[22px] font-extrabold leading-none text-violet">{formatNumber(lang, chairs.length)}</p>
            <p className="mt-1 truncate text-[11px] text-muted">{chairs.map((chair) => chair.name).join(" · ")}</p>
          </div>
        </div>
        {(has(actor, "patients.write") || has(actor, "appointments.manage")) ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {has(actor, "patients.write") ? (
              <Link href="/app/clinic/patients/new" className="btn-violet grid h-11 place-items-center rounded-2xl text-[13px] font-bold">
                {d.newPatient}
              </Link>
            ) : null}
            {has(actor, "appointments.manage") ? (
              <Link href="/app/clinic/appointments" className="grid h-11 place-items-center rounded-2xl bg-lavender-deep text-[13px] font-bold text-violet">
                {d.newAppointment}
              </Link>
            ) : null}
          </div>
        ) : null}
      </Glass>

      {stats.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <Link key={stat.href} href={stat.href} className="glass flex min-h-[150px] flex-col rounded-[22px] p-4 shadow-card">
              <div className="flex items-center justify-between">
                <IconBadge name={stat.icon} size="sm" />
                <Chevron lang={lang} />
              </div>
              <p className="mt-3 text-[13px] font-bold text-muted">{stat.title}</p>
              <p className="mt-0.5 text-[20px] font-extrabold leading-tight text-plum">{stat.value}</p>
              <p className="text-[11px] text-muted">{stat.caption}</p>
              {stat.badge ? (
                <div className="mt-2">
                  <StatusPill tone={stat.badge.tone}>{stat.badge.text}</StatusPill>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}

      {appointments ? (
        <section className="mt-7">
          <SectionHead title={d.bookings} action={{ href: "/app/clinic/appointments", label: d.viewAll }} />
          <Glass>
            <div className="flex items-center gap-3 rounded-2xl bg-lavender px-3 py-3">
              <IconBadge name="calendar" size="sm" tone="solid" />
              <div className="flex-1">
                <p className="text-[14px] font-extrabold text-plum">{d.todayAppointments}</p>
                <p className="text-[12px] text-muted">{dayLabel}</p>
              </div>
              <div className="text-end text-[11px] leading-4 text-muted">
                <p className="text-[16px] font-extrabold leading-none text-violet">{formatNumber(lang, appointments.length)}</p>
                {d.appointmentsCount} · {formatNumber(lang, confirmed)} {d.confirmedCount}
              </div>
            </div>
            {appointments.length ? (
              <ul className="mt-2 divide-y divide-line">
                {appointments.map((appointment) => {
                  const patient = db.patients.find((item) => item.id === appointment.patientId && item.clinicId === actor.clinicId);
                  const status = lang === "en" ? appointmentStatusEn[appointment.status] : appointmentStatusLabel[appointment.status];
                  const tone = appointment.status === "confirmed" ? "violet" : appointment.status === "arrived" ? "green" : "rose";
                  return (
                    <li key={appointment.id} className="flex items-center gap-3 py-3">
                      <span className="w-14 shrink-0 text-[13px] font-extrabold text-violet" dir="ltr">
                        {formatTime(appointment.startsAt)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold text-plum">{patient?.name ?? "—"}</span>
                        <span className="block text-[12px] text-muted">{appointment.visitType}</span>
                      </span>
                      <StatusPill tone={tone}>{status}</StatusPill>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">{d.noAppointments}</p>
            )}
          </Glass>
        </section>
      ) : null}

      <section className="mt-7">
        <SectionHead title={d.clinicAlerts} />
        {alerts.length ? (
          <div className="grid gap-3">
            {alerts.map((alert) => (
              <Glass key={alert.id}>
                <div className="flex items-start gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${alert.tone === "rose" ? "bg-[#fde8ec] text-[#c63d53]" : "bg-[#fff3df] text-[#b45309]"}`}>
                    <Icon name={alert.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold text-plum">{alert.title}</p>
                    <p className="text-[13px] text-muted">{alert.body}</p>
                  </div>
                  <Link href={alert.href} className="shrink-0 rounded-full bg-lavender-deep px-3 py-1.5 text-[12px] font-bold text-violet">
                    {alert.action}
                  </Link>
                </div>
              </Glass>
            ))}
          </div>
        ) : (
          <Glass>
            <p className="text-sm text-muted">{d.noAlerts}</p>
          </Glass>
        )}
      </section>
    </LangPage>
  );
}
