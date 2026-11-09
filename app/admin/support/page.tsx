import { closeTicketAction } from "@/lib/actions/community";
import { Card, PageIntro } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listSupport } from "@/lib/domain/admin";
import { formatDateTime } from "@/lib/domain/format";

export default async function SupportPage() {
  const actor = await requireActor();
  const tickets = listSupport(getDb(), actor);
  return (
    <div>
      <PageIntro title="الدعم" description="تذاكر تشغيل بلا محتوى طبي." />
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <p className="font-extrabold">{ticket.topic}</p>
            <p className="text-sm text-muted">{ticket.fromName} · {formatDateTime(ticket.createdAt)} · {ticket.status === "open" ? "مفتوحة" : "مغلقة"}</p>
            {ticket.status === "open" ? (
              <form action={closeTicketAction} className="mt-3">
                <input type="hidden" name="id" value={ticket.id} />
                <button className="h-10 rounded-xl bg-navy px-3 text-sm font-bold text-white" type="submit">إغلاق</button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
