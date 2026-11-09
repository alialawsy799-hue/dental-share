"use client";

import { useActionState } from "react";
import { checkoutAction } from "@/lib/actions/commerce";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function CheckoutForm({ cases, address }: { cases: { id: string; label: string }[]; address: string }) {
  const [state, action] = useActionState(checkoutAction, null);
  return (
    <form action={action} className="grid gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="عنوان الاستلام" error={state?.fieldErrors?.address}>
        <input name="address" required defaultValue={address} className={fieldClass} />
      </Field>
      <Field label="طريقة الدفع" hint="لا توجد بوابة دفع في هذه النسخة.">
        <select name="paymentMethod" className={fieldClass} defaultValue="cod">
          <option value="cod">الدفع عند الاستلام</option>
          <option value="manual_transfer">تحويل يوثَّق يدوياً</option>
        </select>
      </Field>
      <Field label="ربط بحالة علاجية" hint="اختياري، ويبقى داخل العيادة ولا يُعرض للتاجر.">
        <select name="caseId" className={fieldClass} defaultValue="">
          <option value="">بدون ربط</option>
          {cases.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <SubmitButton>تأكيد الطلب</SubmitButton>
    </form>
  );
}
