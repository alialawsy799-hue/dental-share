import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { Chevron, Glass, HeroTooth, IconBadge, SectionHead, StatusPill } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatTime } from "@/lib/domain/format";
import { has } from "@/lib/domain/guard";
import { listNotifications } from "@/lib/domain/home";
import { labStatusLabel } from "@/lib/domain/labels";
import { DEMO_TODAY } from "@/lib/domain/types";
import { fill, getLang, t, type Dict } from "@/lib/i18n";

const welcomeName: Record<string, { en: string; ar: string }> = {
  user_ahmed: { en: "Dr. Ahmed", ar: "د. أحمد" },
  user_layla: { en: "Dr. Layla", ar: "د. ليلى" },
  user_reception: { en: "Sara", ar: "سارة" },
  user_accountant: { en: "Ali", ar: "علي" },
  user_sara: { en: "Dr. Sara", ar: "د. سارة" },
};

const shortcuts: { href: string; key: keyof Dict; icon: IconName }[] = [
  { href: "/app/clinic", key: "navClinic", icon: "clinic" },
  { href: "/app/services", key: "navServices", icon: "services" },
  { href: "/app/stores", key: "navStores", icon: "store" },
  { href: "/app/community", key: "communityDr", icon: "chat" },
];

const actions: { href: string; title: keyof Dict; hint: keyof Dict; icon: IconName }[] = [
  { href: "/app/services/new?kind=lab", title: "sendLab", hint: "sendLabHint", icon: "lab" },
  { href: "/app/stores", title: "orderStores", hint: "orderStoresHint", icon: "cart" },
  { href: "/app/community", title: "followCommunity", hint: "followCommunityHint", icon: "users" },
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
  awaiting_doctor_approval: "Awaiting your approval",
  manufacturing: "Manufacturing",
  design: "Design",
  ready: "Ready",
  quality_check: "Quality check",
  out_for_delivery: "Out for delivery",
};

export default async function DoctorHome() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const db = getDb();
  const name = welcomeName[actor.id]?.[lang] ?? actor.name;

  type Update = { id: string; href: string; kind: keyof Dict; title: string; body: string; pill?: string; icon: IconName };
  const updates: Update[] = [];

  if (has(actor, "appointments.manage")) {
    const next = db.appointments
      .filter((item) => item.clinicId === actor.clinicId && item.startsAt.startsWith(DEMO_TODAY) && item.status === "confirmed")
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
    if (next) {
      const patient = db.patients.find((item) => item.id === next.patientId && item.clinicId === actor.clinicId);
      updates.push({
        id: next.id,
        href: "/app/clinic/appointments",
        kind: "nextAppointment",
        title: `${d.appointmentWith} ${patient?.name ?? ""}`.trim(),
        body: next.visitType,
        pill: `${d.today} ${formatTime(next.startsAt)}`,
        icon: "calendar",
      });
    }
  }

  if (has(actor, "lab.read")) {
    const order = db.labOrders
      .filter((item) => item.clinicId === actor.clinicId && !["delivered", "rejected", "draft"].includes(item.status))
      .sort((a, b) => (a.status === "awaiting_doctor_approval" ? -1 : b.status === "awaiting_doctor_approval" ? 1 : 0))[0];
    if (order) {
      const status = lang === "en" ? statusEn[order.status] ?? order.status : labStatusLabel[order.status];
      updates.push({
        id: order.id,
        href: `/app/services/orders/${order.id}`,
        kind: "labNotice",
        title: `${lang === "en" ? workEn[order.workType] ?? order.workType : order.workType} · ${order.caseCode}`,
        body: fill(d.labNoticeBody, { code: order.caseCode, status }),
        icon: "lab",
      });
    }
  }

  if (updates.length < 2) {
    for (const notice of listNotifications(db, actor).slice(0, 2 - updates.length)) {
      updates.push({ id: notice.id, href: notice.href, kind: "notifications", title: notice.title, body: notice.body, icon: "bell" });
    }
  }

  return (
    <LangPage lang={lang}>
      <section className="relative mt-2 flex items-start gap-3">
        <div className="min-w-0 flex-1 pt-2">
          <h1 className="text-[28px] font-extrabold leading-[1.2] tracking-tight text-plum">
            {d.welcome} {name} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-muted">{d.homeTagline}</p>
        </div>
        <HeroTooth className="-mt-1 h-[138px] w-[160px] shrink-0" />
      </section>

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="glass flex aspect-[0.9] flex-col items-center justify-center gap-2 rounded-[22px] shadow-card">
            <IconBadge name={item.icon} size="sm" />
            <span className="px-1 text-center text-[11px] font-bold leading-tight text-plum">{d[item.key]}</span>
          </Link>
        ))}
      </div>

      <section className="mt-7">
        <SectionHead title={d.quickActions} hint={d.quickHint} />
        <div className="grid gap-3">
          {actions.map((item) => (
            <Link key={item.title} href={item.href} className="glass flex items-center gap-3 rounded-[22px] p-3.5 shadow-card">
              <IconBadge name={item.icon} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold text-plum">{d[item.title]}</span>
                <span className="block text-[12px] leading-5 text-muted">{d[item.hint]}</span>
              </span>
              <Chevron lang={lang} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionHead title={d.latestUpdates} action={{ href: "/app/notifications", label: d.viewAll }} />
        {updates.length ? (
          <div className="grid gap-3">
            {updates.map((item) => (
              <Glass key={item.id}>
                <div className="flex items-start gap-3">
                  <IconBadge name={item.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold text-violet">{d[item.kind]}</p>
                      {item.pill ? <StatusPill>{item.pill}</StatusPill> : null}
                    </div>
                    <p className="mt-1 text-[15px] font-extrabold text-plum">{item.title}</p>
                    <p className="mt-0.5 text-[13px] leading-5 text-muted">{item.body}</p>
                    <Link href={item.href} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-violet">
                      {d.details}
                      <Icon name="chevron" className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
                    </Link>
                  </div>
                </div>
              </Glass>
            ))}
          </div>
        ) : (
          <Glass>
            <p className="text-sm text-muted">{d.noUpdates}</p>
          </Glass>
        )}
      </section>
    </LangPage>
  );
}
