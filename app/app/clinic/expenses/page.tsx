import { payInvoiceAction, payOrderAction } from "@/lib/actions/clinic";
import { ExpenseForm } from "@/components/forms/expense-form";
import { Card, Money, PageIntro, Pill } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { expenseLedger } from "@/lib/domain/expenses";
import { bucketLabel } from "@/lib/domain/labels";
import { has } from "@/lib/domain/guard";
import { accessResponse } from "@/lib/ui/access";

const categoryLabel = { operating: "تشغيلي", purchase: "مشتريات", lab: "مختبر", other: "أخرى" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  try {
    const { summary, rows } = expenseLedger(getDb(), actor);
    return (
      <div>
        <PageIntro title="المصاريف" description="الإجمالي المدفوع يجمع القيود المسددة فقط. الطلب غير المدفوع والفاتورة المستحقة والتقدير لا تدخل فيه، والقيد المكرر لنفس المصدر يُدمج." />
        {error ? <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card><p className="text-sm text-muted">مدفوع</p><p className="mt-2 text-xl"><Money value={summary.settledIqd} /></p></Card>
          <Card><p className="text-sm text-muted">غير مدفوع</p><p className="mt-2 text-xl"><Money value={summary.unpaidIqd} /></p></Card>
          <Card><p className="text-sm text-muted">تقديري</p><p className="mt-2 text-xl"><Money value={summary.estimatedIqd} /></p></Card>
        </div>
        {summary.collapsedSources ? (
          <p className="mt-4 rounded-2xl bg-teal/10 px-3 py-2 text-sm leading-7">دُمج {summary.collapsedSources} مصدر مكرر حتى لا يُحتسب عند إنشاء الطلب ثم عند الدفع.</p>
        ) : null}
        <div className="mt-4 grid gap-3">
          {rows.map((row) => (
            <Card key={row.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold">{row.description}</h2>
                  <p className="text-sm text-muted">{categoryLabel[row.category]} · {row.occurredOn}</p>
                </div>
                <div className="text-end">
                  <Money value={row.amountIqd} />
                  <div className="mt-1"><Pill tone={row.bucket === "paid" ? "teal" : row.bucket === "estimated" ? "warn" : "navy"}>{bucketLabel[row.bucket]}</Pill></div>
                </div>
              </div>
              {has(actor, "expenses.write") && row.bucket === "unpaid" && row.sourceId && row.sourceType === "commerce_order" ? (
                <form action={payOrderAction} className="mt-3">
                  <input type="hidden" name="id" value={row.sourceId} />
                  <input type="hidden" name="returnTo" value="/app/clinic/expenses" />
                  <SubmitButton>تسجيل الدفع على نفس القيد</SubmitButton>
                </form>
              ) : null}
              {has(actor, "expenses.write") && row.bucket === "unpaid" && row.sourceId && row.sourceType === "lab_invoice" ? (
                <form action={payInvoiceAction} className="mt-3">
                  <input type="hidden" name="id" value={row.sourceId} />
                  <SubmitButton>تسجيل دفع فاتورة المختبر</SubmitButton>
                </form>
              ) : null}
            </Card>
          ))}
        </div>
        {has(actor, "expenses.write") ? (
          <Card className="mt-4">
            <h2 className="mb-3 font-extrabold">مصروف يدوي</h2>
            <ExpenseForm />
          </Card>
        ) : null}
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
