import { AccessError, fail, ok, type Result } from "./errors";
import { audit, clinicName, has, requirePermission, requireProvider, requireSameClinic, uid, userName } from "./guard";
import { identifierProblem } from "./identifiers";
import { validateAttachments } from "./lab";
import type { Actor, Attachment, Database, ServiceOrder, ServiceStatus } from "./types";
import { REGIONS } from "./types";

export interface ServiceOrderInput {
  kind: "cbct" | "opg" | "ortho";
  link: "case" | "patient" | "code";
  caseId?: string;
  patientId?: string;
  caseCode?: string;
  purpose: string;
  region?: string;
  instructions?: string;
  dueAt: string;
  priority: "normal" | "urgent";
  note?: string;
  shareConsent: boolean;
  attachments: Attachment[];
}

export interface ServiceOrderView {
  audience: "clinic" | "provider";
  id: string;
  clinicName: string;
  doctorName: string;
  providerName: string;
  kind: ServiceOrder["kind"];
  caseCode: string;
  purpose: string;
  region?: string;
  instructions: string;
  dueAt: string;
  priority: "normal" | "urgent";
  status: ServiceStatus;
  timeline: ServiceOrder["timeline"];
  attachments?: Attachment[];
  result?: ServiceOrder["result"];
  patientName?: string;
  caseId?: string;
}

const SERVICE_NEXT: Partial<Record<ServiceStatus, ServiceStatus[]>> = {
  submitted: ["accepted", "needs_info"],
  needs_info: ["accepted"],
  accepted: ["in_progress"],
  in_progress: ["result_ready"],
  result_ready: ["closed"],
};

function providerFor(db: Database, kind: ServiceOrder["kind"]) {
  return db.providers.find((provider) => provider.services.includes(kind));
}

function present(db: Database, order: ServiceOrder, audience: "clinic" | "provider", actor: Actor): ServiceOrderView {
  const patient = order.patientId ? db.patients.find((item) => item.id === order.patientId) : undefined;
  return {
    audience,
    id: order.id,
    clinicName: clinicName(db, order.clinicId),
    doctorName: userName(db, order.doctorId),
    providerName: db.providers.find((provider) => provider.id === order.providerId)?.name ?? "مزود",
    kind: order.kind,
    caseCode: order.caseCode,
    purpose: order.purpose,
    region: order.region,
    instructions: order.instructions,
    dueAt: order.dueAt,
    priority: order.priority,
    status: order.status,
    timeline: order.timeline,
    attachments: audience === "provider" || has(actor, "patients.clinical") ? order.attachments : undefined,
    result: order.result,
    patientName: audience === "clinic" && has(actor, "patients.clinical") ? patient?.name : undefined,
    caseId: audience === "clinic" ? order.caseId : undefined,
  };
}

function resolveLink(db: Database, actor: Actor, input: ServiceOrderInput): Result<{ patientId?: string; caseId?: string; caseCode: string }> {
  if (input.link === "case") {
    const clinicalCase = db.cases.find((item) => item.id === input.caseId && item.clinicId === actor.clinicId);
    if (!clinicalCase) return fail("الحالة غير متاحة ضمن عيادتك.", { caseId: "اختر حالة من عيادتك." });
    return ok({ patientId: clinicalCase.patientId, caseId: clinicalCase.id, caseCode: clinicalCase.code });
  }
  if (input.link === "patient") {
    const patient = db.patients.find((item) => item.id === input.patientId && item.clinicId === actor.clinicId);
    if (!patient) return fail("المريض غير متاح ضمن عيادتك.", { patientId: "اختر مريضاً من عيادتك." });
    return ok({ patientId: patient.id, caseCode: `CASE-${uid("c")}` });
  }
  const code = input.caseCode?.trim() ?? "";
  if (code.length < 3) return fail("اكتب رمز حالة.", { caseCode: "الرمز قصير." });
  if (identifierProblem(db, code)) return fail("رمز الحالة غير مقبول.", { caseCode: "رمز غير مقبول." });
  return ok({ caseCode: code });
}

export function createServiceOrder(db: Database, actor: Actor, input: ServiceOrderInput): Result<ServiceOrder> {
  requirePermission(actor, "lab.create");
  if (!input.shareConsent) return fail("يلزم تأكيد مشاركة الحد الأدنى مع مزود الخدمة.", { shareConsent: "الموافقة مطلوبة." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueAt)) return fail("التاريخ المطلوب غير صالح.", { dueAt: "حدد التاريخ." });
  const attachmentError = validateAttachments(input.attachments);
  if (attachmentError) return fail(attachmentError);
  const provider = providerFor(db, input.kind);
  if (!provider) return fail("لا يوجد مزود مفعّل لهذه الخدمة.");
  if (input.purpose.trim().length < 8) return fail("صف هدف الطلب بشكل أوضح.", { purpose: "الوصف قصير." });
  if (input.kind === "cbct" && !REGIONS.includes((input.region ?? "") as (typeof REGIONS)[number])) {
    return fail("حدد منطقة تصوير CBCT.", { region: "المنطقة مطلوبة." });
  }
  if (input.kind === "ortho" && (input.instructions?.trim().length ?? 0) < 20) {
    return fail("طلب التقويم يحتاج وصفاً أوضح لا يقل عن 20 حرفاً.", { instructions: "الوصف قصير." });
  }
  const noteProblem = identifierProblem(db, `${input.purpose}\n${input.instructions ?? ""}\n${input.note ?? ""}`);
  if (noteProblem) return fail(noteProblem);
  const linked = resolveLink(db, actor, input);
  if (!linked.ok) return linked;

  const order: ServiceOrder = {
    id: uid("svc"),
    clinicId: actor.clinicId!,
    doctorId: actor.id,
    providerId: provider.id,
    kind: input.kind,
    patientId: linked.data.patientId,
    caseId: linked.data.caseId,
    caseCode: linked.data.caseCode,
    purpose: input.purpose.trim(),
    region: input.region,
    instructions: (input.instructions ?? input.note ?? "").trim(),
    dueAt: `${input.dueAt}T12:00:00+03:00`,
    priority: input.priority,
    status: "submitted",
    attachments: input.attachments,
    timeline: [
      {
        id: uid("evt"),
        at: new Date().toISOString(),
        label: "أُرسل الطلب إلى المزود المتخصص مع الحقول اللازمة فقط.",
        actorName: actor.name,
        kind: "status",
      },
    ],
    shareConsent: true,
  };
  db.serviceOrders.push(order);
  audit(db, actor, "service.create", "service_order", order.id);
  return ok(order);
}

export function listClinicServiceOrders(db: Database, actor: Actor): ServiceOrderView[] {
  requirePermission(actor, "lab.read");
  return db.serviceOrders
    .filter((order) => order.clinicId === actor.clinicId)
    .map((order) => present(db, order, "clinic", actor));
}

export function getClinicServiceOrder(db: Database, actor: Actor, id: string): ServiceOrderView {
  requirePermission(actor, "lab.read");
  const order = db.serviceOrders.find((item) => item.id === id);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, order.clinicId);
  return present(db, order, "clinic", actor);
}

export function listProviderOrders(db: Database, actor: Actor): ServiceOrderView[] {
  requireProvider(actor);
  return db.serviceOrders
    .filter((order) => order.providerId === actor.providerId)
    .map((order) => present(db, order, "provider", actor));
}

export function getProviderOrder(db: Database, actor: Actor, id: string): ServiceOrderView {
  requireProvider(actor);
  const order = db.serviceOrders.find((item) => item.id === id);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (order.providerId !== actor.providerId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  return present(db, order, "provider", actor);
}

export function transitionService(
  db: Database,
  actor: Actor,
  orderId: string,
  to: ServiceStatus,
): Result<ServiceOrder> {
  requireProvider(actor);
  const order = db.serviceOrders.find((item) => item.id === orderId);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (order.providerId !== actor.providerId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  const allowed = SERVICE_NEXT[order.status] ?? [];
  if (!allowed.includes(to) || to === "result_ready") return fail("لا يمكن تنفيذ هذا الانتقال من هنا.");
  order.status = to;
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: to,
    actorName: actor.name,
    kind: "status",
  });
  audit(db, actor, "service.transition", "service_order", order.id);
  return ok(order);
}

export function uploadServiceResult(
  db: Database,
  actor: Actor,
  orderId: string,
  input: { summary: string; fileName?: string },
): Result<ServiceOrder> {
  requireProvider(actor);
  const order = db.serviceOrders.find((item) => item.id === orderId);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (order.providerId !== actor.providerId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  if (input.summary.trim().length < 10) return fail("اكتب ملخص النتيجة بما لا يقل عن 10 أحرف.");
  const problem = identifierProblem(db, `${input.summary} ${input.fileName ?? ""}`);
  if (problem) return fail(problem);
  order.result = {
    summary: input.summary.trim(),
    fileName: input.fileName ? input.fileName.slice(0, 80) : undefined,
    uploadedAt: new Date().toISOString(),
  };
  order.status = "result_ready";
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: "رُفعت النتيجة داخل الطلب.",
    actorName: actor.name,
    kind: "file",
  });
  audit(db, actor, "service.result", "service_order", order.id);
  return ok(order);
}
