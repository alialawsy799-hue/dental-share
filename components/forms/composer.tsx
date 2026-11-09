"use client";

import { useActionState } from "react";
import { createPostAction } from "@/lib/actions/community";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function Composer() {
  const [state, action] = useActionState(createPostAction, null);
  return (
    <form action={action} className="grid gap-3">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="منشور مهني" hint="يُرفض رقم الهاتف واسم المريض ورقم الملف وأسماء ملفات المسح. المنشور الجديد يبقى قيد المراجعة." error={state?.fieldErrors?.body}>
        <textarea name="body" required minLength={20} rows={4} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="التخصص">
          <input name="specialty" className={fieldClass} placeholder="تعويضات" />
        </Field>
        <Field label="وسوم">
          <input name="tags" className={fieldClass} placeholder="تاج، زركونيا" />
        </Field>
      </div>
      <Field label="صورة اختيارية" hint="يُفحص اسم الملف فقط، ولا تُخزن الصورة في الذاكرة المؤقتة العامة.">
        <input name="image" type="file" accept="image/*" className={fieldClass} />
      </Field>
      <SubmitButton>إرسال للمراجعة</SubmitButton>
    </form>
  );
}
