import type { Database } from "./types";

export function identifierProblem(db: Database, text: string): string | null {
  const compact = text.replace(/[\s-]/g, "");
  if (/(?:\+?964)?07\d{9}/.test(compact)) {
    return "النص يحتوي رقم هاتف. أزله قبل المتابعة.";
  }
  if (/ملف\s*[#:]?\s*[A-Za-z]{0,3}-?\d{3,}/i.test(text) || /\b[A-Za-z]{1,3}-\d{3,}\b/.test(text)) {
    return "النص يحتوي رقم ملف. أزله قبل المتابعة.";
  }
  if (/patient[\s_-]*id/i.test(text) || /رقم\s*وطني/.test(text)) {
    return "النص يحتوي معرّفاً شخصياً. أزله قبل المتابعة.";
  }
  if (/\.(stl|dcm|dicom|exe|zip)\b/i.test(text) || /dicom/i.test(text)) {
    return "اسم الملف قد يكشف هوية أو بيانات تصوير. أعد تسميته اسماً محايداً.";
  }
  for (const patient of db.patients) {
    if (
      text.includes(patient.name) ||
      text.includes(patient.phone) ||
      text.includes(patient.fileNumber)
    ) {
      return "النص يطابق بيانات تعريفية لمريض. أزل الاسم ورقم الملف ورقم الهاتف.";
    }
  }
  return null;
}

export function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^\w.\u0600-\u06FF-]+/g, "_").slice(0, 80);
}
