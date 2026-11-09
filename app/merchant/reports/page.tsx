import { Card, Money, PageIntro } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { merchantReport } from "@/lib/domain/commerce";

export default async function MerchantReportPage() {
  const actor = await requireActor();
  const report = merchantReport(getDb(), actor);
  return (
    <div>
      <PageIntro title="تقرير المتجر" description="أرقام الطلبات فقط، بلا بيانات مرضى." />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><p className="text-sm text-muted">الطلبات</p><p className="mt-2 text-2xl font-extrabold">{report.orders}</p></Card>
        <Card><p className="text-sm text-muted">المسلَّم</p><p className="mt-2 text-2xl font-extrabold">{report.delivered}</p></Card>
        <Card><p className="text-sm text-muted">قيمة الطلبات غير الملغاة</p><p className="mt-2"><Money value={report.grossIqd} /></p></Card>
        <Card><p className="text-sm text-muted">المنتجات</p><p className="mt-2 text-2xl font-extrabold">{report.products}</p></Card>
      </div>
    </div>
  );
}
