import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-bold text-teal">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm leading-7 text-muted">تحقق من الرابط أو ارجع إلى مدخل العرض التجريبي.</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-navy px-4 text-sm font-bold text-white">
        الصفحة الأولى
      </Link>
    </main>
  );
}
