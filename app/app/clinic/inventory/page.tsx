import { adjustStockAction } from "@/lib/actions/clinic";
import { Card, PageIntro, Pill } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { has } from "@/lib/domain/guard";
import { inventoryWarnings, listInventory, listMovements } from "@/lib/domain/inventory";
import { accessResponse } from "@/lib/ui/access";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  const db = getDb();
  try {
    const items = listInventory(db, actor);
    const warnings = inventoryWarnings(db, actor);
    const movements = listMovements(db, actor).slice(0, 8);
    return (
      <div>
        <PageIntro title="المخزن" description="تنبيهات النقص والصلاحية، وحركات الإدخال والإخراج. استلام المشتريات يضيف الكمية مرة واحدة." />
        {error ? <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
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
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold">{item.name}</h2>
                  <p className="text-sm text-muted">{item.quantity} {item.unit} · الحد {item.minQty}{item.expiry ? ` · صلاحية ${item.expiry}` : ""}</p>
                </div>
                {item.quantity <= item.minQty ? <Pill tone="warn">منخفض</Pill> : <Pill tone="teal">متوفر</Pill>}
              </div>
              {has(actor, "inventory.write") ? (
                <form action={adjustStockAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="itemId" value={item.id} />
                  <select name="type" className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="نوع الحركة">
                    <option value="in">إدخال</option>
                    <option value="out">إخراج</option>
                    <option value="consume">استهلاك</option>
                  </select>
                  <input name="quantity" type="number" min={1} defaultValue={1} aria-label="الكمية" className="h-11 w-24 rounded-xl border border-line px-3" />
                  <input name="reason" required placeholder="سبب الحركة" aria-label="السبب" className="h-11 min-w-40 flex-1 rounded-xl border border-line px-3" />
                  <SubmitButton>تسجيل</SubmitButton>
                </form>
              ) : null}
            </Card>
          ))}
        </div>
        <Card className="mt-4">
          <h2 className="font-extrabold">آخر الحركات</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {movements.map((movement) => (
              <li key={movement.id} className="flex justify-between gap-3 py-2">
                <span>{movement.reason}</span>
                <span className="text-muted">{movement.type} · {movement.quantity} · {formatDateTime(movement.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
