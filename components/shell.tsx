import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AppLogo, BrandLockup } from "@/components/brand";
import { DoctorBottomNav } from "@/components/doctor-nav";
import { Icon } from "@/components/icons";
import { NoticeBanner } from "@/components/notice";
import { MobilePills, SideNav, type SideNavItem } from "@/components/side-nav";
import { dirOf, t, type Lang } from "@/lib/i18n";

export function DoctorShell({ lang, children }: { lang: Lang; children: ReactNode }) {
  const d = t(lang);
  const dir = dirOf(lang);
  return (
    <div dir={dir} className="min-h-dvh bg-[#ebe4fb] font-sans text-plum">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2">
        {d.skip}
      </a>
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-hidden bg-[radial-gradient(120%_60%_at_50%_0%,#f7f3ff_0%,#ece4fb_55%,#e4dafa_100%)] shadow-[0_0_40px_rgba(84,56,160,0.10)]">
        <div className="pointer-events-none absolute -left-20 top-40 h-56 w-56 rounded-full bg-[#c9b8ff]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-[55%] h-64 w-64 rounded-full bg-[#dcd0ff]/50 blur-3xl" />
        <header className="relative z-10 flex items-center justify-between px-4 pt-4">
          <AppLogo />
          <Link
            href="/app/notifications"
            prefetch
            aria-label={d.notifications}
            className="glass grid h-11 w-11 place-items-center rounded-2xl text-plum shadow-card"
          >
            <Icon name="bell" className="h-5 w-5" />
          </Link>
        </header>
        <main id="main" dir="rtl" className="relative z-10 px-4 pb-32 pt-4 font-sans">
          <Suspense fallback={null}>
            <NoticeBanner />
          </Suspense>
          {children}
        </main>
        <DoctorBottomNav labels={d} ariaLabel={d.mainNav} />
      </div>
    </div>
  );
}

export function LangPage({ lang, children, className = "" }: { lang: Lang; children: ReactNode; className?: string }) {
  return (
    <div dir={dirOf(lang)} className={`font-sans ${className}`}>
      {children}
    </div>
  );
}

export function PortalShell({
  title,
  nav,
  children,
  accent = "soft",
}: {
  title: string;
  nav: SideNavItem[];
  children: ReactNode;
  accent?: "soft" | "pill";
}) {
  return (
    <div className="min-h-dvh bg-mist text-navy sm:grid sm:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className={`sticky top-0 hidden h-dvh flex-col p-5 text-white sm:flex ${accent === "pill" ? "bg-[#120b1f]" : "bg-navy"}`}>
        <BrandLockup tone="onDark" />
        <p className="mt-6 text-sm font-bold text-aqua">{title}</p>
        <SideNav title={title} items={nav} accent={accent} />
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-white sm:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <BrandLockup compact />
            <Link href="/enter" className="text-xs font-bold text-teal">
              تبديل
            </Link>
          </div>
          <MobilePills title={title} items={nav} />
        </header>
        <main id="main" className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <Suspense fallback={null}>
            <NoticeBanner />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
