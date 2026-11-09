import { updateCartAction } from "@/lib/actions/commerce";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { Card, EmptyState, Money, PageIntro } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { getCart } from "@/lib/domain/commerce";
import { listCases } from "@/lib/domain/cases";
import { accessResponse } from "@/lib/ui/access";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  const db = getDb();
  try {
    const cart = getCart(db, actor);
    const clinic = db.clinics.find((item) => item.id === actor.clinicId);
    const cases = listCases(db, actor).map((item) => ({ id: item.id, label: `${item.code} · ${item.title}` }));
    return (
      <div>
        <PageIntro title="السلة" description="الطلب يُقسّم حسب المتجر ويُنشأ له قيد غير مدفوع واحد." />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        {cart.lines.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-3">
              {cart.lines.map((line) => (
                <Card key={line.productId}>
                  <h2 className="font-extrabold">{line.name}</h2>
                  <p className="text-sm text-muted"><Money value={line.priceIqd} /> · {line.unit}</p>
                  <form action={updateCartAction} className="mt-3 flex gap-2">
                    <input type="hidden" name="productId" value={line.productId} />
                    <input name="qty" type="number" min={0} defaultValue={line.qty} aria-label="الكمية" className="h-11 w-24 rounded-xl border border-line px-3" />
                    <button className="h-11 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line" type="submit">تحديث</button>
                  </form>
                </Card>
              ))}
              <p className="font-extrabold">المجموع <Money value={cart.totalIqd} /></p>
            </div>
            <Card>
              <h2 className="mb-3 font-extrabold">تأكيد الطلب</h2>
              <CheckoutForm cases={cases} address={clinic?.address ?? ""} />
            </Card>
          </div>
        ) : (
          <EmptyState title="السلة فارغة" body="أضف منتجاً من أحد المتاجر." />
        )}
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
