"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="text-3xl font-extrabold">تعذر إكمال الطلب</h1>
      <p className="mt-3 text-sm leading-7 text-muted">حدث خطأ غير متوقع. الرسالة هنا لا تعرض بيانات سريرية.</p>
      <button type="button" onClick={reset} className="mt-6 h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white">
        إعادة المحاولة
      </button>
    </main>
  );
}
