import { AccessError, fail, ok, type Result } from "./errors";
import { identifierProblem } from "./identifiers";
import { requirePermission, uid } from "./guard";
import type { Actor, Database, ScannerRequest } from "./types";

export interface ScannerInput {
  mode: "courier" | "booking";
  dueAt: string;
  time?: string;
  note: string;
  location?: string;
  link: "case" | "patient" | "none";
  caseId?: string;
  patientId?: string;
}

export function listClinicScannerRequests(db: Database, actor: Actor): ScannerRequest[] {
  requirePermission(actor, "lab.read");
  return db.scannerRequests
    .filter((item) => item.clinicId === actor.clinicId)
    .filter((item) => actor.role !== "clinic_doctor" || item.doctorId === actor.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getScannerRequest(db: Database, actor: Actor, id: string): ScannerRequest {
  requirePermission(actor, "lab.read");
  const row = db.scannerRequests.find((item) => item.id === id && item.clinicId === actor.clinicId);
  if (!row) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (actor.role === "clinic_doctor" && row.doctorId !== actor.id) {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
  return row;
}

export function createScannerRequest(db: Database, actor: Actor, input: ScannerInput): Result<ScannerRequest> {
  requirePermission(actor, "lab.create");
  if (input.mode !== "courier" && input.mode !== "booking") return fail("اختر زيارة مندوب أو حجز موعد.", { mode: "مطلوب." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dueAt)) return fail("حدد تاريخ الزيارة أو الحجز.", { dueAt: "حدد التاريخ." });
  const time = input.time?.trim() ?? "";
  if (time && !/^\d{2}:\d{2}$/.test(time)) return fail("الوقت غير صالح.", { time: "مثل 10:30." });
  const note = input.note.trim();
  if (note.length < 8) return fail("اكتب ملاحظة أوضح لا تقل عن 8 أحرف.", { note: "الملاحظة قصيرة." });
  const problem = identifierProblem(db, note);
  if (problem) return fail(problem, { note: problem });

  let caseCode = "SCAN";
  let caseId: string | undefined;
  let patientId: string | undefined;
  if (input.link === "case") {
    const clinicalCase = db.cases.find((item) => item.id === input.caseId && item.clinicId === actor.clinicId);
    if (!clinicalCase) return fail("الحالة غير متاحة ضمن عيادتك.", { caseId: "اختر حالة من عيادتك." });
    caseId = clinicalCase.id;
    patientId = clinicalCase.patientId;
    caseCode = clinicalCase.code;
  } else if (input.link === "patient") {
    const patient = db.patients.find((item) => item.id === input.patientId && item.clinicId === actor.clinicId);
    if (!patient) return fail("المريض غير متاح ضمن عيادتك.", { patientId: "اختر مريضاً من عيادتك." });
    patientId = patient.id;
    caseCode = `SCAN-${uid("c")}`;
  }

  const hour = time || "10:00";
  const row: ScannerRequest = {
    id: uid("scan"),
    clinicId: actor.clinicId!,
    doctorId: actor.id,
    mode: input.mode,
    dueAt: `${input.dueAt}T${hour}:00+03:00`,
    note,
    location: input.location,
    caseCode,
    caseId,
    patientId,
    status: "submitted",
    createdAt: new Date().toISOString(),
  };
  db.scannerRequests.push(row);
  return ok(row);
}

export function createCourierNow(
  db: Database,
  actor: Actor,
  input: { note: string; location: string },
): Result<ScannerRequest> {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  const baghdad = `${pick("year")}-${pick("month")}-${pick("day")}`;
  const clock = `${pick("hour")}:${pick("minute")}`;
  return createScannerRequest(db, actor, {
    mode: "courier",
    dueAt: baghdad,
    time: clock,
    note: input.note,
    location: input.location,
    link: "none",
  });
}
