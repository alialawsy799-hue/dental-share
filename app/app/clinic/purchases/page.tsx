import Link from "next/link";
import { receiveOrderAction } from "@/lib/actions/clinic";
import { Card, Money, PageIntro, Pill, statusTone } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listClinicOrders } from "@/lib/domain/commerce";
import { commerceStatusLabel } from "@/lib/domain/labels";
import { has } from "@/lib/domain/guard";
import { accessResponse } from "@/lib/ui/access";

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  try {
        const db = getDb();
        const orders = listClinicOrders(db, actor);
    return (
      <div>
        <PageIntro title="مشترياتي" description="طلبات المتاجر لهذه العيادة. الاستلام يضيف المخزون، والدفع يحدّث القيد المالي نفسه." />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <div className="grid gap-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/app/orders/${order.id}`} className="font-extrabold">{db.stores.find((store) => store.id === order.storeId)?.name ?? "متجر"}</Link>
                  <p className="text-sm text-muted">{order.lines.map((line) => line.name).join("، ")}</p>
                </div>
                <div className="text-end">
                  <Money value={order.totalIqd} />
                  <div className="mt-1"><Pill tone={statusTone(order.status)}>{commerceStatusLabel[order.status]}</Pill></div>
                </div>
              </div>
              {has(actor, "purchases.receive") && order.status === "delivered" ? (
                <form action={receiveOrderAction} className="mt-3">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="returnTo" value="/app/clinic/purchases" />
                  <SubmitButton>{order.inventoryReceived ? "الاستلام مسجّل" : "تأكيد الاستلام وإضافة للمخزن"}</SubmitButton>
                </form>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
