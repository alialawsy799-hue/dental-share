import { notFound } from "next/navigation";
import { AppLogo } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { demoMode } from "@/lib/demo/session";

export default async function EnterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!demoMode()) notFound();
  const { next = "" } = await searchParams;
  return (
    <main dir="rtl" className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white px-6 py-10">
      <AppLogo />
      <h1 className="mt-10 text-3xl font-extrabold text-navy">تسجيل الدخول</h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        إيميل نظام العيادة يفتح نظام الحجوزات. حساب الطبيب يفتح تطبيق الطبيب لنفس العيادة. بقية البوابات تستخدم البريد وكلمة المرور من ملف الحسابات.
      </p>
      <LoginForm next={next} />
    </main>
  );
}
