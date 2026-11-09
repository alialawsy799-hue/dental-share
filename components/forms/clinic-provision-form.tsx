"use client";

import { useActionState } from "react";
import { provisionClinicAction } from "@/lib/actions/admin";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";

export function ClinicProvisionForm({
  clinicId,
  clinicName,
  compact = false,
}: {
  clinicId: string;
  clinicName: string;
  compact?: boolean;
}) {
  const [state, action] = useActionState(provisionClinicAction, null);
  const error = state?.fieldErrors ?? {};
  return (
    <form action={action} className={compact ? "grid gap-3" : "grid gap-4 sm:grid-cols-2"}>
      <input type="hidden" name="clinicId" value={clinicId} />
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="اسم طبيب العيادة" error={error.doctorName}>
        <input name="doctorName" required className={fieldClass} placeholder="د. هدى سالم" />
      </Field>
      {compact ? null : (
        <>
          <Field label="بريد الطبيب" hint="اختياري" error={error.doctorEmail}>
            <input name="doctorEmail" type="email" dir="ltr" className={`${fieldClass} text-start`} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="إيميل نظام الحجوزات" hint="يفتح /desk — إن تُرك فارغاً يُولَّد من اسم العيادة" error={error.systemEmail}>
              <input name="systemEmail" type="email" dir="ltr" className={`${fieldClass} text-start`} />
            </Field>
          </div>
        </>
      )}
      <div className={compact ? "" : "sm:col-span-2"}>
        <SubmitButton pendingLabel="جارٍ إنشاء الحسابات…">إنشاء نظام الحجوزات وحساب الطبيب لـ {clinicName}</SubmitButton>
      </div>
    </form>
  );
}
