import { z } from "zod";
import { AccessError, fail, ok, type Result } from "./errors";
import { audit, has, requirePermission, requireSameClinic, uid } from "./guard";
import type { Actor, Database, Patient, PatientView } from "./types";

const patientSchema = z.object({
  name: z.string().trim().min(3, "اكتب الاسم الثلاثي.").max(80),
  phone: z.string().trim().regex(/^07\d{9}$/, "اكتب رقماً عراقياً من 11 خانة يبدأ بـ 07."),
  sex: z.enum(["female", "male"], { errorMap: () => ({ message: "حدد الجنس." }) }),
  birthYear: z.coerce.number().int().min(1920, "سنة غير واقعية.").max(2026, "سنة غير واقعية."),
  fileNumber: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{2,20}$/, "رقم الملف بالأحرف اللاتينية والأرقام فقط."),
  medicalHistory: z.string().trim().max(2000).optional().default(""),
  allergies: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type PatientInput = z.infer<typeof patientSchema>;

function toView(actor: Actor, patient: Patient): PatientView {
  if (has(actor, "patients.clinical")) {
    return { access: "clinical", ...patient };
  }
  return {
    access: "desk",
    id: patient.id,
    clinicId: patient.clinicId,
    fileNumber: patient.fileNumber,
    name: patient.name,
    phone: patient.phone,
    sex: patient.sex,
    birthYear: patient.birthYear,
    consentStatus: patient.consentStatus,
    createdAt: patient.createdAt,
  };
}

export function listPatients(db: Database, actor: Actor, query = ""): PatientView[] {
  requirePermission(actor, "patients.read");
  const needle = query.trim();
  return db.patients
    .filter((patient) => patient.clinicId === actor.clinicId)
    .filter((patient) => {
      if (!needle) return true;
      return (
        patient.name.includes(needle) ||
        patient.phone.includes(needle) ||
        patient.fileNumber.toLowerCase().includes(needle.toLowerCase())
      );
    })
    .map((patient) => toView(actor, patient));
}

export function getPatient(db: Database, actor: Actor, id: string): PatientView {
  requirePermission(actor, "patients.read");
  const patient = db.patients.find((item) => item.id === id);
  if (!patient) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, patient.clinicId);
  if (has(actor, "patients.clinical")) {
    audit(db, actor, "patient.view", "patient", patient.id);
  }
  return toView(actor, patient);
}

export function registerDeskPatient(db: Database, actor: Actor, raw: unknown): Result<Patient> {
  requirePermission(actor, "patients.write");
  const name = typeof raw === "object" && raw && "name" in raw ? String((raw as { name?: unknown }).name ?? "") : "";
  const phone = typeof raw === "object" && raw && "phone" in raw ? String((raw as { phone?: unknown }).phone ?? "") : "";
  const count = db.patients.filter((patient) => patient.clinicId === actor.clinicId).length + 1;
  return createPatient(db, actor, {
    name,
    phone,
    sex: "female",
    birthYear: "1990",
    fileNumber: `D-${String(count).padStart(3, "0")}`,
  });
}

export function createPatient(db: Database, actor: Actor, raw: unknown): Result<Patient> {
  requirePermission(actor, "patients.write");
  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return fail("تحقق من الحقول.", fieldErrors);
  }
  const input = parsed.data;
  const duplicate = db.patients.some(
    (patient) => patient.clinicId === actor.clinicId && patient.fileNumber.toLowerCase() === input.fileNumber.toLowerCase(),
  );
  if (duplicate) return fail("رقم الملف مستخدم داخل عيادتك.", { fileNumber: "رقم مكرر." });

  const clinical = has(actor, "patients.clinical");
  const patient: Patient = {
    id: uid("pat"),
    clinicId: actor.clinicId!,
    fileNumber: input.fileNumber,
    name: input.name,
    phone: input.phone,
    sex: input.sex,
    birthYear: input.birthYear,
    medicalHistory: clinical ? input.medicalHistory : "",
    notes: clinical ? input.notes : "",
    allergies: clinical ? input.allergies : "",
    consentStatus: "pending",
    teeth: [],
    createdAt: new Date().toISOString(),
  };
  db.patients.push(patient);
  audit(db, actor, "patient.create", "patient", patient.id);
  return ok(patient);
}
