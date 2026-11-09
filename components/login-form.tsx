"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/enter/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="next" value={next} />
      {state?.error ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <label className="grid gap-1 text-sm font-bold text-navy">
        البريد الإلكتروني
        <input name="email" type="email" required autoComplete="username" dir="ltr" className="h-12 rounded-2xl border border-line bg-white px-3 text-base font-medium" placeholder="ahmed@dentalshare.demo" />
      </label>
      <label className="grid gap-1 text-sm font-bold text-navy">
        كلمة المرور
        <input name="password" type="password" required autoComplete="current-password" dir="ltr" className="h-12 rounded-2xl border border-line bg-white px-3 text-base font-medium" />
      </label>
      <button type="submit" className="h-12 rounded-2xl bg-navy text-sm font-bold text-white">
        تسجيل الدخول
      </button>
      <p className="text-center text-xs leading-6 text-muted">
        بيانات كل الحسابات موجودة في ملف <span className="font-bold">الحسابات</span> داخل المشروع.
      </p>
    </form>
  );
}
