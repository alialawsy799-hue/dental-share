"use client";

import { useActionState } from "react";
import { createAppointmentAction } from "@/lib/actions/clinic";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { DEMO_TODAY, VISIT_TYPES } from "@/lib/domain/types";

export function AppointmentForm({
  patients,
  doctors,
  chairs,
  date,
  returnTo,
}: {
  patients: { id: string; label: string }[];
  doctors: { id: string; name: string }[];
  chairs: { id: string; name: string }[];
  date: string;
  returnTo?: string;
}) {
  const [state, action] = useActionState(createAppointmentAction, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      {state?.error ? (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="المريض" error={state?.fieldErrors?.patientId}>
        <select name="patientId" className={fieldClass} defaultValue={patients[0]?.id}>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="الطبيب" error={state?.fieldErrors?.doctorId}>
        <select name="doctorId" className={fieldClass} defaultValue={doctors[0]?.id}>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="الكرسي" error={state?.fieldErrors?.chairId}>
        <select name="chairId" className={fieldClass} defaultValue={chairs[0]?.id}>
          {chairs.map((chair) => (
            <option key={chair.id} value={chair.id}>
              {chair.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="نوع الزيارة" error={state?.fieldErrors?.visitType}>
        <select name="visitType" className={fieldClass} defaultValue={VISIT_TYPES[0]}>
          {VISIT_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </Field>
      <Field label="التاريخ" error={state?.fieldErrors?.date}>
        <input type="date" name="date" required min={DEMO_TODAY} defaultValue={date} dir="ltr" className={fieldClass} />
      </Field>
      <Field label="الوقت" error={state?.fieldErrors?.time}>
        <input type="time" name="time" required defaultValue="11:00" dir="ltr" className={fieldClass} />
      </Field>
      <Field label="المدة" error={state?.fieldErrors?.durationMin}>
        <select name="durationMin" className={fieldClass} defaultValue="30">
          {[15, 30, 45, 60].map((value) => (
            <option key={value} value={value}>
              {value} دقيقة
            </option>
          ))}
        </select>
      </Field>
      <Field label="ملاحظة إدارية" hint="لا تكتب تشخيصاً هنا" error={state?.fieldErrors?.adminNote}>
        <input name="adminNote" className={fieldClass} />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton>تثبيت الموعد</SubmitButton>
      </div>
    </form>
  );
}
