"use client";

import { useActionState } from "react";
import { uploadResultAction } from "@/lib/actions/community";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function ResultForm({ id }: { id: string }) {
  const [state, action] = useActionState(uploadResultAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="ملخص النتيجة" hint="لا تُدرج اسم المريض أو رقم هاتفه في اسم الملف.">
        <textarea name="summary" required minLength={10} rows={4} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <Field label="ملف النتيجة" hint="يُسجل الاسم فقط في هذا العرض.">
        <input type="file" name="file" className={fieldClass} />
      </Field>
      <SubmitButton>رفع النتيجة</SubmitButton>
    </form>
  );
}
