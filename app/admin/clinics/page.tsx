import Link from "next/link";
import { ClinicProvisionForm } from "@/components/forms/clinic-provision-form";
import { Card, PageIntro, Pill, PrimaryLink, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listClinicDossiers } from "@/lib/domain/admin";
import { clinicStatusLabel } from "@/lib/domain/labels";

function count(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function AdminClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const actor = await requireActor();
  const { q = "", error } = await searchParams;
  const clinics = listClinicDossiers(getDb(), actor, q);
  const active = clinics.filter((item) => item.clinic.status === "active").length;
  const pending = clinics.filter((item) => item.clinic.status === "pending").length;
  const suspended = clinics.filter((item) => item.clinic.status === "suspended").length;

  return (
    <div>
      <PageIntro
        eyebrow="غرفة عمليات العيادات"
        title="العيادات"
        description="كل عيادة على المنصة: اسمها، عنوانها، فريقها، وإيميل النظام. الملفات الطبية للمرضى غير معروضة هنا."
        action={<PrimaryLink href="/admin/clinics/new">عيادة جديدة</PrimaryLink>}
      />
      {error ? (
        <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        {[
          ["عيادات مسجّلة", clinics.length],
          ["نشطة", active],
          ["بانتظار", pending],
          ["موقوفة", suspended],
        ].map(([label, value]) => (
          <Card key={label} className="bg-gradient-to-br from-white to-lavender">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-violet">{count(Number(value))}</p>
          </Card>
        ))}
      </div>

      <form action="/admin/clinics" className="mb-5 flex gap-2">
        <label className="sr-only" htmlFor="q">
          بحث العيادات
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="اسم العيادة أو المدينة أو الحي"
          className="h-11 flex-1 rounded-xl border border-line bg-white px-3"
        />
        <button className="h-11 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line" type="submit">
          بحث
        </button>
      </form>

      <div className="grid gap-4">
        {clinics.map((item) => {
          const clinic = item.clinic;
          return (
            <Card key={clinic.id} className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-lg font-extrabold text-white">
                    {clinic.name.replace(/^عيادة\s*/, "").slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold text-plum">{clinic.name}</h2>
                      <Pill tone={statusTone(clinic.status)}>{clinicStatusLabel[clinic.status]}</Pill>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {clinic.city} · {clinic.district} · {clinic.branchName}
                    </p>
                    <p className="text-sm text-muted">{clinic.address}</p>
                    <p className="mt-1 text-sm font-bold text-plum" dir="ltr">
                      {clinic.phone}
                    </p>
                    {clinic.specialty ? <p className="mt-1 text-xs font-bold text-violet">{clinic.specialty}</p> : null}
                  </div>
                </div>
                <Link href={`/admin/clinics/${clinic.id}`} className="text-sm font-bold text-violet">
                  الملف التشغيلي
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["المرضى", item.patientCount],
                  ["الفريق", item.staff.length],
                  ["مختبر مفتوح", item.openLab],
                  ["حجوزات اليوم", item.todayAppointments],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-lavender px-3 py-3">
                    <p className="text-[11px] font-bold text-muted">{label}</p>
                    <p className="mt-1 text-xl font-extrabold text-violet">{count(Number(value))}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-lavender/60 p-4">
                {clinic.access ? (
                  <div className="grid gap-2 text-sm">
                    <p className="font-extrabold text-plum">حسابات النظام جاهزة</p>
                    <p className="text-xs text-muted">نظام الحجوزات — /desk</p>
                    <p dir="ltr" className="text-start font-bold text-plum">
                      {clinic.access.systemEmail}
                    </p>
                    <p dir="ltr" className="text-start text-sm font-extrabold">
                      {clinic.access.systemPassword}
                    </p>
                    <p className="mt-2 text-xs text-muted">تطبيق الطبيب — /app</p>
                    <p dir="ltr" className="text-start font-bold text-plum">
                      {clinic.access.doctorEmail}
                    </p>
                    <p dir="ltr" className="text-start text-sm font-extrabold">
                      {clinic.access.doctorPassword}
                    </p>
                    <Link href={`/admin/clinics/${clinic.id}?tab=team`} className="mt-1 inline-block font-bold text-violet">
                      تفاصيل الفريق
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3 text-sm font-extrabold text-plum">إنشاء نظام الحجوزات وحساب الطبيب</p>
                    <ClinicProvisionForm clinicId={clinic.id} clinicName={clinic.name} compact />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
