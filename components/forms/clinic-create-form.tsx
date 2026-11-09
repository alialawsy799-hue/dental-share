"use client";

import { useActionState } from "react";
import { createClinicAction } from "@/lib/actions/admin";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function ClinicCreateForm() {
  const [state, action] = useActionState(createClinicAction, null);
  const error = state?.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="اسم العيادة" error={error.name}>
        <input name="name" required className={fieldClass} placeholder="عيادة الأمل لطب الأسنان" />
      </Field>
      <Field label="التخصص" error={error.specialty}>
        <input name="specialty" className={fieldClass} defaultValue="طب أسنان عام" />
      </Field>
      <Field label="المدينة" error={error.city}>
        <input name="city" required className={fieldClass} placeholder="بغداد" />
      </Field>
      <Field label="الحي" error={error.district}>
        <input name="district" required className={fieldClass} placeholder="الكرادة" />
      </Field>
      <Field label="هاتف العيادة" hint="11 خانة تبدأ بـ 07" error={error.phone}>
        <input name="phone" required inputMode="numeric" dir="ltr" className={`${fieldClass} text-start`} placeholder="07810001001" />
      </Field>
      <Field label="الفرع" error={error.branchName}>
        <input name="branchName" className={fieldClass} defaultValue="الفرع الرئيسي" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="العنوان" error={error.address}>
          <input name="address" required className={fieldClass} placeholder="الحي، الشارع، رقم البناء" />
        </Field>
      </div>
      <Field label="اسم طبيب العيادة" error={error.doctorName}>
        <input name="doctorName" required className={fieldClass} placeholder="د. سامي ناجي" />
      </Field>
      <Field label="بريد الطبيب" hint="يُولَّد تلقائياً إذا تُرك فارغاً" error={error.doctorEmail}>
        <input name="doctorEmail" type="email" dir="ltr" className={`${fieldClass} text-start`} placeholder="dr.amal@dentalshare.demo" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="إيميل نظام الحجوزات" hint="يفتح نظام الحجوزات. يُولَّد تلقائياً إذا تُرك فارغاً، مثل amal.clinic@dentalshare.demo" error={error.systemEmail}>
          <input name="systemEmail" type="email" dir="ltr" className={`${fieldClass} text-start`} placeholder="amal.clinic@dentalshare.demo" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="جارٍ إنشاء العيادة…">إنشاء العيادة والحسابات</SubmitButton>
      </div>
    </form>
  );
}
