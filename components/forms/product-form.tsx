"use client";

import { useActionState } from "react";
import { saveProductAction } from "@/lib/actions/commerce";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function ProductForm() {
  const [state, action] = useActionState(saveProductAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="الاسم" error={state?.fieldErrors?.name}>
        <input name="name" required className={fieldClass} />
      </Field>
      <Field label="العلامة">
        <input name="brand" className={fieldClass} />
      </Field>
      <Field label="الفئة">
        <input name="category" className={fieldClass} />
      </Field>
      <Field label="السعر بالدينار" error={state?.fieldErrors?.priceIqd}>
        <input name="priceIqd" required inputMode="numeric" dir="ltr" className={fieldClass} />
      </Field>
      <Field label="المخزون" error={state?.fieldErrors?.stock}>
        <input name="stock" required inputMode="numeric" dir="ltr" className={fieldClass} defaultValue="0" />
      </Field>
      <Field label="الوحدة">
        <input name="unit" className={fieldClass} defaultValue="وحدة" />
      </Field>
      <Field label="SKU">
        <input name="sku" dir="ltr" className={fieldClass} />
      </Field>
      <Field label="وصف">
        <input name="description" className={fieldClass} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton>نشر المنتج</SubmitButton>
      </div>
    </form>
  );
}
