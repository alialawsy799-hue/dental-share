import { AccessError } from "./errors";
import { has, requirePermission, requireSameClinic } from "./guard";
import { labStatusLabel, serviceStatusLabel } from "./labels";
import type { Actor, Database } from "./types";

export interface CaseHub {
  id: string;
  code: string;
  title: string;
  status: "active" | "completed";
  teeth: string[];
  clinicalNotes?: string;
  patient: { id: string; name: string; fileNumber: string; phone?: string };
  costs: { paid: number; unpaid: number; estimated: number; rows: { label: string; bucket: "paid" | "unpaid" | "estimated"; amountIqd: number }[] };
  timeline: { at: string; label: string; href?: string }[];
}

export function listCases(db: Database, actor: Actor) {
  requirePermission(actor, "patients.read");
  return db.cases
    .filter((item) => item.clinicId === actor.clinicId)
    .map((item) => ({
      id: item.id,
      code: item.code,
      title: has(actor, "patients.clinical") ? item.title : "حالة علاجية",
      status: item.status,
      teeth: has(actor, "patients.clinical") ? item.teeth : [],
    }));
}

export function getCaseHub(db: Database, actor: Actor, id: string): CaseHub {
  requirePermission(actor, "patients.read");
  const clinicalCase = db.cases.find((item) => item.id === id);
  if (!clinicalCase) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, clinicalCase.clinicId);
  const patient = db.patients.find((item) => item.id === clinicalCase.patientId);
  if (!patient) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  const clinical = has(actor, "patients.clinical");
  const costs = db.caseCosts.filter((cost) => cost.caseId === clinicalCase.id && cost.clinicId === actor.clinicId);
  const timeline: CaseHub["timeline"] = [
    { at: clinicalCase.createdAt, label: "فُتحت الحالة داخل العيادة." },
  ];
  for (const order of db.labOrders.filter((order) => order.caseId === clinicalCase.id && order.clinicId === actor.clinicId)) {
    timeline.push({
      at: order.timeline[0]?.at ?? order.dueAt,
      label: `مختبر: ${order.workType} — ${labStatusLabel[order.status]}`,
      href: `/app/services/orders/${order.id}`,
    });
  }
  for (const order of db.serviceOrders.filter((order) => order.caseId === clinicalCase.id && order.clinicId === actor.clinicId)) {
    timeline.push({
      at: order.timeline.at(-1)?.at ?? order.dueAt,
      label: `خدمة ${order.kind.toUpperCase()}: ${serviceStatusLabel[order.status]}`,
      href: `/app/services/orders/${order.id}`,
    });
  }
  for (const order of db.commerceOrders.filter((order) => order.caseId === clinicalCase.id && order.clinicId === actor.clinicId)) {
    timeline.push({
      at: order.createdAt,
      label: `مواد مرتبطة بالحالة — ${order.paymentStatus === "paid" ? "مدفوعة" : "غير مدفوعة"}`,
      href: `/app/orders/${order.id}`,
    });
  }
  for (const appointment of db.appointments.filter(
    (appointment) => appointment.patientId === patient.id && appointment.clinicId === actor.clinicId,
  )) {
    timeline.push({ at: appointment.startsAt, label: `موعد ${appointment.visitType}`, href: "/app/clinic/appointments" });
  }
  timeline.sort((a, b) => a.at.localeCompare(b.at));

  return {
    id: clinicalCase.id,
    code: clinicalCase.code,
    title: clinical ? clinicalCase.title : "حالة علاجية",
    status: clinicalCase.status,
    teeth: clinical ? clinicalCase.teeth : [],
    clinicalNotes: clinical ? clinicalCase.clinicalNotes : undefined,
    patient: {
      id: patient.id,
      name: patient.name,
      fileNumber: patient.fileNumber,
      phone: clinical ? patient.phone : undefined,
    },
    costs: {
      paid: costs.filter((cost) => cost.bucket === "paid").reduce((sum, cost) => sum + cost.amountIqd, 0),
      unpaid: costs.filter((cost) => cost.bucket === "unpaid").reduce((sum, cost) => sum + cost.amountIqd, 0),
      estimated: costs.filter((cost) => cost.bucket === "estimated").reduce((sum, cost) => sum + cost.amountIqd, 0),
      rows: clinical
        ? costs.map((cost) => ({ label: cost.label, bucket: cost.bucket, amountIqd: cost.amountIqd }))
        : [],
    },
    timeline,
  };
}
