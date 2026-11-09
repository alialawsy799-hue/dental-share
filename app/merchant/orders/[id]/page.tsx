import { commerceStatusAction } from "@/lib/actions/commerce";
import { Card, Money, PageIntro, Pill, Timeline, statusTone } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { getMerchantOrder } from "@/lib/domain/commerce";
import { formatDateTime } from "@/lib/domain/format";
import { commerceStatusLabel } from "@/lib/domain/labels";
import type { CommerceStatus } from "@/lib/domain/types";
import { accessResponse } from "@/lib/ui/access";

const next: Partial<Record<CommerceStatus, { to: CommerceStatus; label: string }[]>> = {
  new: [{ to: "confirmed", label: "تأكيد" }, { to: "cancelled", label: "إلغاء" }],
  confirmed: [{ to: "preparing", label: "بدء التجهيز" }, { to: "cancelled", label: "إلغاء" }],
  preparing: [{ to: "shipped", label: "تم الإرسال" }],
  shipped: [{ to: "delivered", label: "تم التسليم" }],
  delivered: [{ to: "returned", label: "تسجيل مرتجع" }],
};

export default async function MerchantOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const { error } = await searchParams;
  try {
    const order = getMerchantOrder(getDb(), actor, id);
    return (
      <div>
        <PageIntro title={order.clinicName} description={`${order.deliveryAddress} · ${order.contactName}`} />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <Pill tone={statusTone(order.status)}>{commerceStatusLabel[order.status]}</Pill>
        <Card className="mt-4">
          <ul className="divide-y divide-line text-sm">
            {order.lines.map((line) => (
              <li key={line.productId} className="flex justify-between py-2"><span>{line.name} × {line.qty}</span><Money value={line.unitPriceIqd * line.qty} /></li>
            ))}
          </ul>
          <p className="mt-3 text-sm" dir="ltr">{order.contactPhone}</p>
        </Card>
        <Card className="mt-4">
          <Timeline items={order.timeline.map((item) => ({ label: item.label, at: formatDateTime(item.at) }))} />
        </Card>
        <div className="mt-4 flex flex-wrap gap-2">
          {(next[order.status] ?? []).map((step) => (
            <form key={step.to} action={commerceStatusAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="to" value={step.to} />
              <SubmitButton variant={step.to === "cancelled" || step.to === "returned" ? "ghost" : "primary"}>{step.label}</SubmitButton>
            </form>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
