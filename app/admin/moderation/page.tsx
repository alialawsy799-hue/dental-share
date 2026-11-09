import { resolvePostAction } from "@/lib/actions/community";
import { Card, EmptyState, PageIntro } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listModeration } from "@/lib/domain/community";

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  const items = listModeration(getDb(), actor);
  return (
    <div>
      <PageIntro title="إشراف المجتمع" description="النشر العام متوقف. يمكن إزالة منشور أو إبقاء التجريبي بعد التبليغ. يُرفض نشر نص فيه بيانات تعريفية." />
      {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
      {items.length ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <p className="text-sm text-muted">{item.authorName} · {item.status === "pending_review" ? "بانتظار المراجعة" : "منشور مبلَّغ"}</p>
              <p className="mt-2 text-sm leading-7">{item.body}</p>
              {item.reports.length ? <p className="mt-2 text-sm text-warning">البلاغات: {item.reports.join(" · ")}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {(["dismiss", "remove"] as const).map((decision) => (
                  <form key={decision} action={resolvePostAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="decision" value={decision} />
                    <button className="h-10 rounded-xl bg-white px-3 text-sm font-bold ring-1 ring-line" type="submit">
                      {decision === "dismiss" ? "حفظ المنشور وإغلاق البلاغ" : "إزالة"}
                    </button>
                  </form>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="الطابور فارغ" body="لا منشورات معلّقة أو بلاغات مفتوحة." />
      )}
    </div>
  );
}
