import Link from "next/link";

export default function Missing() {
  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-card">
      <p className="text-sm font-bold text-teal">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">السجل غير موجود</h1>
      <p className="mt-2 text-sm leading-7 text-muted">لا يوجد عنصر بهذا الرابط داخل الحساب الحالي.</p>
      <Link href="/app" className="mt-4 inline-flex h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white">
        العودة للرئيسية
      </Link>
    </div>
  );
}
