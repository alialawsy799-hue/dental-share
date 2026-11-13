"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/enter/actions";

const demos = [
  {
    label: "نظام حجوزات عيادة النور",
    hint: "يفتح /desk",
    email: "noor.clinic@dentalshare.demo",
    password: "NoorClinic@2026",
  },
  {
    label: "طبيب عيادة النور",
    hint: "يفتح /app",
    email: "ahmed@dentalshare.demo",
    password: "Ahmed@2026",
  },
  {
    label: "إدارة المنصة",
    hint: "يفتح /admin",
    email: "rania@dentalshare.demo",
    password: "Rania@2026",
  },
];

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="next" value={next} />
      {state?.error ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-2">
        {demos.map((item) => (
          <button
            key={item.email}
            type="button"
            onClick={() => {
              setEmail(item.email);
              setPassword(item.password);
            }}
            className="rounded-2xl bg-lavender px-3 py-3 text-start"
          >
            <span className="block text-sm font-bold text-plum">{item.label}</span>
            <span className="mt-1 block text-xs text-muted">{item.hint}</span>
            <span className="mt-1 block text-xs font-bold text-violet" dir="ltr">
              {item.email} · {item.password}
            </span>
          </button>
        ))}
      </div>
      <label className="grid gap-1 text-sm font-bold text-navy">
        البريد الإلكتروني
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-2xl border border-line bg-white px-3 text-base font-medium"
          placeholder="noor.clinic@dentalshare.demo"
        />
      </label>
      <label className="grid gap-1 text-sm font-bold text-navy">
        كلمة المرور
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-2xl border border-line bg-white px-3 text-base font-medium"
        />
      </label>
      <button type="submit" className="h-12 rounded-2xl bg-navy text-sm font-bold text-white">
        تسجيل الدخول
      </button>
    </form>
  );
}
