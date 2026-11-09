import { has } from "./guard";
import { formatTime } from "./format";
import { appointmentStatusLabel, commerceStatusLabel, labStatusLabel, serviceStatusLabel } from "./labels";
import type { Actor, Database } from "./types";
import { DEMO_TODAY } from "./types";

export interface HomeModel {
  greeting: string;
  clinicName: string;
  cityLine: string;
  stats: { label: string; value: string; href: string }[];
  quick: { label: string; href: string; hint: string }[];
  appointments: { id: string; time: string; title: string; meta: string; status: string }[];
  followups: { id: string; href: string; title: string; meta: string }[];
  caseCard: { id: string; href: string; title: string; code: string; steps: string[] } | null;
  showCommunity: boolean;
  notices: { id: string; title: string; body: string; href: string }[];
}

export function getHome(db: Database, actor: Actor): HomeModel {
  const clinic = db.clinics.find((item) => item.id === actor.clinicId);
  const hour = 9;
  const greeting = hour < 12 ? "صباح الخير" : "مساء الخير";
  const stats: HomeModel["stats"] = [];
  const quick: HomeModel["quick"] = [];
  const appointments: HomeModel["appointments"] = [];
  const followups: HomeModel["followups"] = [];

  if (has(actor, "appointments.manage")) {
    const today = db.appointments.filter(
      (appointment) => appointment.clinicId === actor.clinicId && appointment.startsAt.startsWith(DEMO_TODAY),
    );
    stats.push({ label: "مواعيد اليوم", value: String(today.length), href: "/app/clinic/appointments" });
    for (const appointment of today) {
      const patient = db.patients.find((item) => item.id === appointment.patientId && item.clinicId === actor.clinicId);
      const doctor = db.users.find((user) => user.id === appointment.doctorId);
      appointments.push({
        id: appointment.id,
        time: formatTime(appointment.startsAt),
        title: patient?.name ?? "موعد",
        meta: `${appointment.visitType} · ${doctor?.name ?? ""}`,
        status: appointmentStatusLabel[appointment.status],
      });
    }
    quick.push({ label: "حجز موعد", href: "/app/clinic/appointments", hint: "مع منع التعارض" });
  }

  if (has(actor, "patients.read")) {
    const count = db.patients.filter((patient) => patient.clinicId === actor.clinicId).length;
    stats.push({ label: "مرضى العيادة", value: String(count), href: "/app/clinic/patients" });
  }

  if (has(actor, "expenses.read")) {
    stats.push({ label: "سجل المصاريف", value: "عرض", href: "/app/clinic/expenses" });
  }

  if (has(actor, "lab.create")) {
    quick.push({ label: "طلب مختبر", href: "/app/services/new?kind=lab", hint: "المختبر المركزي" });
  }
  if (has(actor, "commerce.buy")) {
    quick.push({ label: "طلب من متجر", href: "/app/stores", hint: "الدفع عند الاستلام أو تحويل" });
  }
  if (has(actor, "community.post") && actor.verified) {
    quick.push({ label: "مجتمع الأطباء", href: "/app/community", hint: "منشورات مهنية مجهّلة" });
  }

  if (has(actor, "lab.read")) {
    for (const order of db.labOrders.filter((order) => order.clinicId === actor.clinicId && order.status !== "delivered" && order.status !== "rejected")) {
      followups.push({
        id: order.id,
        href: `/app/services/orders/${order.id}`,
        title: has(actor, "patients.clinical") ? `مختبر · ${order.workType}` : `فاتورة/طلب مختبر · ${order.caseCode}`,
        meta: labStatusLabel[order.status],
      });
    }
    for (const order of db.serviceOrders.filter((order) => order.clinicId === actor.clinicId && order.status !== "closed")) {
      if (!has(actor, "patients.clinical") && actor.role === "clinic_accountant") continue;
      followups.push({
        id: order.id,
        href: `/app/services/orders/${order.id}`,
        title: `خدمة ${order.kind.toUpperCase()}`,
        meta: serviceStatusLabel[order.status],
      });
    }
  }

  if (has(actor, "purchases.read")) {
    for (const order of db.commerceOrders.filter((order) => order.clinicId === actor.clinicId && !["delivered", "cancelled", "returned"].includes(order.status))) {
      followups.push({
        id: order.id,
        href: `/app/orders/${order.id}`,
        title: "طلب متجر",
        meta: commerceStatusLabel[order.status],
      });
    }
  }

  let caseCard: HomeModel["caseCard"] = null;
  if (has(actor, "patients.clinical")) {
    const active = db.cases.find((item) => item.clinicId === actor.clinicId && item.status === "active");
    if (active) {
      caseCard = {
        id: active.id,
        href: `/app/cases/${active.id}`,
        title: active.title,
        code: active.code,
        steps: ["فُتحت الحالة", "طلب مختبر", "تصوير", "مواد"],
      };
    }
    stats.push({
      label: "حالات نشطة",
      value: String(db.cases.filter((item) => item.clinicId === actor.clinicId && item.status === "active").length),
      href: active ? `/app/cases/${active.id}` : "/app/clinic",
    });
  }

  const notices = listNotifications(db, actor)
    .slice(0, 4)
    .map((notice) => ({ id: notice.id, title: notice.title, body: notice.body, href: notice.href }));

  return {
    greeting,
    clinicName: clinic?.name ?? "العيادة",
    cityLine: clinic ? `${clinic.district} · ${clinic.city}` : "",
    stats,
    quick,
    appointments,
    followups: followups.slice(0, 5),
    caseCard,
    showCommunity: has(actor, "community.post") && actor.verified,
    notices,
  };
}

function stillOpen(db: Database, notice: { title: string; href: string }) {
  const id = notice.href.split("?")[0]?.split("/").pop();
  const order = id ? db.labOrders.find((item) => item.id === id) : undefined;
  if (order && order.status !== "awaiting_doctor_approval" && notice.title.includes("بانتظار اعتماد")) return false;
  return true;
}

export function listNotifications(db: Database, actor: Actor) {
  return db.notifications.filter((notice) => notice.userId === actor.id && stillOpen(db, notice));
}

export function markNotificationsRead(db: Database, actor: Actor) {
  for (const notice of db.notifications) {
    if (notice.userId === actor.id) notice.read = true;
  }
}
