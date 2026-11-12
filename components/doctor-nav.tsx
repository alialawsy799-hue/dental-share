"use client";

import { Icon, type IconName } from "@/components/icons";
import { SoftLink, useSoftRoute } from "@/components/soft-nav";
import type { Dict } from "@/lib/i18n";

type NavKey = "navHome" | "navClinic" | "navServices" | "navStores" | "navProfile";

const items: { href: string; key: NavKey; icon: IconName }[] = [
  { href: "/app", key: "navHome", icon: "home" },
  { href: "/app/clinic", key: "navClinic", icon: "clinic" },
  { href: "/app/services", key: "navServices", icon: "services" },
  { href: "/app/stores", key: "navStores", icon: "store" },
  { href: "/app/profile", key: "navProfile", icon: "user" },
];

const prefetch = items.map((item) => item.href);

export function DoctorBottomNav({ labels, ariaLabel }: { labels: Pick<Dict, NavKey>; ariaLabel: string }) {
  const { path, pending, go } = useSoftRoute(prefetch);
  return (
    <>
      <div className={`route-progress ${pending ? "is-on" : ""}`} aria-hidden="true" />
      <nav
        aria-label={ariaLabel}
        className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-3 pb-3"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      >
        <ul className="grid grid-cols-5 rounded-[26px] border border-white bg-white/95 p-1.5 shadow-[0_-4px_30px_rgba(84,56,160,0.14)] backdrop-blur">
          {items.map((item) => (
            <li key={item.href}>
              <SoftLink
                href={item.href}
                exact={item.href === "/app"}
                path={path}
                onGo={go}
                className="flex h-[3.9rem] flex-col items-center justify-center gap-1 rounded-[20px] text-[11px] font-bold text-[#9a92b3] transition-colors duration-200 aria-[current=page]:bg-lavender-deep aria-[current=page]:text-violet"
              >
                <Icon name={item.icon} className="h-[22px] w-[22px]" />
                <span className="whitespace-nowrap text-[10.5px] leading-none">{labels[item.key]}</span>
              </SoftLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
