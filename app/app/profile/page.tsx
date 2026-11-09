import { savePrefsAction } from "@/lib/actions/clinic";
import { setLangAction } from "@/lib/actions/lang";
import { logoutAction } from "@/app/enter/actions";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, Chevron, Glass, IconBadge, PageTitle, StatusPill } from "@/components/purple";
import { LangPage } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { getDb } from "@/lib/demo/db";
import { demoMode, requireActor } from "@/lib/demo/session";
import { roleLabel } from "@/lib/domain/labels";
import { getLang, t } from "@/lib/i18n";

const roleEn: Record<string, string> = {
  clinic_owner: "Clinic owner",
  clinic_doctor: "Doctor",
  clinic_reception: "Reception",
  clinic_accountant: "Accountant",
};

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-3">
      <span className="text-[14px] font-bold text-plum">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex h-7 w-12 shrink-0 items-center justify-start rounded-full bg-[#d9d3ea] p-1 transition peer-checked:justify-end peer-checked:bg-violet peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-violet">
        <span className="h-5 w-5 rounded-full bg-white shadow" />
      </span>
    </label>
  );
}

export default async function ProfilePage() {
  const actor = await requireActor();
  const lang = await getLang();
  const d = t(lang);
  const db = getDb();
  const user = db.users.find((item) => item.id === actor.id);
  const clinic = db.clinics.find((item) => item.id === actor.clinicId);
  const staff = db.users.filter((item) => item.clinicId && item.clinicId === actor.clinicId);
  const subscription = db.subscriptions.find((item) => item.clinicId === actor.clinicId);
  const role = (value: string) => (lang === "en" ? roleEn[value] ?? value : roleLabel[value as keyof typeof roleLabel]);

  const row = (icon: IconName, title: string, hint: string) => (
    <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
      <IconBadge name={icon} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-extrabold text-plum">{title}</span>
        <span className="block text-[12px] leading-5 text-muted">{hint}</span>
      </span>
      <Chevron lang={lang} />
    </summary>
  );

  return (
    <LangPage lang={lang}>
      <PageTitle title={d.profileTitle} subtitle={d.profileTagline} />

      <Glass className="mt-5">
        <div className="flex items-center gap-4">
          <Avatar name={actor.name} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-extrabold text-plum">{actor.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <StatusPill>{role(actor.role)}</StatusPill>
              {actor.verified ? (
                <StatusPill tone="green">
                  <Icon name="check" className="me-1 h-3 w-3" />
                  {d.verified}
                </StatusPill>
              ) : null}
            </div>
            {clinic ? <p className="mt-1.5 truncate text-[13px] text-muted">{clinic.name}</p> : null}
            {user?.email ? (
              <p dir="ltr" className="mt-0.5 truncate text-start text-[12px] text-muted">
                {user.email}
              </p>
            ) : null}
          </div>
        </div>
      </Glass>

      <Glass className="mt-4">
        <div className="flex items-center gap-3">
          <IconBadge name="globe" />
          <div className="flex-1">
            <h2 className="text-[15px] font-extrabold text-plum">{d.appLanguage}</h2>
            <p className="text-[12px] text-muted">{d.appLanguageHint}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-lavender p-1" role="group" aria-label={d.appLanguage}>
          {(["ar", "en"] as const).map((option) => {
            const on = lang === option;
            return (
              <form key={option} action={setLangAction}>
                <input type="hidden" name="lang" value={option} />
                <input type="hidden" name="returnTo" value="/app/profile" />
                <button
                  type="submit"
                  aria-pressed={on}
                  className={`h-11 w-full rounded-xl text-sm font-bold transition ${on ? "btn-violet" : "text-plum"}`}
                >
                  {option === "ar" ? d.arabic : d.english}
                </button>
              </form>
            );
          })}
        </div>
      </Glass>

      <div className="mt-4 grid gap-3">
        {clinic ? (
          <details className="glass group rounded-[22px] p-4 shadow-card">
            {row("building", d.clinicInfo, d.clinicInfoHint)}
            <dl className="mt-3 grid gap-2 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{d.clinicInfo}</dt>
                <dd className="font-bold text-plum">{clinic.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{d.branch}</dt>
                <dd className="font-bold text-plum">
                  {clinic.branchName} · {clinic.district} · {clinic.city}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{d.phone}</dt>
                <dd dir="ltr" className="font-bold text-plum">
                  {clinic.phone}
                </dd>
              </div>
            </dl>
          </details>
        ) : null}

        <details className="glass group rounded-[22px] p-4 shadow-card">
          {row("users", d.teamTitle, d.teamHint)}
          <ul className="mt-3 divide-y divide-line border-t border-line text-[13px]">
            {staff.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="flex items-center gap-2">
                  <Avatar name={member.name} className="h-8 w-8 text-[11px]" />
                  <span className="font-bold text-plum">{member.name}</span>
                </span>
                <StatusPill>{role(member.role)}</StatusPill>
              </li>
            ))}
          </ul>
        </details>

        {user ? (
          <details className="glass group rounded-[22px] p-4 shadow-card" open>
            {row("bell", d.notifSettings, d.notifHint)}
            <form action={savePrefsAction} className="mt-3 border-t border-line pt-1">
              <div className="divide-y divide-line">
                <Toggle name="appointments" label={d.notifAppointments} defaultChecked={user.notificationPrefs.appointments} />
                <Toggle name="orders" label={d.notifOrders} defaultChecked={user.notificationPrefs.orders} />
                <Toggle name="community" label={d.notifCommunity} defaultChecked={user.notificationPrefs.community} />
              </div>
              <div className="mt-2">
                <SubmitButton>{d.save}</SubmitButton>
              </div>
            </form>
          </details>
        ) : null}

        <details className="glass group rounded-[22px] p-4 shadow-card">
          {row("shield", d.privacy, d.privacyShort)}
          <div className="mt-3 border-t border-line pt-3 text-[13px] leading-6 text-plum">
            <p>{d.privacyHint}</p>
            {subscription ? <p className="mt-2 rounded-2xl bg-lavender p-3 text-[12px] leading-5 text-muted">{subscription.note}</p> : null}
          </div>
        </details>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {demoMode() ? (
          <a href="/enter" className="glass inline-flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-plum shadow-card">
            <Icon name="refresh" className="h-4.5 w-4.5 text-violet" />
            {d.switchRole}
          </a>
        ) : null}
        <form action={logoutAction} className={demoMode() ? "" : "col-span-2"}>
          <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#fde8ec] text-sm font-bold text-[#c63d53]" type="submit">
            <Icon name="logout" className="h-4.5 w-4.5" />
            {d.logout}
          </button>
        </form>
      </div>
    </LangPage>
  );
}
