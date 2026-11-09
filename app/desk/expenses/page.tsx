import { DeskExpenseForm } from "@/components/forms/desk-expense-form";
import { Card, Money, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { expenseLedger } from "@/lib/domain/expenses";
import { fundFromLabel } from "@/lib/domain/labels";
import { accessResponse } from "@/lib/ui/access";

export default async function DeskExpensesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  try {
    const { summary, rows } = expenseLedger(getDb(), actor);
    const fromIncome = rows.filter((row) => row.fundFrom === "income").reduce((sum, row) => sum + row.amountIqd, 0);
    const fromExternal = rows.filter((row) => row.fundFrom === "external").reduce((sum, row) => sum + row.amountIqd, 0);
    return (
      <div>
        <PageIntro title="الصرفيات" description="أدخل الصرفية والمبلغ وطريقة الدفع: من دخل العيادة أو من مكان خارجي." />
        {error ? (
          <p role="alert" className="mb-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-muted">الإجمالي المدفوع</p>
            <p className="mt-2 text-xl">
              <Money value={summary.settledIqd} />
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted">من الدخل</p>
            <p className="mt-2 text-xl">
              <Money value={fromIncome} />
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted">من مكان خارجي</p>
            <p className="mt-2 text-xl">
              <Money value={fromExternal} />
            </p>
          </Card>
        </div>
        <Card className="mb-5">
          <h2 className="mb-3 font-extrabold">إضافة صرفة</h2>
          <DeskExpenseForm />
        </Card>
        <h2 className="mb-3 font-extrabold">قائمة الصرفيات</h2>
        {rows.length ? (
          <div className="grid gap-3">
            {rows.map((row) => (
              <Card key={row.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold">{row.description}</p>
                    <p className="text-sm text-muted">{row.occurredOn}</p>
                  </div>
                  <div className="text-end">
                    <Money value={row.amountIqd} />
                    <div className="mt-1">
                      <Pill tone={row.fundFrom === "external" ? "warn" : "teal"}>
                        {row.fundFrom ? fundFromLabel[row.fundFrom] : "غير محدد"}
                      </Pill>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-muted">لا صرفيات بعد. أضف أول صرفة من النموذج أعلاه.</p>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
