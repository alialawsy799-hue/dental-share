"use client";

import { useActionState } from "react";
import { createAppointmentAction } from "@/lib/actions/clinic";
import { Field, fieldClass } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { CLINIC_SERVICES, DEMO_TODAY } from "@/lib/domain/types";

export function DeskBookForm({
  patients,
  doctors,
  chairs,
  date,
}: {
  patients: { id: string; label: string }[];
  doctors: { id: string; name: string }[];
  chairs: { id: string; name: string }[];
  date: string;
}) {
  const [state, action] = useActionState(createAppointmentAction, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="returnTo" value="/desk/book" />
      <input type="hidden" name="doctorId" value={doctors[0]?.id ?? ""} />
      <input type="hidden" name="chairId" value={chairs[0]?.id ?? ""} />
      <input type="hidden" name="durationMin" value="30" />
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="التاريخ" error={state?.fieldErrors?.date}>
          <input type="date" name="date" required min={DEMO_TODAY} defaultValue={date} dir="ltr" className={fieldClass} />
        </Field>
        <Field label="الوقت" error={state?.fieldErrors?.time}>
          <input type="time" name="time" required defaultValue="11:00" dir="ltr" className={fieldClass} />
        </Field>
      </div>
      <Field label="الخدمة" error={state?.fieldErrors?.visitType}>
        <select name="visitType" className={fieldClass} defaultValue="حشوة">
          {CLINIC_SERVICES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </Field>
      <SubmitButton>تثبيت الحجز</SubmitButton>
    </form>
  );
}
