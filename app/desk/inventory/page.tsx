import { adjustStockAction } from "@/lib/actions/clinic";
import { Card, PageIntro, Pill } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { inventoryWarnings, listInventory, listMovements } from "@/lib/domain/inventory";
import { SERVICE_CONSUME } from "@/lib/domain/supplies";
import { accessResponse } from "@/lib/ui/access";

export default async function DeskInventoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  const db = getDb();
  try {
    const items = listInventory(db, actor);
    const warnings = inventoryWarnings(db, actor);
    const movements = listMovements(db, actor).slice(0, 10);
    const linked = items.map((item) => {
      const services = Object.entries(SERVICE_CONSUME)
        .filter(([, lines]) => lines.some((line) => line.sku === item.sku))
        .map(([service]) => service);
      return { item, services };
    });
    return (
      <div>
        <PageIntro title="المخزن" description="مخزن المواد مربوط بالحجز: عند تثبيت خدمة تُخصم المواد المرتبطة بها تلقائياً." />
        {error ? (
          <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {warnings.length ? (
          <div className="mb-4 grid gap-2">
            {warnings.map((warning) => (
              <p key={`${warning.itemId}-${warning.kind}`} className="rounded-2xl bg-warning/10 px-3 py-2 text-sm text-warning">
                {warning.name}: {warning.detail}
              </p>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3">
          {linked.map(({ item, services }) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold">{item.name}</h2>
                  <p className="text-sm text-muted">
                    {item.quantity} {item.unit} · الحد {item.minQty}
                  </p>
                  {services.length ? <p className="mt-1 text-xs font-bold text-violet">مرتبط بـ {services.join(" · ")}</p> : null}
                </div>
                {item.quantity <= item.minQty ? <Pill tone="warn">منخفض</Pill> : <Pill tone="teal">متوفر</Pill>}
              </div>
              <form action={adjustStockAction} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="returnTo" value="/desk/inventory" />
                <select name="type" className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="نوع الحركة">
                  <option value="in">إدخال</option>
                  <option value="out">إخراج</option>
                  <option value="consume">استهلاك</option>
                </select>
                <input name="quantity" type="number" min={1} defaultValue={1} aria-label="الكمية" className="h-11 w-24 rounded-xl border border-line px-3" />
                <input name="reason" required placeholder="سبب الحركة" aria-label="السبب" className="h-11 min-w-40 flex-1 rounded-xl border border-line px-3" />
                <SubmitButton>تسجيل</SubmitButton>
              </form>
            </Card>
          ))}
        </div>
        <Card className="mt-4">
          <h2 className="font-extrabold">حركات مرتبطة بالحجز</h2>
          {movements.length ? (
            <ul className="mt-3 divide-y divide-line text-sm">
              {movements.map((movement) => {
                const item = items.find((row) => row.id === movement.itemId);
                return (
                  <li key={movement.id} className="flex justify-between gap-3 py-2">
                    <span>
                      {item?.name ?? "مادة"} · {movement.reason}
                    </span>
                    <span className="text-muted">
                      {movement.type === "consume" ? "خصم" : movement.type} · {movement.quantity} · {formatDateTime(movement.at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">ستظهر هنا خصومات المواد بعد تثبيت الحجوزات.</p>
          )}
        </Card>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
