import { Card, PageIntro, Pill } from "@/components/kit";
import { requireActor } from "@/lib/demo/session";
import { getDb } from "@/lib/demo/db";
import { formatDateTime } from "@/lib/domain/format";
import { getScannerRequest } from "@/lib/domain/scanner";
import { accessResponse } from "@/lib/ui/access";

const modeLabel = {
  courier: "مندوب سكنر للعيادة",
  booking: "حجز في المختبر",
} as const;

const statusLabel = {
  submitted: "مُرسل",
  scheduled: "مجدول",
  done: "منجز",
} as const;

export default async function ScannerRequestViewPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;
  try {
    const row = getScannerRequest(getDb(), actor, id);
    return (
      <div>
        <PageIntro eyebrow={row.caseCode} title={modeLabel[row.mode]} description={`الموعد: ${formatDateTime(row.dueAt)}`} />
        <Pill>{statusLabel[row.status]}</Pill>
        <Card className="mt-4">
          <p className="text-sm leading-7">{row.note}</p>
        </Card>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
