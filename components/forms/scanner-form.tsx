"use client";

import { useActionState, useState } from "react";
import { createScannerAction } from "@/lib/actions/services";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function ScannerForm({
  patients,
  cases,
}: {
  patients: { id: string; label: string }[];
  cases: { id: string; label: string }[];
}) {
  const [state, action] = useActionState(createScannerAction, null);
  const [mode, setMode] = useState<"courier" | "booking">("courier");
  const [link, setLink] = useState("none");
  const error = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
          {state.error}
        </p>
      ) : null}
      <fieldset>
        <legend className="mb-2 text-sm font-bold">نوع الطلب</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["courier", "مندوب سكنر للعيادة"],
              ["booking", "حجز في المختبر"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className={`cursor-pointer rounded-full px-3 py-2 text-sm font-bold ring-1 ring-line ${mode === id ? "bg-navy text-white" : "bg-white"}`}>
              <input className="sr-only" type="radio" name="mode" value={id} checked={mode === id} onChange={() => setMode(id)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">الربط</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["none", "بدون ربط"],
            ["case", "حالة قائمة"],
            ["patient", "مريض"],
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="التاريخ" error={error.dueAt}>
          <input type="date" name="dueAt" required min="2026-11-05" defaultValue="2026-11-12" dir="ltr" className={fieldClass} />
        </Field>
        <Field label="الوقت" hint={mode === "booking" ? "موعد الحضور للمختبر" : "وقت زيارة المندوب"} error={error.time}>
          <input type="time" name="time" defaultValue="10:30" dir="ltr" className={fieldClass} />
        </Field>
      </div>
      <Field label="الملاحظات" hint="اكتب المطلوب من السكنر دون اسم المريض أو رقم هاتفه." error={error.note}>
        <textarea name="note" required minLength={8} rows={4} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <SubmitButton>إرسال الطلب</SubmitButton>
    </form>
  );
}
