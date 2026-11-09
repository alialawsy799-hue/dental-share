"use client";

import { useActionState } from "react";
import { createExpenseAction } from "@/lib/actions/clinic";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { DEMO_TODAY } from "@/lib/domain/types";

export function DeskExpenseForm() {
  const [state, action] = useActionState(createExpenseAction, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="returnTo" value="/desk/expenses" />
      <input type="hidden" name="bucket" value="paid" />
      <input type="hidden" name="category" value="operating" />
      <input type="hidden" name="occurredOn" value={DEMO_TODAY} />
      {state?.error ? (
        <p role="alert" className="sm:col-span-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="الصرفية" error={state?.fieldErrors?.description}>
        <input name="description" required className={fieldClass} placeholder="إيجار، مواد، صيانة…" />
      </Field>
      <Field label="المبلغ" error={state?.fieldErrors?.amountIqd}>
        <input name="amountIqd" required inputMode="numeric" dir="ltr" className={fieldClass} placeholder="50000" />
      </Field>
      <Field label="طريقة الدفع">
        <select name="fundFrom" className={fieldClass} defaultValue="income">
          <option value="income">من الدخل</option>
          <option value="external">من مكان خارجي</option>
        </select>
      </Field>
      <div className="sm:col-span-3">
        <SubmitButton>إضافة صرفة</SubmitButton>
      </div>
    </form>
  );
}
