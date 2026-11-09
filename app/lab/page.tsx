import Link from "next/link";
import { PageIntro, Pill, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { labStatusLabel } from "@/lib/domain/labels";
import { listLabInbox } from "@/lib/domain/lab";

export default async function LabHome() {
  const actor = await requireActor();
  const orders = listLabInbox(getDb(), actor);
  return (
    <div>
      <PageIntro title="وارد المختبر" description="مختبر واحد يستقبل من كل العيادات. البطاقات تعرض العيادة والطبيب والعمل، من دون اسم المريض أو سجله." />
      <div className="grid gap-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/lab/orders/${order.id}`} className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{order.workType} · {order.caseCode}</p>
                <p className="text-sm text-muted">{order.clinicName} · {order.doctorName}</p>
                <p className="text-sm text-muted">التسليم {formatDateTime(order.dueAt)}</p>
              </div>
              <Pill tone={statusTone(order.status)}>{labStatusLabel[order.status]}</Pill>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
