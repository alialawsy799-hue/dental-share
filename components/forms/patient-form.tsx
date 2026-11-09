"use client";

import { useActionState } from "react";
import { createPatientAction } from "@/lib/actions/clinic";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function PatientForm({ clinical, returnTo }: { clinical: boolean; returnTo?: string }) {
  const [state, action] = useActionState(createPatientAction, null);
  const error = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="الاسم" error={error.name}>
        <input name="name" required className={fieldClass} autoComplete="name" />
      </Field>
      <Field label="الهاتف" hint="11 خانة تبدأ بـ 07" error={error.phone}>
        <input name="phone" required inputMode="numeric" dir="ltr" className={`${fieldClass} text-start`} placeholder="07701234567" />
      </Field>
      <Field label="الجنس" error={error.sex}>
        <select name="sex" className={fieldClass} defaultValue="female">
          <option value="female">أنثى</option>
          <option value="male">ذكر</option>
        </select>
      </Field>
      <Field label="سنة الميلاد" error={error.birthYear}>
        <input name="birthYear" required inputMode="numeric" dir="ltr" className={`${fieldClass} text-start`} defaultValue="1990" />
      </Field>
      <Field label="رقم الملف" hint="أحرف لاتينية وأرقام، مثل A-1200" error={error.fileNumber}>
        <input name="fileNumber" required dir="ltr" className={`${fieldClass} text-start`} />
      </Field>
      {clinical ? (
        <>
          <Field label="الحساسية" error={error.allergies}>
            <input name="allergies" className={fieldClass} />
          </Field>
          <Field label="تاريخ طبي مختصر" error={error.medicalHistory}>
            <textarea name="medicalHistory" rows={3} className={`${fieldClass} h-auto py-2`} />
          </Field>
          <Field label="ملاحظات سريرية" error={error.notes}>
            <textarea name="notes" rows={3} className={`${fieldClass} h-auto py-2`} />
          </Field>
        </>
      ) : (
        <p className="sm:col-span-2 text-sm leading-7 text-muted">حساب الاستقبال يحفظ بيانات التواصل فقط، ولا يحتفظ بالتاريخ الطبي.</p>
      )}
      <div className="sm:col-span-2">
        <SubmitButton>حفظ المريض</SubmitButton>
      </div>
    </form>
  );
}
