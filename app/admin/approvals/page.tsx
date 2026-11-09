import { approvalAction } from "@/lib/actions/community";
import { Card, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listApprovals } from "@/lib/domain/admin";

export default async function ApprovalsPage() {
  const actor = await requireActor();
  const data = listApprovals(getDb(), actor);
  const groups = [
    ["clinic", "عيادات", data.clinics],
    ["store", "متاجر", data.stores],
    ["doctor", "أطباء", data.doctors],
  ] as const;
  return (
    <div>
      <PageIntro title="الاعتمادات" description="موافقة تشغيلية على الانضمام. لا تفتح ملفاً طبياً." />
      <div className="grid gap-4">
        {groups.map(([kind, title, items]) => (
          <section key={kind}>
            <h2 className="mb-2 font-extrabold">{title}</h2>
            <div className="grid gap-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold">{item.name}</p>
                      <p className="text-sm text-muted">{item.detail}</p>
                    </div>
                    <Pill tone={item.status === "pending" ? "warn" : item.status === "approved" ? "teal" : "danger"}>
                      {item.status === "pending" ? "بانتظار" : item.status === "approved" ? "مقبول" : "مرفوض"}
                    </Pill>
                  </div>
                  {item.status === "pending" ? (
                    <div className="mt-3 flex gap-2">
                      <form action={approvalAction}>
                        <input type="hidden" name="kind" value={kind} />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <button className="h-10 rounded-xl bg-navy px-3 text-sm font-bold text-white" type="submit">اعتماد</button>
                      </form>
                      <form action={approvalAction}>
                        <input type="hidden" name="kind" value={kind} />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="decision" value="rejected" />
                        <button className="h-10 rounded-xl bg-white px-3 text-sm font-bold ring-1 ring-line" type="submit">رفض</button>
                      </form>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
