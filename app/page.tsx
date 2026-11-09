import Link from "next/link";
import { BrandLockup } from "@/components/brand";
import { getActor } from "@/lib/demo/session";
import { homeForRole } from "@/lib/domain/types";

const pillars = [
  { title: "عيادتك", body: "مرضى ومواعيد ومخزون ومصاريف، كل عيادة معزولة عن الأخرى." },
  { title: "خدماتك", body: "مختبر مركزي واحد، وتصوير وتقويم، ومتاجر مستقلة." },
  { title: "مجتمعك", body: "نقاش مهني للأطباء الموثقين، بلا نشر بيانات مرضى." },
];

export default async function HomePage() {
  const actor = await getActor();
  const href = actor ? homeForRole(actor.role) : "/enter";
  return (
    <div className="min-h-dvh bg-mist">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <BrandLockup />
        <Link href={href} className="inline-flex h-11 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white">
          {actor ? "متابعة اللوحة" : "دخول العرض"}
        </Link>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-5 pb-16 pt-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm font-bold text-teal">منصة واحدة لطب الأسنان</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
            عيادتك، خدماتك، مجتمعك
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-muted">
            دينتال شير تربط عمل العيادة اليومي بمختبر مركزي ومتاجر المواد ومزودي الأشعة والتقويم، مع إبقاء ملف المريض داخل عيادته.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/enter" className="inline-flex h-12 items-center rounded-xl bg-navy px-5 text-sm font-bold text-white">
              جرّب بالحسابات الوهمية
            </Link>
            <Link href="/enter" className="inline-flex h-12 items-center rounded-xl bg-white px-5 text-sm font-bold ring-1 ring-line">
              تبديل بين العيادة والمختبر والمتجر
            </Link>
          </div>
        </div>
        <div className="rounded-card border border-line bg-white p-5 shadow-card">
          <p className="font-latin text-xs font-bold tracking-[0.18em] text-teal">DENTAL CASE HUB</p>
          <h2 className="mt-2 text-2xl font-extrabold">حالة واحدة، أطراف متعددة</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7">
            <li className="rounded-2xl bg-mist px-3 py-3">المختبر يرى العمل واللون والموعد، لا السجل الطبي الكامل.</li>
            <li className="rounded-2xl bg-mist px-3 py-3">المتجر يرى عنوان التسليم والمواد، لا اسم المريض.</li>
            <li className="rounded-2xl bg-mist px-3 py-3">المصروف المدفوع يُحتسب مرة واحدة، والتقديري يبقى منفصلاً.</li>
          </ul>
        </div>
      </main>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 md:grid-cols-3">
        {pillars.map((item) => (
          <article key={item.title} className="rounded-card border border-line bg-white p-5 shadow-card">
            <h2 className="text-xl font-extrabold">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted">{item.body}</p>
          </article>
        ))}
      </section>
      <footer className="mx-auto max-w-6xl px-5 pb-10 text-sm leading-7 text-muted">
        هذا بناء أولي ببيانات وهمية. لا يدفع، ولا يرسل واتساب، ولا يتصل بمرضى حقيقيين، ولا يصدر تشخيصاً. الشعار اتجاه بصري مبدئي إلى حين اعتماد الهوية النهائية.
      </footer>
    </div>
  );
}
