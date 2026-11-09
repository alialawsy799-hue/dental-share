import { AccessError, fail, ok, type Result } from "./errors";
import { baghdadIso } from "./format";
import { audit, requirePermission, requireSameClinic, uid } from "./guard";
import { consumeForVisit, ensureClinicSupplies } from "./inventory";
import type { Actor, Appointment, AppointmentStatus, Database } from "./types";
import { DEMO_TODAY, VISIT_TYPES } from "./types";

export interface AppointmentInput {
  patientId: string;
  doctorId: string;
  chairId: string;
  visitType: string;
  date: string;
  time: string;
  durationMin: number;
  adminNote: string;
}

function overlaps(startA: string, durationA: number, startB: string, durationB: number): boolean {
  const a0 = new Date(startA).getTime();
  const b0 = new Date(startB).getTime();
  return a0 < b0 + durationB * 60_000 && b0 < a0 + durationA * 60_000;
}

export function listDoctors(db: Database, actor: Actor): { id: string; name: string }[] {
  requirePermission(actor, "appointments.manage");
  return db.users
    .filter(
      (user) =>
        user.clinicId === actor.clinicId &&
        (user.role === "clinic_owner" || user.role === "clinic_doctor"),
    )
    .map((user) => ({ id: user.id, name: user.name }));
}

export function listChairs(db: Database, actor: Actor): { id: string; name: string }[] {
  requirePermission(actor, "appointments.manage");
  return db.chairs.filter((chair) => chair.clinicId === actor.clinicId).map((chair) => ({ id: chair.id, name: chair.name }));
}

export function listAppointments(db: Database, actor: Actor, date = DEMO_TODAY): Appointment[] {
  requirePermission(actor, "appointments.manage");
  return db.appointments
    .filter((appointment) => appointment.clinicId === actor.clinicId && appointment.startsAt.startsWith(date))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getAppointment(db: Database, actor: Actor, id: string): Appointment {
  requirePermission(actor, "appointments.manage");
  const appointment = db.appointments.find((item) => item.id === id);
  if (!appointment) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, appointment.clinicId);
  return appointment;
}

export function createAppointment(db: Database, actor: Actor, input: AppointmentInput): Result<Appointment> {
  requirePermission(actor, "appointments.manage");
  const patient = db.patients.find((item) => item.id === input.patientId);
  if (!patient || patient.clinicId !== actor.clinicId) {
    return fail("المريض غير متاح ضمن عيادتك.", { patientId: "اختر مريضاً من عيادتك." });
  }
  const doctor = db.users.find(
    (user) =>
      user.id === input.doctorId &&
      user.clinicId === actor.clinicId &&
      (user.role === "clinic_owner" || user.role === "clinic_doctor"),
  );
  if (!doctor) return fail("الطبيب غير متاح ضمن عيادتك.", { doctorId: "اختر طبيباً من عيادتك." });
  const chair = db.chairs.find((item) => item.id === input.chairId && item.clinicId === actor.clinicId);
  if (!chair) return fail("الكرسي غير متاح ضمن عيادتك.", { chairId: "اختر كرسياً من عيادتك." });
  if (!VISIT_TYPES.includes(input.visitType as (typeof VISIT_TYPES)[number])) {
    return fail("نوع الزيارة غير معروف.", { visitType: "اختر نوع الزيارة." });
  }
  if (![15, 30, 45, 60].includes(input.durationMin)) {
    return fail("مدة الحجز غير صالحة.", { durationMin: "اختر 15 أو 30 أو 45 أو 60 دقيقة." });
  }
  const startsAt = baghdadIso(input.date, input.time);
  if (!startsAt) return fail("التاريخ أو الوقت غير صالح.", { time: "تحقق من الوقت." });
  if (input.date < DEMO_TODAY) return fail("لا يمكن حجز موعد في يوم ماضٍ.", { date: "اختر اليوم أو بعده." });
  if (input.adminNote.length > 240) return fail("الملاحظة الإدارية طويلة.", { adminNote: "اختصر الملاحظة." });

  const conflict = db.appointments.some((appointment) => {
    if (appointment.clinicId !== actor.clinicId) return false;
    if (appointment.status === "cancelled") return false;
    const sameResource = appointment.doctorId === input.doctorId || appointment.chairId === input.chairId;
    if (!sameResource) return false;
    return overlaps(appointment.startsAt, appointment.durationMin, startsAt, input.durationMin);
  });
  if (conflict) {
    return fail("يتعارض هذا الموعد مع حجز آخر لنفس الطبيب أو نفس الكرسي.");
  }

  const created: Appointment = {
    id: uid("appt"),
    clinicId: actor.clinicId!,
    patientId: patient.id,
    doctorId: doctor.id,
    chairId: chair.id,
    visitType: input.visitType,
    startsAt,
    durationMin: input.durationMin,
    status: "confirmed",
    adminNote: input.adminNote.trim(),
  };
  db.appointments.push(created);
  if (actor.clinicId) {
    ensureClinicSupplies(db, actor.clinicId);
    consumeForVisit(db, actor.clinicId, created.visitType, created.id);
  }
  audit(db, actor, "appointment.create", "appointment", created.id);
  return ok(created);
}

export function setAppointmentStatus(
  db: Database,
  actor: Actor,
  id: string,
  status: AppointmentStatus,
): Result<Appointment> {
  const appointment = getAppointment(db, actor, id);
  appointment.status = status;
  audit(db, actor, "appointment.status", "appointment", appointment.id);
  return ok(appointment);
}
