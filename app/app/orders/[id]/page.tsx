import { payOrderAction, receiveOrderAction } from "@/lib/actions/clinic";
import { Card, Money, PageIntro, Pill, Timeline, statusTone } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { getClinicOrder } from "@/lib/domain/commerce";
import { formatDateTime } from "@/lib/domain/format";
import { has } from "@/lib/domain/guard";
import { commerceStatusLabel } from "@/lib/domain/labels";
import { accessResponse } from "@/lib/ui/access";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const { error } = await searchParams;
  const db = getDb();
  try {
    const order = getClinicOrder(db, actor, id);
    const store = db.stores.find((item) => item.id === order.storeId);
    return (
      <div>
        <PageIntro eyebrow={store?.name} title="متابعة الطلب" description={order.deliveryAddress} />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <div className="mb-4 flex gap-2">
          <Pill tone={statusTone(order.status)}>{commerceStatusLabel[order.status]}</Pill>
          <Pill tone={order.paymentStatus === "paid" ? "teal" : "warn"}>{order.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}</Pill>
        </div>
        <Card>
          <ul className="divide-y divide-line text-sm">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex justify-between py-2">
                <span>{line.name} × {line.qty}</span>
                <Money value={line.qty * line.unitPriceIqd} />
              </li>
            ))}
          </ul>
          <p className="mt-3 font-extrabold">الإجمالي <Money value={order.totalIqd} /></p>
          <p className="mt-2 text-sm text-muted">{order.paymentMethod === "cod" ? "الدفع عند الاستلام" : "تحويل يدوي"} · {order.contactName}</p>
        </Card>
        <Card className="mt-4">
          <Timeline items={order.timeline.map((item) => ({ label: item.label, meta: item.actorName, at: formatDateTime(item.at) }))} />
        </Card>
        <div className="mt-4 flex flex-wrap gap-2">
          {has(actor, "expenses.write") && order.paymentStatus === "unpaid" ? (
            <form action={payOrderAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="returnTo" value={`/app/orders/${order.id}`} />
              <SubmitButton>تسجيل الدفع</SubmitButton>
            </form>
          ) : null}
          {has(actor, "purchases.receive") && order.status === "delivered" ? (
            <form action={receiveOrderAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="returnTo" value={`/app/orders/${order.id}`} />
              <SubmitButton variant="ghost">{order.inventoryReceived ? "تم الاستلام" : "تأكيد الاستلام"}</SubmitButton>
            </form>
          ) : null}
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
