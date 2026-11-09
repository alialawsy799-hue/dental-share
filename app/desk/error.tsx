"use client";

export default function DeskError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-card bg-white p-6 shadow-card">
      <h1 className="text-2xl font-extrabold">تعذر تحميل نظام الحجوزات</h1>
      <p className="mt-2 text-sm leading-7 text-muted">حاول مرة أخرى. لن تُعرض تفاصيل سريرية في رسالة الخطأ.</p>
      <button type="button" onClick={reset} className="mt-4 h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white">
        إعادة المحاولة
      </button>
    </div>
  );
}
