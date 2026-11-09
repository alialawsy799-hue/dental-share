"use client";

import { useActionState, useState } from "react";
import { createRequestAction } from "@/lib/actions/services";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { MATERIALS, REGIONS, SHADES, WORK_TYPES } from "@/lib/domain/types";

const kinds = [
  { id: "lab", label: "المختبر المركزي" },
  { id: "ortho", label: "تقويم" },
  { id: "cbct", label: "CBCT" },
  { id: "opg", label: "OPG" },
] as const;

export function ServiceForm({
  kind,
  patients,
  cases,
}: {
  kind: string;
  patients: { id: string; label: string }[];
  cases: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createRequestAction, null);
  const [current, setCurrent] = useState(kinds.some((item) => item.id === kind) ? kind : "lab");
  const [link, setLink] = useState(cases.length ? "case" : "patient");
  const error = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
          {state.error}
        </p>
      ) : null}
      <fieldset>
        <legend className="mb-2 text-sm font-bold">نوع الخدمة</legend>
        <div className="flex flex-wrap gap-2">
          {kinds.map((item) => (
            <label key={item.id} className={`cursor-pointer rounded-full px-3 py-2 text-sm font-bold ring-1 ring-line ${current === item.id ? "bg-navy text-white" : "bg-white"}`}>
              <input className="sr-only" type="radio" name="kind" value={item.id} checked={current === item.id} onChange={() => setCurrent(item.id)} />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">الربط</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["case", "حالة قائمة"],
            ["patient", "مريض"],
            ["code", "رمز دون مريض"],
          ].map(([id, label]) => (
            <label key={id} className={`cursor-pointer rounded-full px-3 py-2 text-sm font-bold ring-1 ring-line ${link === id ? "bg-teal text-navy" : "bg-white"}`}>
              <input className="sr-only" type="radio" name="link" value={id} checked={link === id} onChange={() => setLink(id)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {link === "case" ? (
        <Field label="الحالة" error={error.caseId}>
          <select name="caseId" className={fieldClass} defaultValue={cases[0]?.id}>
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {link === "patient" ? (
        <Field label="المريض" error={error.patientId}>
          <select name="patientId" className={fieldClass} defaultValue={patients[0]?.id}>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {link === "code" ? (
        <Field label="رمز الحالة" hint="لا تستخدم رقم ملف أو هاتفاً" error={error.caseCode}>
          <input name="caseCode" dir="ltr" className={`${fieldClass} text-start`} />
        </Field>
      ) : null}
      {current === "lab" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نوع العمل" error={error.workType}>
            <select name="workType" className={fieldClass} defaultValue={WORK_TYPES[0]}>
              {WORK_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="الأسنان FDI" hint="مثال: 16، 15" error={error.teeth}>
            <input name="teeth" dir="ltr" className={`${fieldClass} text-start`} placeholder="16" />
          </Field>
          <Field label="اللون" error={error.shade}>
            <select name="shade" className={fieldClass} defaultValue="A2">
              {SHADES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="المادة" error={error.material}>
            <select name="material" className={fieldClass} defaultValue={MATERIALS[0]}>
              {MATERIALS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>
      ) : (
        <div className="grid gap-4">
          <Field label="هدف الطلب" error={error.purpose}>
            <textarea name="purpose" required minLength={8} rows={3} className={`${fieldClass} h-auto py-2`} />
          </Field>
          {current === "cbct" ? (
            <Field label="المنطقة" error={error.region}>
              <select name="region" className={fieldClass} defaultValue={REGIONS[0]}>
                {REGIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
          ) : null}
          {current === "ortho" ? (
            <Field label="تفاصيل الاستشارة" error={error.instructions}>
              <textarea name="instructions" minLength={20} rows={4} className={`${fieldClass} h-auto py-2`} />
            </Field>
          ) : null}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="التاريخ المطلوب" error={error.dueAt}>
          <input type="date" name="dueAt" required min="2026-11-05" defaultValue="2026-11-12" dir="ltr" className={fieldClass} />
        </Field>
        <Field label="الأولوية">
          <select name="priority" className={fieldClass} defaultValue="normal">
            <option value="normal">اعتيادي</option>
            <option value="urgent">عاجل</option>
          </select>
        </Field>
      </div>
      <Field label="ملاحظة للمشاركة" hint="اكتب اللازم فقط. سيُرفض رقم الهاتف أو اسم المريض." error={error.note}>
        <textarea name="note" rows={3} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <Field label="ملفات" hint="صور أو PDF أو STL حتى 15 ميغابايت. يُحفظ الاسم والحجم فقط في هذا العرض.">
        <input name="files" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.stl,application/pdf,image/*" className={fieldClass} />
      </Field>
      <label className="flex items-start gap-2 text-sm leading-7">
        <input name="shareConsent" type="checkbox" className="mt-1.5" required />
        <span>أؤكد مشاركة الحد الأدنى اللازم مع {current === "lab" ? "المختبر المركزي" : "مزود الخدمة"}، ومن دون فتح الملف الطبي الكامل.</span>
      </label>
      <SubmitButton>إرسال الطلب</SubmitButton>
    </form>
  );
}
