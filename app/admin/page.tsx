import Link from "next/link";
import { AreaChart, ConsoleCard, Donut, Gauge, KpiTile, MiniRing } from "@/components/console";
import { Icon } from "@/components/icons";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { analytics, listAudit, listClinicDossiers } from "@/lib/domain/admin";
import { formatDateTime, formatIqd } from "@/lib/domain/format";
import { clinicStatusLabel } from "@/lib/domain/labels";

function count(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const months = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "أيل", "ت1", "ت2", "كان"];

export default async function AdminHome() {
  const actor = await requireActor();
  const db = getDb();
  const stats = analytics(db, actor);
  const audit = listAudit(db, actor);
  const clinics = listClinicDossiers(db, actor);
  const points = stats.monthly.map((point, index) => ({
    key: point.key,
    value: point.value,
    label: months[index],
  }));
  const peakMonth = Number(stats.peak.key.slice(5, 7)) - 1;

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100dvh)] bg-[#120b1f] px-4 py-6 text-white lg:-mx-8 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-violet text-sm font-extrabold">
            {actor.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">مرحباً! {actor.name}</p>
            <p className="text-sm text-[#9b8fb8]">تشغيل المنصة عملية مستمرة، لا منتج نهائي.</p>
          </div>
        </div>
        <form action="/admin/clinics" className="relative min-w-[220px] flex-1">
          <Icon name="search" className="pointer-events-none absolute top-3.5 end-4 h-4 w-4 text-[#9b8fb8]" />
          <label className="sr-only" htmlFor="admin-q">
            بحث
          </label>
          <input
            id="admin-q"
            name="q"
            placeholder="ابحث هنا"
            className="h-12 w-full rounded-full border border-white/10 bg-[#1c1433] px-5 pe-12 text-sm text-white outline-none placeholder:text-[#9b8fb8]"
          />
        </form>
        <Link href="/admin/support" className="grid h-12 w-12 place-items-center rounded-full bg-[#1c1433] text-white" aria-label="الدعم">
          <Icon name="chat" className="h-5 w-5" />
        </Link>
        <Link href="/admin/moderation" className="grid h-12 w-12 place-items-center rounded-full bg-[#1c1433] text-white" aria-label="الإشراف">
          <Icon name="bell" className="h-5 w-5" />
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_300px]">
        <ConsoleCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">نبض المنصة الآن</h2>
            <span className="rounded-full bg-[#251b42] px-3 py-1 text-xs font-bold text-[#d9ccff]">اليوم</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <KpiTile icon="building" tone="#ec4899" value={count(stats.clinics)} label="عيادات نشطة" />
            <KpiTile icon="warning" tone="#8b5cf6" value={count(stats.pendingClinics)} label="بانتظار الاعتماد" />
            <KpiTile icon="lab" tone="#d946ef" value={count(stats.labOrders)} label="طلبات مختبر" />
            <KpiTile icon="cart" tone="#6366f1" value={count(stats.commerceOrders)} label="طلبات متاجر" />
            <KpiTile icon="shield" tone="#38bdf8" value={count(stats.openReports)} label="بلاغات مفتوحة" />
          </div>
        </ConsoleCard>
        <ConsoleCard>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">صحة التشغيل</h2>
            <span className="text-[#9b8fb8]">···</span>
          </div>
          <Gauge score={stats.health} />
          <div className="mt-2 flex justify-between text-[11px] text-[#9b8fb8]">
            <span>0</span>
            <span>1,000</span>
          </div>
        </ConsoleCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_300px]">
        <ConsoleCard>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">ملخص النشاط</h2>
            <span className="rounded-full bg-[#251b42] px-3 py-1 text-xs font-bold text-[#d9ccff]">سنوي</span>
          </div>
          <AreaChart points={points} highlight={{ key: stats.peak.key, caption: `${months[peakMonth]} · نشاط` }} />
        </ConsoleCard>
        <ConsoleCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">التوزيع</h2>
            <span className="text-[#9b8fb8]">···</span>
          </div>
          <Donut slices={stats.mix} total={stats.mixTotal} />
        </ConsoleCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_300px]">
        <ConsoleCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">سجل التشغيل</h2>
            <span className="rounded-full bg-[#251b42] px-3 py-1 text-xs font-bold text-[#d9ccff]">آخر الأحداث</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-start text-sm">
              <thead className="text-[#9b8fb8]">
                <tr className="border-b border-white/8">
                  <th className="py-2 font-bold">الوقت</th>
                  <th className="py-2 font-bold">الإجراء</th>
                  <th className="py-2 font-bold">الحساب</th>
                  <th className="py-2 font-bold">النوع</th>
                  <th className="py-2 font-bold">المعرّف</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/6 text-white/90">
                    <td className="py-3">{formatDateTime(entry.at)}</td>
                    <td className="py-3 font-bold">{entry.action}</td>
                    <td className="py-3">{entry.actorName}</td>
                    <td className="py-3">{entry.entityType}</td>
                    <td className="py-3" dir="ltr">
                      {entry.entityId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ConsoleCard>
        <ConsoleCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">العيادات</h2>
            <Link href="/admin/clinics" className="text-xs font-bold text-violet-soft">
              الكل
            </Link>
          </div>
          <ul className="grid gap-3">
            {clinics.slice(0, 5).map((item) => {
              const load = Math.min(100, item.todayAppointments * 20 + item.openLab * 12 + item.staff.length * 8);
              return (
                <li key={item.clinic.id}>
                  <Link href={`/admin/clinics/${item.clinic.id}`} className="flex items-center gap-3 rounded-2xl bg-[#251b42] px-3 py-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#120b1f] text-sm font-extrabold">
                      {item.clinic.name.replace(/^عيادة\s*/, "").slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold">{item.clinic.name}</p>
                      <p className="text-[11px] text-[#9b8fb8]">
                        {item.clinic.city} · {clinicStatusLabel[item.clinic.status]}
                      </p>
                    </div>
                    <MiniRing value={load} />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-center text-xs text-[#9b8fb8]">{formatIqd(stats.gmvIqd)} قيمة المتاجر</p>
        </ConsoleCard>
      </div>
    </div>
  );
}
