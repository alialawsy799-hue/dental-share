import { AccessError, fail, ok, type Result } from "./errors";
import { audit, clinicName, has, requireLab, requirePermission, requireSameClinic, uid, userName } from "./guard";
import { identifierProblem, safeFileName } from "./identifiers";
import type { Actor, Attachment, Database, LabOrder, LabStatus } from "./types";
import { CENTRAL_LAB_ID, MATERIALS, SHADES, WORK_TYPES } from "./types";
import { upsertSourceExpense } from "./expenses";
import { labStatusLabel } from "./labels";

const FDI = /^(1[1-8]|2[1-8]|3[1-8]|4[1-8]|5[1-5]|6[1-5]|7[1-5]|8[1-5])$/;
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "model/stl", "application/sla", "application/octet-stream"]);

export interface LabOrderInput {
  link: "case" | "patient" | "code";
  caseId?: string;
  patientId?: string;
  caseCode?: string;
  workType: string;
  teeth: string[];
  shade: string;
  material: string;
  dueAt: string;
  priority: "normal" | "urgent";
  note?: string;
  shareConsent: boolean;
  attachments: Attachment[];
}

export type LabAudience = "clinic_clinical" | "clinic_finance" | "lab";

export interface LabOrderView {
  audience: LabAudience;
  id: string;
  clinicId: string;
  clinicName: string;
  doctorName: string;
  caseCode: string;
  workType: string;
  status: LabStatus;
  dueAt: string;
  priority: "normal" | "urgent";
  timeline: LabOrder["timeline"];
  invoice?: { id: string; amountIqd: number; status: "unpaid" | "paid" };
  technicianName?: string;
  teeth?: string[];
  shade?: string;
  material?: string;
  attachments?: Attachment[];
  clinicalNotes?: string;
  patientId?: string;
  patientName?: string;
  caseId?: string;
  remakeOf?: string;
  quoteIqd?: number;
}

const LAB_MOVES: Record<string, { to: LabStatus; by: "lab" | "clinic" }[]> = {
  submitted: [
    { to: "lab_review", by: "lab" },
    { to: "rejected", by: "lab" },
  ],
  lab_review: [
    { to: "accepted", by: "lab" },
    { to: "needs_revision", by: "lab" },
    { to: "rejected", by: "lab" },
    { to: "on_hold", by: "lab" },
  ],
  needs_revision: [{ to: "submitted", by: "clinic" }],
  accepted: [{ to: "preparing", by: "lab" }],
  preparing: [{ to: "design", by: "lab" }],
  design: [{ to: "awaiting_doctor_approval", by: "lab" }],
  awaiting_doctor_approval: [
    { to: "manufacturing", by: "clinic" },
    { to: "needs_revision", by: "clinic" },
  ],
  manufacturing: [{ to: "quality_check", by: "lab" }],
  quality_check: [{ to: "ready", by: "lab" }],
  ready: [{ to: "out_for_delivery", by: "lab" }],
  out_for_delivery: [{ to: "delivered", by: "lab" }],
  on_hold: [{ to: "lab_review", by: "lab" }],
};

function invoiceFor(db: Database, orderId: string) {
  return db.labInvoices.find((invoice) => invoice.labOrderId === orderId);
}

function present(db: Database, actor: Actor, order: LabOrder): LabOrderView {
  const invoice = invoiceFor(db, order.id);
  const technicianName = order.technicianId ? userName(db, order.technicianId) : undefined;
  const base = {
    id: order.id,
    clinicId: order.clinicId,
    clinicName: clinicName(db, order.clinicId),
    doctorName: userName(db, order.doctorId),
    caseCode: order.caseCode,
    workType: order.workType,
    status: order.status,
    dueAt: order.dueAt,
    priority: order.priority,
    timeline: order.timeline,
    invoice: invoice ? { id: invoice.id, amountIqd: invoice.amountIqd, status: invoice.status } : undefined,
    technicianName,
    quoteIqd: order.quoteIqd,
    remakeOf: order.remakeOf,
  };

  if (actor.role === "lab_manager" || actor.role === "lab_technician") {
    return {
      audience: "lab",
      ...base,
      teeth: order.teeth,
      shade: order.shade,
      material: order.material,
      attachments: order.attachments,
    };
  }

  if (has(actor, "patients.clinical")) {
    const patient = order.patientId ? db.patients.find((item) => item.id === order.patientId) : undefined;
    return {
      audience: "clinic_clinical",
      ...base,
      teeth: order.teeth,
      shade: order.shade,
      material: order.material,
      attachments: order.attachments,
      clinicalNotes: order.clinicalNotes,
      patientId: order.patientId,
      patientName: patient?.name,
      caseId: order.caseId,
    };
  }

  return { audience: "clinic_finance", ...base };
}

function loadForActor(db: Database, actor: Actor, id: string): LabOrder {
  const order = db.labOrders.find((item) => item.id === id);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");

  if (actor.role === "lab_manager" || actor.role === "lab_technician") {
    requireLab(actor);
    if (order.labId !== CENTRAL_LAB_ID) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
    if (actor.role === "lab_technician" && order.technicianId !== actor.id) {
      throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
    }
    return order;
  }

  requirePermission(actor, "lab.read");
  requireSameClinic(actor, order.clinicId);
  return order;
}

export function listClinicLabOrders(db: Database, actor: Actor): LabOrderView[] {
  requirePermission(actor, "lab.read");
  return db.labOrders
    .filter((order) => order.clinicId === actor.clinicId)
    .sort((a, b) => b.timeline[0]?.at.localeCompare(a.timeline[0]?.at ?? "") ?? 0)
    .map((order) => present(db, actor, order));
}

export function listLabInbox(db: Database, actor: Actor): LabOrderView[] {
  requireLab(actor);
  return db.labOrders
    .filter((order) => order.labId === actor.labId)
    .filter((order) => actor.role === "lab_manager" || order.technicianId === actor.id)
    .map((order) => present(db, actor, order));
}

export function getLabOrder(db: Database, actor: Actor, id: string): LabOrderView {
  return present(db, actor, loadForActor(db, actor, id));
}

export function validateAttachments(attachments: Attachment[]): string | null {
  if (attachments.length > 3) return "الحد الأقصى ثلاثة ملفات.";
  for (const file of attachments) {
    if (file.size <= 0 || file.size > 15 * 1024 * 1024) return "حجم الملف يتجاوز 15 ميغابايت أو أنه فارغ.";
    if (file.mime && !ALLOWED_MIME.has(file.mime)) return "نوع الملف غير مسموح. المسموح صور أو PDF أو STL.";
    const name = safeFileName(file.name);
    if (/\.(stl|dcm|dicom)$/i.test(name) && /pat_|patient|ملف/i.test(name)) {
      return "اسم ملف المسح يبدو معرّفاً. أعد تسميته قبل الإرفاق.";
    }
  }
  return null;
}

export function createLabOrder(db: Database, actor: Actor, input: LabOrderInput): Result<LabOrder> {
  requirePermission(actor, "lab.create");
  if (!input.shareConsent) return fail("يلزم تأكيد مشاركة الحد الأدنى من بيانات الحالة مع المختبر.", { shareConsent: "الموافقة مطلوبة." });
  if (!WORK_TYPES.includes(input.workType as (typeof WORK_TYPES)[number])) return fail("نوع العمل غير معروف.", { workType: "اختر نوع العمل." });
  if (!SHADES.includes(input.shade as (typeof SHADES)[number])) return fail("درجة اللون غير معروفة.", { shade: "اختر اللون." });
  if (!MATERIALS.includes(input.material as (typeof MATERIALS)[number])) return fail("المادة غير معروفة.", { material: "اختر المادة." });
  if (!input.teeth.length || input.teeth.some((tooth) => !FDI.test(tooth))) {
    return fail("اكتب أسنان FDI صحيحة، مثل 16 أو 21.", { teeth: "ترقيم FDI غير صالح." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueAt)) return fail("تاريخ التسليم غير صالح.", { dueAt: "حدد التاريخ." });
  const attachmentError = validateAttachments(input.attachments);
  if (attachmentError) return fail(attachmentError, { attachments: attachmentError });
  const note = input.note?.trim() ?? "";
  if (note) {
    const problem = identifierProblem(db, note);
    if (problem) return fail(problem, { note: problem });
  }

  let patientId: string | undefined;
  let caseId: string | undefined;
  let caseCode = "";

  if (input.link === "case") {
    const clinicalCase = db.cases.find((item) => item.id === input.caseId && item.clinicId === actor.clinicId);
    if (!clinicalCase) return fail("الحالة غير متاحة ضمن عيادتك.", { caseId: "اختر حالة من عيادتك." });
    patientId = clinicalCase.patientId;
    caseId = clinicalCase.id;
    caseCode = clinicalCase.code;
  } else if (input.link === "patient") {
    const patient = db.patients.find((item) => item.id === input.patientId && item.clinicId === actor.clinicId);
    if (!patient) return fail("المريض غير متاح ضمن عيادتك.", { patientId: "اختر مريضاً من عيادتك." });
    patientId = patient.id;
    caseCode = `CASE-${uid("c")}`;
  } else {
    const code = input.caseCode?.trim() ?? "";
    if (code.length < 3) return fail("اكتب رمز حالة من 3 أحرف على الأقل.", { caseCode: "الرمز قصير." });
    const problem = identifierProblem(db, code);
    if (problem) return fail("رمز الحالة يجب ألا يكون رقم هاتف أو رقم ملف مريض.", { caseCode: "رمز غير مقبول." });
    caseCode = code;
  }

  const order: LabOrder = {
    id: uid("lab"),
    labId: CENTRAL_LAB_ID,
    clinicId: actor.clinicId!,
    doctorId: actor.id,
    patientId,
    caseId,
    caseCode,
    workType: input.workType,
    teeth: input.teeth,
    shade: input.shade,
    material: input.material,
    dueAt: `${input.dueAt}T12:00:00+03:00`,
    priority: input.priority,
    status: "submitted",
    clinicalNotes: note || undefined,
    shareConsent: true,
    attachments: input.attachments.map((file) => ({ ...file, name: safeFileName(file.name) })),
    timeline: [
      {
        id: uid("evt"),
        at: new Date().toISOString(),
        label: "أُرسل الطلب إلى المختبر المركزي بموافقة مشاركة الحد الأدنى.",
        actorName: actor.name,
        kind: "status",
      },
    ],
  };
  db.labOrders.push(order);
  audit(db, actor, "lab.create", "lab_order", order.id);
  return ok(order);
}

export function transitionLab(
  db: Database,
  actor: Actor,
  orderId: string,
  to: LabStatus,
  reason?: string,
): Result<LabOrder> {
  const order = db.labOrders.find((item) => item.id === orderId);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  const allowed = (LAB_MOVES[order.status] ?? []).find((move) => move.to === to);
  if (!allowed) return fail("لا يمكن الانتقال إلى هذه المرحلة من الوضع الحالي.");
  if (["rejected", "on_hold", "needs_revision"].includes(to) && (!reason || reason.trim().length < 3)) {
    return fail("اكتب سبباً واضحاً لهذا القرار.");
  }

  if (allowed.by === "lab") {
    requireLab(actor);
    if (order.labId !== actor.labId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
    if (actor.role === "lab_technician" && order.technicianId !== actor.id) {
      throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
    }
  } else {
    requirePermission(actor, "lab.create");
    requireSameClinic(actor, order.clinicId);
  }

  order.status = to;
  if (to === "manufacturing" || to === "needs_revision") {
    for (const notice of db.notifications) {
      if (!notice.href.includes(order.id) || !notice.title.includes("بانتظار اعتماد")) continue;
      notice.read = true;
      notice.title = to === "manufacturing" ? "اعتُمد التصميم" : "طُلب تعديل التصميم";
      notice.body = to === "manufacturing" ? `انتقل ${order.caseCode} إلى التصنيع.` : `أُعيد ${order.caseCode} للتعديل.`;
    }
  }
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: reason?.trim() ? `${labStatusLabel[to]} — ${reason.trim()}` : labStatusLabel[to],
    actorName: actor.name,
    kind: "status",
  });
  audit(db, actor, "lab.transition", "lab_order", order.id);
  return ok(order);
}

export function assignTechnician(db: Database, actor: Actor, orderId: string, technicianId: string): Result<LabOrder> {
  requireLab(actor);
  if (actor.role !== "lab_manager") throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  const order = db.labOrders.find((item) => item.id === orderId && item.labId === CENTRAL_LAB_ID);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  const technician = db.users.find((user) => user.id === technicianId && user.role === "lab_technician" && user.labId === CENTRAL_LAB_ID);
  if (!technician) return fail("الفني غير متاح في المختبر المركزي.");
  order.technicianId = technician.id;
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: `عُيّن الفني ${technician.name}.`,
    actorName: actor.name,
    kind: "system",
  });
  audit(db, actor, "lab.assign", "lab_order", order.id);
  return ok(order);
}

export function addLabNote(db: Database, actor: Actor, orderId: string, note: string): Result<LabOrder> {
  const order = loadForActor(db, actor, orderId);
  if (actor.role === "clinic_accountant") return fail("حساب المحاسب يرى الفاتورة دون إضافة ملاحظات سريرية.");
  const problem = identifierProblem(db, note);
  if (problem) return fail(problem);
  if (note.trim().length < 3) return fail("الملاحظة قصيرة.");
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: note.trim(),
    actorName: actor.name,
    kind: "note",
  });
  audit(db, actor, "lab.note", "lab_order", order.id);
  return ok(order);
}

export function issueLabInvoice(db: Database, actor: Actor, orderId: string, amountIqd: number): Result<{ invoiceId: string }> {
  requireLab(actor);
  if (actor.role !== "lab_manager") throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  const order = db.labOrders.find((item) => item.id === orderId && item.labId === CENTRAL_LAB_ID);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (!Number.isInteger(amountIqd) || amountIqd <= 0) return fail("مبلغ الفاتورة غير صالح.");
  const existing = invoiceFor(db, order.id);
  if (existing) return ok({ invoiceId: existing.id });
  const invoice = {
    id: uid("inv"),
    clinicId: order.clinicId,
    labOrderId: order.id,
    amountIqd,
    status: "unpaid" as const,
    issuedOn: new Date().toISOString().slice(0, 10),
  };
  db.labInvoices.push(invoice);
  upsertSourceExpense(db, order.clinicId, {
    category: "lab",
    bucket: "unpaid",
    amountIqd,
    description: `فاتورة مختبر ${order.caseCode}`,
    sourceType: "lab_invoice",
    sourceId: invoice.id,
    occurredOn: invoice.issuedOn,
  });
  order.quoteIqd = amountIqd;
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: "صدرت فاتورة مستحقة ولم تُحسب مصروفاً مدفوعاً.",
    actorName: actor.name,
    kind: "system",
  });
  audit(db, actor, "lab.invoice", "lab_invoice", invoice.id);
  return ok({ invoiceId: invoice.id });
}

export function payLabInvoice(db: Database, actor: Actor, invoiceId: string): Result<{ invoiceId: string }> {
  requirePermission(actor, "expenses.write");
  const invoice = db.labInvoices.find((item) => item.id === invoiceId);
  if (!invoice) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, invoice.clinicId);
  invoice.status = "paid";
  upsertSourceExpense(db, invoice.clinicId, {
    category: "lab",
    bucket: "paid",
    amountIqd: invoice.amountIqd,
    description: `فاتورة مختبر مدفوعة`,
    sourceType: "lab_invoice",
    sourceId: invoice.id,
    occurredOn: new Date().toISOString().slice(0, 10),
  });
  audit(db, actor, "lab.pay", "lab_invoice", invoice.id);
  return ok({ invoiceId: invoice.id });
}

export function requestRemake(db: Database, actor: Actor, orderId: string, reason: string): Result<LabOrder> {
  requirePermission(actor, "lab.create");
  const original = db.labOrders.find((item) => item.id === orderId);
  if (!original) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, original.clinicId);
  if (original.status !== "delivered") return fail("إعادة الصنع متاحة بعد تسليم الطلب الأصلي.");
  if (reason.trim().length < 8) return fail("اكتب سبب إعادة الصنع بوضوح.");
  const problem = identifierProblem(db, reason);
  if (problem) return fail(problem);
  const order: LabOrder = {
    ...original,
    id: uid("lab"),
    status: "submitted",
    remakeOf: original.id,
    remakeReason: reason.trim(),
    technicianId: undefined,
    clinicalNotes: undefined,
    timeline: [
      {
        id: uid("evt"),
        at: new Date().toISOString(),
        label: `طلب إعادة صنع مرتبط بـ ${original.caseCode}: ${reason.trim()}`,
        actorName: actor.name,
        kind: "status",
      },
    ],
    attachments: [],
  };
  db.labOrders.push(order);
  audit(db, actor, "lab.remake", "lab_order", order.id);
  return ok(order);
}

export function listTechnicians(db: Database, actor: Actor): { id: string; name: string }[] {
  requireLab(actor);
  return db.users
    .filter((user) => user.role === "lab_technician" && user.labId === CENTRAL_LAB_ID)
    .map((user) => ({ id: user.id, name: user.name }));
}
