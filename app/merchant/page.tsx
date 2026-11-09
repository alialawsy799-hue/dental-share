import Link from "next/link";
import { PageIntro, Pill, statusTone } from "@/components/kit";
import { Money } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listMerchantOrders } from "@/lib/domain/commerce";
import { commerceStatusLabel } from "@/lib/domain/labels";

export default async function MerchantHome() {
  const actor = await requireActor();
  const orders = listMerchantOrders(getDb(), actor);
  return (
    <div>
      <PageIntro title="طلبات متجري" description="ترى طلبات هذا المتجر فقط: العيادة وعنوان التسليم والمواد. لا حالة طبية ولا اسم مريض." />
      <div className="grid gap-3">
        {orders.map((order) => (
          <Link key={order.id} href={`/merchant/orders/${order.id}`} className="rounded-card border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{order.clinicName}</p>
                <p className="text-sm text-muted">{order.lines.map((line) => `${line.name} × ${line.qty}`).join("، ")}</p>
              </div>
              <div className="text-end">
                <Money value={order.totalIqd} />
                <div className="mt-1"><Pill tone={statusTone(order.status)}>{commerceStatusLabel[order.status]}</Pill></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
