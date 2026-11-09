import { assignTechAction, invoiceAction } from "@/lib/actions/commerce";
import { transitionLabAction } from "@/lib/actions/services";
import { NoteForm } from "@/components/forms/note-form";
import { Card, PageIntro, Pill, Timeline, statusTone } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { labStatusLabel } from "@/lib/domain/labels";
import { getLabOrder, listTechnicians } from "@/lib/domain/lab";
import { accessResponse } from "@/lib/ui/access";

const nextBy: Record<string, { to: string; label: string; reason?: boolean }[]> = {
  submitted: [{ to: "lab_review", label: "بدء المراجعة" }, { to: "rejected", label: "رفض", reason: true }],
  lab_review: [{ to: "accepted", label: "قبول" }, { to: "needs_revision", label: "بحاجة تعديل", reason: true }, { to: "on_hold", label: "تعليق", reason: true }],
  accepted: [{ to: "preparing", label: "تحت التحضير" }],
  preparing: [{ to: "design", label: "إلى التصميم" }],
  design: [{ to: "awaiting_doctor_approval", label: "طلب اعتماد الطبيب" }],
  manufacturing: [{ to: "quality_check", label: "فحص الجودة" }],
  quality_check: [{ to: "ready", label: "جاهز" }],
  ready: [{ to: "out_for_delivery", label: "خرج للتوصيل" }],
  out_for_delivery: [{ to: "delivered", label: "تم التسليم" }],
  on_hold: [{ to: "lab_review", label: "إعادة المراجعة" }],
};

export default async function LabOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const { error } = await searchParams;
  const db = getDb();
  try {
    const order = getLabOrder(db, actor, id);
    const technicians = actor.role === "lab_manager" ? listTechnicians(db, actor) : [];
    const moves = nextBy[order.status] ?? [];
    return (
      <div>
        <PageIntro eyebrow={order.clinicName} title={`${order.workType} · ${order.caseCode}`} description={`${order.doctorName} · تسليم ${formatDateTime(order.dueAt)}`} />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <Pill tone={statusTone(order.status)}>{labStatusLabel[order.status]}</Pill>
        <Card className="mt-4">
          <p className="text-sm leading-7">الأسنان {order.teeth?.join("، ")} · {order.shade} · {order.material}</p>
          {order.technicianName ? <p className="mt-2 text-sm">الفني: {order.technicianName}</p> : null}
          {order.attachments?.length ? <p className="mt-2 text-sm">ملفات مشاركة: {order.attachments.map((file) => file.name).join("، ")}</p> : null}
        </Card>
        <Card className="mt-4">
          <Timeline items={order.timeline.map((item) => ({ label: item.label, meta: item.actorName, at: formatDateTime(item.at) }))} />
        </Card>
        <div className="mt-4 grid gap-3">
          {moves.map((move) => (
            <form key={move.to} action={transitionLabAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="to" value={move.to} />
              <input type="hidden" name="returnTo" value={`/lab/orders/${order.id}`} />
              {move.reason ? <input name="reason" required placeholder="السبب" aria-label="السبب" className="h-11 rounded-xl border border-line px-3" /> : null}
              <SubmitButton>{move.label}</SubmitButton>
            </form>
          ))}
        </div>
        {actor.role === "lab_manager" ? (
          <Card className="mt-4">
            <h2 className="font-extrabold">تعيين فني</h2>
            <form action={assignTechAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="technicianId" className="h-11 rounded-xl border border-line px-3" aria-label="الفني">
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
              <SubmitButton>تعيين</SubmitButton>
            </form>
            {!order.invoice ? (
              <form action={invoiceAction} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={order.id} />
                <input name="amountIqd" required inputMode="numeric" placeholder="مبلغ الفاتورة" aria-label="مبلغ الفاتورة" className="h-11 rounded-xl border border-line px-3" />
                <SubmitButton variant="ghost">إصدار فاتورة مستحقة</SubmitButton>
              </form>
            ) : (
              <p className="mt-4 text-sm">فاتورة {order.invoice.status === "paid" ? "مدفوعة" : "مستحقة"}: {order.invoice.amountIqd.toLocaleString("en-US")} د.ع</p>
            )}
          </Card>
        ) : null}
        <Card className="mt-4">
          <NoteForm id={order.id} returnTo={`/lab/orders/${order.id}`} />
        </Card>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
