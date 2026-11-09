import { transitionLabAction } from "@/lib/actions/services";
import { NoteForm, RemakeForm } from "@/components/forms/note-form";
import { Card, PageIntro, Pill, Timeline, statusTone } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { formatDateTime } from "@/lib/domain/format";
import { has } from "@/lib/domain/guard";
import { labStatusLabel, priorityLabel, serviceKindLabel, serviceStatusLabel } from "@/lib/domain/labels";
import { getLabOrder } from "@/lib/domain/lab";
import { getClinicServiceOrder } from "@/lib/domain/services";
import { accessResponse } from "@/lib/ui/access";

export default async function ServiceOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const { error } = await searchParams;
  const db = getDb();
  try {
    const order = getLabOrder(db, actor, id);
    const moves = order.status === "awaiting_doctor_approval" && has(actor, "lab.create")
      ? [
          { to: "manufacturing", label: "اعتماد التصميم" },
          { to: "needs_revision", label: "طلب تعديل" },
        ]
      : order.status === "needs_revision" && has(actor, "lab.create")
        ? [{ to: "submitted", label: "إعادة الإرسال" }]
        : [];
    return (
      <div>
        <PageIntro eyebrow={order.caseCode} title={`${serviceKindLabel.lab} · ${order.workType}`} description={order.audience === "clinic_finance" ? "عرض مالي بلا ملفات أو ملاحظات سريرية." : `الطبيب: ${order.doctorName}`} />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <div className="mb-4 flex flex-wrap gap-2">
          <Pill tone={statusTone(order.status)}>{labStatusLabel[order.status]}</Pill>
          <Pill>{priorityLabel[order.priority]}</Pill>
          {order.invoice ? <Pill tone={order.invoice.status === "paid" ? "teal" : "warn"}>{order.invoice.status === "paid" ? "فاتورة مدفوعة" : "فاتورة مستحقة"}</Pill> : null}
        </div>
        {order.audience !== "clinic_finance" ? (
          <Card>
            <p className="text-sm leading-7">الأسنان: {order.teeth?.join("، ")} · اللون {order.shade} · {order.material}</p>
            <p className="mt-2 text-sm text-muted">التسليم المطلوب {formatDateTime(order.dueAt)}</p>
            {order.patientName ? <p className="mt-2 text-sm">المريض داخل العيادة: {order.patientName}</p> : null}
            {order.clinicalNotes ? <p className="mt-3 rounded-2xl bg-mist p-3 text-sm leading-7">{order.clinicalNotes}</p> : null}
            {order.attachments?.length ? <p className="mt-3 text-sm">ملفات: {order.attachments.map((file) => file.name).join("، ")}</p> : null}
          </Card>
        ) : (
          <Card>
            <p className="text-sm">رمز الحالة {order.caseCode}</p>
            {order.invoice ? <p className="mt-2 font-bold">{order.invoice.amountIqd.toLocaleString("en-US")} د.ع</p> : <p className="mt-2 text-sm text-muted">لا فاتورة بعد.</p>}
          </Card>
        )}
        <Card className="mt-4">
          <h2 className="mb-2 font-extrabold">المسار</h2>
          <Timeline items={order.timeline.map((item) => ({ label: item.label, meta: item.actorName, at: formatDateTime(item.at) }))} />
        </Card>
        {moves.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {moves.map((move) => (
              <form key={move.to} action={transitionLabAction}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="to" value={move.to} />
                <input type="hidden" name="returnTo" value={`/app/services/orders/${order.id}`} />
                {move.to === "needs_revision" ? <input name="reason" required placeholder="سبب التعديل" className="mb-2 h-11 rounded-xl border border-line px-3" /> : null}
                <SubmitButton>{move.label}</SubmitButton>
              </form>
            ))}
          </div>
        ) : null}
        {order.audience === "clinic_clinical" ? (
          <Card className="mt-4">
            <NoteForm id={order.id} returnTo={`/app/services/orders/${order.id}`} />
            {order.status === "delivered" ? <div className="mt-4"><RemakeForm id={order.id} /></div> : null}
          </Card>
        ) : null}
      </div>
    );
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") {
      try {
        const order = getClinicServiceOrder(db, actor, id);
        return (
          <div>
            <PageIntro eyebrow={order.caseCode} title={serviceKindLabel[order.kind]} description={order.providerName} />
            <Pill tone={statusTone(order.status)}>{serviceStatusLabel[order.status]}</Pill>
            <Card className="mt-4">
              <p className="text-sm leading-7">{order.purpose}</p>
              {order.region ? <p className="mt-2 text-sm text-muted">المنطقة: {order.region}</p> : null}
              {order.instructions ? <p className="mt-2 text-sm leading-7">{order.instructions}</p> : null}
              {order.patientName ? <p className="mt-2 text-sm">المريض داخل العيادة: {order.patientName}</p> : null}
              {order.result ? (
                <div className="mt-3 rounded-2xl bg-mist p-3 text-sm leading-7">
                  <p className="font-bold">النتيجة</p>
                  <p>{order.result.summary}</p>
                  {order.result.fileName ? <p className="text-muted">{order.result.fileName}</p> : null}
                </div>
              ) : null}
            </Card>
            <Card className="mt-4">
              <Timeline items={order.timeline.map((item) => ({ label: item.label, meta: item.actorName, at: formatDateTime(item.at) }))} />
            </Card>
          </div>
        );
      } catch (inner) {
        return accessResponse(inner);
      }
    }
    return accessResponse(error);
  }
}
