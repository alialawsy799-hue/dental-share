import Link from "next/link";
import { PageIntro, Pill, statusTone } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { serviceKindLabel, serviceStatusLabel } from "@/lib/domain/labels";
import { listProviderOrders } from "@/lib/domain/services";

export default async function ProviderHome() {
  const actor = await requireActor();
  const orders = listProviderOrders(getDb(), actor);
  return (
    <div>
      <PageIntro title="طلبات المزوّد" description="يصل هدف الفحص والتعليمات ورمز الحالة. اسم المريض غير ظاهر." />
      <div className="grid gap-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/provider/orders/${order.id}`} className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{serviceKindLabel[order.kind]} · {order.caseCode}</p>
                <p className="text-sm text-muted">{order.clinicName}</p>
              </div>
              <Pill tone={statusTone(order.status)}>{serviceStatusLabel[order.status]}</Pill>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
