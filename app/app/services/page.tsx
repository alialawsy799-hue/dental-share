import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Chevron, Glass, IconBadge, PageTitle, SectionHead, StatusPill } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { AccessError } from "@/lib/domain/errors";
import { has } from "@/lib/domain/guard";
import { labStatusLabel, serviceKindLabel, serviceStatusLabel } from "@/lib/domain/labels";
import { listClinicLabOrders } from "@/lib/domain/lab";
import { listClinicServiceOrders } from "@/lib/domain/services";
import { getLang, t, type Dict } from "@/lib/i18n";
import { accessResponse } from "@/lib/ui/access";

const cards: { kind: "lab" | "ortho" | "cbct" | "opg"; title: keyof Dict; body: keyof Dict; icon: IconName }[] = [
  { kind: "lab", title: "centralLab", body: "centralLabBody", icon: "lab" },
  { kind: "ortho", title: "ortho", body: "orthoBody", icon: "braces" },
  { kind: "cbct", title: "cbct", body: "cbctBody", icon: "scan" },
  { kind: "opg", title: "opg", body: "opgBody", icon: "panorama" },
];

const workEn: Record<string, string> = {
  "تاج": "Crown",
  "جسر": "Bridge",
  "قشرة": "Veneer",
  "طقم": "Denture",
  "زراعة": "Implant",
  "حشوة داخلية": "Inlay",
  "واقي ليلي": "Night guard",
};

const statusEn: Record<string, string> = {
  submitted: "Submitted",
  lab_review: "In review",
  accepted: "Accepted",
  needs_revision: "Needs revision",
  preparing: "Preparing",
  design: "Design",
  awaiting_doctor_approval: "Awaiting approval",
  manufacturing: "Manufacturing",
  quality_check: "Quality check",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected",
  on_hold: "On hold",
  in_progress: "In progress",
  needs_info: "Needs info",
  result_ready: "Result ready",
  closed: "Closed",
};

function toneOf(status: string): "violet" | "amber" | "green" | "rose" {
  if (["awaiting_doctor_approval", "needs_revision", "needs_info"].includes(status)) return "amber";
  if (["ready", "result_ready", "delivered", "closed"].includes(status)) return "green";
  if (["rejected"].includes(status)) return "rose";
  return "violet";
}

export default async function ServicesPage() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  if (!has(actor, "lab.read") && !has(actor, "lab.create")) {
    return accessResponse(new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل."));
  }
  const db = getDb();
  let rows: { id: string; title: string; code: string; status: string; tone: "violet" | "amber" | "green" | "rose"; icon: IconName }[] = [];
  try {
    if (has(actor, "lab.read")) {
      rows = [
        ...listClinicLabOrders(db, actor).map((order) => ({
          id: order.id,
          title: lang === "en" ? workEn[order.workType] ?? order.workType : order.workType,
          code: order.caseCode,
          status: lang === "en" ? statusEn[order.status] ?? order.status : labStatusLabel[order.status],
          tone: toneOf(order.status),
          icon: "lab" as const,
        })),
        ...listClinicServiceOrders(db, actor).map((order) => ({
          id: order.id,
          title: lang === "en" ? order.kind.toUpperCase() : serviceKindLabel[order.kind],
          code: order.caseCode,
          status: lang === "en" ? statusEn[order.status] ?? order.status : serviceStatusLabel[order.status],
          tone: toneOf(order.status),
          icon: (order.kind === "ortho" ? "braces" : order.kind === "opg" ? "panorama" : "scan") as IconName,
        })),
      ];
    }
  } catch (error) {
    return accessResponse(error);
  }

  return (
    <LangPage lang={lang}>
      <PageTitle title={d.servicesTitle} subtitle={d.servicesTagline} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <article key={card.kind} className="glass flex min-h-[196px] flex-col rounded-[22px] p-4 shadow-card">
            <IconBadge name={card.icon} />
            <h2 className="mt-3 text-[16px] font-extrabold leading-5 text-plum">{d[card.title]}</h2>
            <p className="mt-1 flex-1 text-[12px] leading-5 text-muted">{d[card.body]}</p>
            <Link
              href={`/app/services/new?kind=${card.kind}`}
              className="btn-violet mt-3 inline-flex h-10 items-center justify-center gap-1 rounded-xl text-[13px] font-bold"
            >
              <Icon name="plus" className="h-4 w-4" />
              {d.createRequest}
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-7">
        <SectionHead title={d.trackRequests} hint={d.trackRequestsHint} action={rows.length ? { href: "/app/notifications", label: d.viewAll } : undefined} />
        {rows.length ? (
          <div className="grid gap-3">
            {rows.map((row) => (
              <Link key={row.id} href={`/app/services/orders/${row.id}`} className="glass flex items-center gap-3 rounded-[22px] p-3.5 shadow-card">
                <IconBadge name={row.icon} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-extrabold text-plum">{row.title}</span>
                  <span className="block text-[12px] text-muted">
                    {d.request} <span dir="ltr">{row.code}</span>
                  </span>
                </span>
                <StatusPill tone={row.tone}>{row.status}</StatusPill>
                <Chevron lang={lang} />
              </Link>
            ))}
          </div>
        ) : (
          <Glass>
            <p className="text-sm text-muted">{d.noRequests}</p>
          </Glass>
        )}
      </section>
    </LangPage>
  );
}
