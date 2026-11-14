import { fail, ok, type Result } from "./errors";
import { identifierProblem, safeFileName } from "./identifiers";
import { requirePermission, uid } from "./guard";
import type { Actor, Attachment, Database, ZipCaseRequest } from "./types";

const ZIP_MIME = new Set(["application/zip", "application/x-zip-compressed", "application/x-zip", "application/octet-stream"]);

export function createZipCaseRequest(
  db: Database,
  actor: Actor,
  input: { note: string; file?: Attachment },
): Result<ZipCaseRequest> {
  requirePermission(actor, "lab.create");
  const note = input.note.trim();
  if (note.length < 8) return fail("اكتب ملاحظة أوضح لا تقل عن 8 أحرف.", { note: "الملاحظة قصيرة." });
  const problem = identifierProblem(db, note);
  if (problem) return fail(problem, { note: problem });
  const file = input.file;
  if (!file) return fail("أرفق ملف ZIP.", { file: "الملف مطلوب." });
  if (file.size <= 0 || file.size > 15 * 1024 * 1024) {
    return fail("حجم الملف يتجاوز 15 ميغابايت أو أنه فارغ.", { file: "حجم غير صالح." });
  }
  if (!/\.zip$/i.test(file.name) || (file.mime && !ZIP_MIME.has(file.mime))) {
    return fail("الملف يجب أن يكون ZIP.", { file: "صيغة ZIP فقط." });
  }
  const row: ZipCaseRequest = {
    id: uid("zip"),
    clinicId: actor.clinicId!,
    doctorId: actor.id,
    note,
    file: { ...file, name: safeFileName(file.name) },
    createdAt: new Date().toISOString(),
    status: "submitted",
  };
  db.zipRequests.push(row);
  return ok(row);
}
