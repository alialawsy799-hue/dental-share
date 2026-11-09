"use client";

import { useActionState } from "react";
import { labNoteAction, remakeAction } from "@/lib/actions/services";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function NoteForm({ id, returnTo }: { id: string; returnTo: string }) {
  const [state, action] = useActionState(labNoteAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="ملاحظة داخل الطلب" hint="لا تكتب هاتفاً أو اسم مريض أو رقم ملف.">
        <textarea name="note" rows={3} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <SubmitButton>إضافة الملاحظة</SubmitButton>
    </form>
  );
}

export function RemakeForm({ id }: { id: string }) {
  const [state, action] = useActionState(remakeAction, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={id} />
      {state?.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="سبب إعادة الصنع">
        <textarea name="reason" rows={3} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <SubmitButton>طلب إعادة صنع</SubmitButton>
    </form>
  );
}
