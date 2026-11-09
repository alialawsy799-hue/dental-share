"use client";

import { useActionState } from "react";
import { createExpenseAction } from "@/lib/actions/clinic";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function ExpenseForm() {
  const [state, action] = useActionState(createExpenseAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="الوصف" error={state?.fieldErrors?.description}>
        <input name="description" required className={fieldClass} />
      </Field>
      <Field label="المبلغ بالدينار" error={state?.fieldErrors?.amountIqd}>
        <input name="amountIqd" required inputMode="numeric" dir="ltr" className={fieldClass} />
      </Field>
      <Field label="الحالة">
        <select name="bucket" className={fieldClass} defaultValue="paid">
          <option value="paid">مدفوع</option>
          <option value="unpaid">غير مدفوع</option>
          <option value="estimated">تقديري</option>
        </select>
      </Field>
      <Field label="التصنيف">
        <select name="category" className={fieldClass} defaultValue="operating">
          <option value="operating">تشغيلي</option>
          <option value="other">أخرى</option>
        </select>
      </Field>
      <Field label="التاريخ">
        <input type="date" name="occurredOn" defaultValue="2026-11-05" dir="ltr" className={fieldClass} />
      </Field>
      <div className="self-end">
        <SubmitButton>إضافة مصروف يدوي</SubmitButton>
      </div>
    </form>
  );
}
