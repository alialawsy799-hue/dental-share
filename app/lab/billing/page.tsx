import { Card, Money, PageIntro } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { clinicName, requireLab } from "@/lib/domain/guard";
import { accessResponse } from "@/lib/ui/access";

export default async function LabBillingPage() {
  const actor = await requireActor();
  const db = getDb();
  try {
    requireLab(actor);
    if (actor.role !== "lab_manager") return accessResponse(new AccessError("FORBIDDEN", "الفواتير لمدير المختبر."));
    const invoices = db.labInvoices;
    return (
      <div>
        <PageIntro title="فواتير المختبر" description="أسماء العيادات والمبالغ فقط، من دون محتوى طبي." />
        <div className="grid gap-3">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold">{clinicName(db, invoice.clinicId)}</p>
                  <p className="text-sm text-muted">{invoice.issuedOn} · {invoice.status === "paid" ? "مدفوعة" : "مستحقة"}</p>
                </div>
                <Money value={invoice.amountIqd} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
