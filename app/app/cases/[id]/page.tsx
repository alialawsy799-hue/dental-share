import Link from "next/link";
import { Card, Money, PageIntro, Pill, Timeline } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { getCaseHub } from "@/lib/domain/cases";
import { formatDateTime } from "@/lib/domain/format";
import { bucketLabel } from "@/lib/domain/labels";
import { accessResponse } from "@/lib/ui/access";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    const hub = getCaseHub(getDb(), actor, id);
    return (
      <div>
        <PageIntro eyebrow={hub.code} title={hub.title} description="أرقام الحالة تخصيص من السجلات المالية وليست قيداً إضافياً في دفتر العيادة." />
        <div className="mb-4 flex gap-2">
          <Pill tone={hub.status === "active" ? "teal" : "mist"}>{hub.status === "active" ? "نشطة" : "مكتملة"}</Pill>
          {hub.teeth.map((tooth) => <Pill key={tooth}>{tooth}</Pill>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><p className="text-sm text-muted">مدفوع</p><p className="mt-2"><Money value={hub.costs.paid} /></p></Card>
          <Card><p className="text-sm text-muted">مستحق</p><p className="mt-2"><Money value={hub.costs.unpaid} /></p></Card>
          <Card><p className="text-sm text-muted">تقديري</p><p className="mt-2"><Money value={hub.costs.estimated} /></p></Card>
        </div>
        <Card className="mt-4">
          <h2 className="font-extrabold">المريض</h2>
          <p className="mt-2 text-sm"><Link className="font-bold" href={`/app/clinic/patients/${hub.patient.id}`}>{hub.patient.name}</Link> · {hub.patient.fileNumber}</p>
          {hub.clinicalNotes ? <p className="mt-3 text-sm leading-7">{hub.clinicalNotes}</p> : <p className="mt-3 text-sm text-muted">الملاحظات السريرية غير متاحة لهذا الدور.</p>}
        </Card>
        {hub.costs.rows.length ? (
          <Card className="mt-4">
            <h2 className="font-extrabold">تخصيص التكلفة</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {hub.costs.rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between py-2">
                  <span>{row.label}</span>
                  <span>{bucketLabel[row.bucket]} · <Money value={row.amountIqd} /></span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <Card className="mt-4">
          <h2 className="mb-2 font-extrabold">التسلسل</h2>
          <Timeline items={hub.timeline.map((item) => ({ label: item.label, at: formatDateTime(item.at) }))} />
          <div className="mt-3 flex flex-wrap gap-2">
            {hub.timeline.filter((item) => item.href).map((item) => (
              <Link key={item.label} href={item.href!} className="text-sm font-bold text-teal">{item.label}</Link>
            ))}
          </div>
        </Card>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
