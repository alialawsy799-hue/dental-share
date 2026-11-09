"use client";

import { useActionState } from "react";
import { registerDeskPatientAction } from "@/lib/actions/clinic";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function DeskPatientForm() {
  const [state, action] = useActionState(registerDeskPatientAction, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="اسم المريض" error={state?.fieldErrors?.name}>
        <input name="name" required className={fieldClass} autoComplete="name" placeholder="الاسم الثلاثي" />
      </Field>
      <Field label="رقم الهاتف" hint="11 خانة تبدأ بـ 07" error={state?.fieldErrors?.phone}>
        <input name="phone" required inputMode="numeric" dir="ltr" className={`${fieldClass} text-start`} placeholder="07701234567" />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton>تسجيل المريض</SubmitButton>
      </div>
    </form>
  );
}
