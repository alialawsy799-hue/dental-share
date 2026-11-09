import Link from "next/link";
import { notFound } from "next/navigation";
import { setClinicStatusAction } from "@/lib/actions/admin";
import { ClinicProvisionForm } from "@/components/forms/clinic-provision-form";
import { Card, GhostLink, Money, PageIntro, Pill, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { getClinicDossier } from "@/lib/domain/admin";
import { formatDateTime, formatIqd } from "@/lib/domain/format";
import { clinicStatusLabel, commerceStatusLabel, labStatusLabel, roleLabel } from "@/lib/domain/labels";

function count(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

const tabs = [
  { id: "info", label: "المعلومات" },
  { id: "team", label: "الفريق والحسابات" },
  { id: "ops", label: "التشغيل" },
  { id: "orders", label: "الطلبات" },
  { id: "audit", label: "التدقيق" },
] as const;

type Tab = (typeof tabs)[number]["id"];

export default async function AdminClinicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; error?: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const query = await searchParams;
  const tab = (tabs.some((item) => item.id === query.tab) ? query.tab : "info") as Tab;
  const result = getClinicDossier(getDb(), actor, id);
  if (!result.ok) notFound();
  const data = result.data;
  const clinic = data.clinic;

  return (
    <div>
      <PageIntro
        eyebrow="ملف تشغيلي"
        title={clinic.name}
        description={`${clinic.city} · ${clinic.district} · ${clinic.branchName}. الأرقام تشغيلية فقط، بلا ملفات مرضى.`}
        action={<GhostLink href="/admin/clinics">كل العيادات</GhostLink>}
      />
      {query.error ? (
        <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {query.error}
        </p>
      ) : null}

      <Card className="mb-5 bg-gradient-to-l from-white to-lavender">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={statusTone(clinic.status)}>{clinicStatusLabel[clinic.status]}</Pill>
              {clinic.specialty ? <Pill>{clinic.specialty}</Pill> : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              {clinic.address}
              <br />
              <span dir="ltr">{clinic.phone}</span>
              {clinic.systemEmail ? (
                <>
                  <br />
                  <span dir="ltr">{clinic.systemEmail}</span>
                </>
              ) : (
                <>
                  <br />
                  لم يُنشأ إيميل نظام بعد
                </>
              )}
            </p>
          </div>
          <form action={setClinicStatusAction}>
            <input type="hidden" name="id" value={clinic.id} />
            <input type="hidden" name="status" value={clinic.status === "suspended" ? "active" : "suspended"} />
            <button type="submit" className="h-11 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line">
              {clinic.status === "suspended" ? "إعادة تفعيل" : "إيقاف العيادة"}
            </button>
          </form>
        </div>
      </Card>

      <nav aria-label="تبويبات العيادة" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/admin/clinics/${clinic.id}?tab=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              tab === item.id ? "bg-violet text-white" : "bg-white text-plum ring-1 ring-line"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "info" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-extrabold">بيانات العيادة</h2>
            <dl className="mt-3 grid gap-3 text-sm">
              {[
                ["الاسم", clinic.name],
                ["المدينة", clinic.city],
                ["الحي", clinic.district],
                ["الفرع", clinic.branchName],
                ["التخصص", clinic.specialty ?? "طب أسنان عام"],
                ["تاريخ الانضمام", clinic.joinedAt ?? "—"],
                ["الهاتف", clinic.phone],
                ["العنوان", clinic.address],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="font-extrabold">الاشتراك</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{data.subscriptionNote}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-lavender p-3">
                <p className="text-xs text-muted">الكراسي</p>
                <p className="text-2xl font-extrabold text-violet">{count(data.chairCount)}</p>
              </div>
              <div className="rounded-2xl bg-lavender p-3">
                <p className="text-xs text-muted">أطباء</p>
                <p className="text-2xl font-extrabold text-violet">{count(data.doctors)}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "team" ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <h2 className="font-extrabold">فريق العيادة</h2>
            <ul className="mt-3 divide-y divide-line">
              {data.staff.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-extrabold">{member.name}</p>
                    <p className="text-sm text-muted">{member.title} · {roleLabel[member.role]}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      {member.email}
                    </p>
                  </div>
                  <Pill tone={member.verified ? "teal" : "warn"}>{member.verified ? "موثّق" : "بانتظار"}</Pill>
                </li>
              ))}
            </ul>
          </Card>
          <div className="grid gap-4">
            {clinic.access ? (
              <Card className="bg-gradient-to-br from-[#f7f3ff] to-white">
                <h2 className="font-extrabold">بيانات الدخول — البريد وكلمة المرور</h2>
                <p className="mt-1 text-xs leading-6 text-muted">الدخول من صفحة `/enter`. كلمة المرور تُولَّد تلقائياً وتُحفظ هنا.</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-line">
                    <p className="text-xs font-bold text-violet">نظام الحجوزات — يفتح /desk</p>
                    <p className="mt-1 text-xs text-muted">البريد</p>
                    <p className="font-bold" dir="ltr">
                      {clinic.access.systemEmail}
                    </p>
                    <p className="mt-2 text-xs text-muted">كلمة المرور</p>
                    <p className="font-extrabold text-plum" dir="ltr">
                      {clinic.access.systemPassword}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white p-3 ring-1 ring-line">
                    <p className="text-xs font-bold text-violet">تطبيق الطبيب — {clinic.access.doctorName} — يفتح /app</p>
                    <p className="mt-1 text-xs text-muted">البريد</p>
                    <p className="font-bold" dir="ltr">
                      {clinic.access.doctorEmail}
                    </p>
                    <p className="mt-2 text-xs text-muted">كلمة المرور</p>
                    <p className="font-extrabold text-plum" dir="ltr">
                      {clinic.access.doctorPassword}
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}
            <Card>
              <h2 className="mb-3 font-extrabold">{clinic.access ? "إضافة حساب طبيب / تجديد إيميل نظام الحجوزات" : "إنشاء نظام الحجوزات وحساب الطبيب"}</h2>
              <ClinicProvisionForm clinicId={clinic.id} clinicName={clinic.name} />
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "ops" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["ملفات المرضى", data.patientCount, "عدد فقط داخل العيادة"],
            ["حجوزات اليوم", data.todayAppointments, "بدون أسماء"],
            ["حالات نشطة", data.activeCases, "ملفات سريرية داخل العيادة"],
            ["مختبر مفتوح", data.openLab, "طلبات لم تُغلق"],
            ["مشتريات مفتوحة", data.openPurchases, "طلبات متاجر"],
            ["فواتير مختبر غير مدفوعة", data.unpaidLabInvoices, "عدد الفواتير"],
            ["تنبيهات مخزون", data.inventoryAlerts, "تحت الحد الأدنى"],
            ["مصروف مدفوع", formatIqd(data.expensesSettled), "دينار عراقي"],
            ["أعضاء الفريق", data.staff.length, `${count(data.owners)} مالك`],
          ].map(([label, value, hint]) => (
            <Card key={label}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-extrabold text-plum">{value}</p>
              <p className="mt-1 text-xs text-muted">{hint}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "orders" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="font-extrabold">المختبر المركزي</h2>
            {data.labOrders.length ? (
              <ul className="mt-3 divide-y divide-line text-sm">
                {data.labOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-bold">{order.workType} · {order.caseCode}</p>
                      <p className="text-muted">{order.priority === "urgent" ? "عاجل" : "اعتيادي"}{order.quoteIqd ? ` · ${formatIqd(order.quoteIqd)}` : ""}</p>
                    </div>
                    <Pill tone={statusTone(order.status)}>{labStatusLabel[order.status]}</Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">لا طلبات مختبر.</p>
            )}
          </Card>
          <Card>
            <h2 className="font-extrabold">مشتريات المتاجر</h2>
            {data.purchases.length ? (
              <ul className="mt-3 divide-y divide-line text-sm">
                {data.purchases.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-bold">{order.storeName}</p>
                      <p className="text-muted"><Money value={order.totalIqd} /></p>
                    </div>
                    <Pill tone={statusTone(order.status)}>{commerceStatusLabel[order.status]}</Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">لا مشتريات.</p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "audit" ? (
        <Card>
          <h2 className="font-extrabold">تدقيق العيادة</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {data.audit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {entry.action} · {entry.actorName}
                </span>
                <span className="text-muted">
                  {entry.entityType} · {entry.entityId} · {formatDateTime(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
