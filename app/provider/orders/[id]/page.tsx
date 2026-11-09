import { providerStatusAction } from "@/lib/actions/community";
import { ResultForm } from "@/components/forms/result-form";
import { Card, PageIntro, Pill, Timeline, statusTone } from "@/components/kit";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { serviceKindLabel, serviceStatusLabel } from "@/lib/domain/labels";
import { getProviderOrder } from "@/lib/domain/services";
import type { ServiceStatus } from "@/lib/domain/types";
import { accessResponse } from "@/lib/ui/access";

const next: Partial<Record<ServiceStatus, { to: ServiceStatus; label: string }[]>> = {
  submitted: [{ to: "accepted", label: "قبول" }, { to: "needs_info", label: "طلب استكمال" }],
  needs_info: [{ to: "accepted", label: "قبول بعد الاستكمال" }],
  accepted: [{ to: "in_progress", label: "بدء التنفيذ" }],
  in_progress: [],
  result_ready: [{ to: "closed", label: "إغلاق" }],
};

export default async function ProviderOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  const { error } = await searchParams;
  try {
    const order = getProviderOrder(getDb(), actor, id);
    return (
      <div>
        <PageIntro eyebrow={order.clinicName} title={`${serviceKindLabel[order.kind]} · ${order.caseCode}`} description={order.doctorName} />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <Pill tone={statusTone(order.status)}>{serviceStatusLabel[order.status]}</Pill>
        <Card className="mt-4">
          <p className="text-sm leading-7">{order.purpose}</p>
          {order.region ? <p className="mt-2 text-sm">المنطقة: {order.region}</p> : null}
          {order.instructions ? <p className="mt-2 text-sm leading-7">{order.instructions}</p> : null}
          <p className="mt-2 text-sm text-muted">المطلوب {formatDateTime(order.dueAt)}</p>
        </Card>
        {order.result ? <Card className="mt-4"><p className="font-bold">النتيجة المرفوعة</p><p className="mt-2 text-sm leading-7">{order.result.summary}</p></Card> : null}
        <Card className="mt-4"><Timeline items={order.timeline.map((item) => ({ label: item.label, at: formatDateTime(item.at) }))} /></Card>
        <div className="mt-4 flex flex-wrap gap-2">
          {(next[order.status] ?? []).map((step) => (
            <form key={step.to} action={providerStatusAction}>
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="to" value={step.to} />
              <SubmitButton>{step.label}</SubmitButton>
            </form>
          ))}
        </div>
        {order.status === "in_progress" || order.status === "accepted" ? (
          <Card className="mt-4"><ResultForm id={order.id} /></Card>
        ) : null}
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
