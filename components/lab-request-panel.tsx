"use client";

import { useActionState, useState, type FormEvent } from "react";
import { createZipCaseAction, requestCourierNowAction } from "@/lib/actions/services";
import { Field, fieldClass } from "@/components/kit";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";

function ZipForm() {
  const [state, action] = useActionState(createZipCaseAction, null);
  return (
    <form action={action} className="mt-4 grid gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="ملف ZIP" hint="ملف واحد بصيغة ZIP حتى 15 ميغابايت." error={state?.fieldErrors?.file}>
        <input name="file" type="file" required accept=".zip,application/zip" className={fieldClass} />
      </Field>
      <Field label="الملاحظات" hint="اكتب المطلوب للمختبر دون اسم المريض أو رقم هاتفه." error={state?.fieldErrors?.note}>
        <textarea name="note" required minLength={8} rows={4} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <SubmitButton>إرسال الملف</SubmitButton>
    </form>
  );
}

function CourierForm({ clinicLocation }: { clinicLocation: string }) {
  const [state, dispatch, pending] = useActionState(requestCourierNowAction, null);
  const [locating, setLocating] = useState(false);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocating(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const fallback = clinicLocation;
    const location = await new Promise<string>((resolve) => {
      if (!navigator.geolocation) {
        resolve(fallback);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${fallback}\nhttps://maps.google.com/?q=${latitude},${longitude}`);
        },
        () => resolve(fallback),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
      );
    });
    data.set("location", location);
    setLocating(false);
    dispatch(data);
  }

  const busy = locating || pending;
  return (
    <form onSubmit={send} className="mt-4 grid gap-4">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm leading-7 text-danger">
          {state.error}
        </p>
      ) : null}
      <Field label="ملاحظات الطبيب" hint="تُرسل مع اسمك واسم العيادة والوقت والموقع إلى تلغرام." error={state?.fieldErrors?.note}>
        <textarea name="note" required minLength={8} rows={4} className={`${fieldClass} h-auto py-2`} />
      </Field>
      <button type="submit" disabled={busy} className="btn-violet inline-flex h-12 items-center justify-center rounded-2xl text-[14px] font-bold disabled:opacity-60">
        {busy ? "جارٍ إرسال الطلب…" : "اضغط لطلب المندوب حالا"}
      </button>
    </form>
  );
}

export function LabRequestPanel({ clinicLocation }: { clinicLocation: string }) {
  const [method, setMethod] = useState<"zip" | "scanner" | null>(null);
  return (
    <div className="mt-5">
      <h2 className="text-[19px] font-extrabold text-plum">طلب عن طريق</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMethod("zip")}
          className={`glass flex min-h-[140px] flex-col items-center justify-center rounded-[22px] p-4 text-center shadow-card ${method === "zip" ? "ring-2 ring-violet" : ""}`}
        >
          <Icon name="box" className="h-7 w-7 text-violet" />
          <span className="mt-3 text-[15px] font-extrabold leading-5 text-plum">إرفاق ملف ZIP</span>
        </button>
        <button
          type="button"
          onClick={() => setMethod("scanner")}
          className={`glass flex min-h-[140px] flex-col items-center justify-center rounded-[22px] p-4 text-center shadow-card ${method === "scanner" ? "ring-2 ring-violet" : ""}`}
        >
          <Icon name="scan" className="h-7 w-7 text-violet" />
          <span className="mt-3 text-[15px] font-extrabold leading-5 text-plum">طلب مندوب سكنر</span>
        </button>
      </div>
      {method === "zip" ? <ZipForm /> : null}
      {method === "scanner" ? <CourierForm clinicLocation={clinicLocation} /> : null}
    </div>
  );
}
