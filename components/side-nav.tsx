"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export type SideNavItem = { href: string; label: string; icon?: IconName };

function isOn(pathname: string, href: string) {
  if (href === "/admin" || href === "/lab" || href === "/merchant" || href === "/provider" || href === "/desk") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ title, items, accent = "soft" }: { title: string; items: SideNavItem[]; accent?: "soft" | "pill" }) {
  const pathname = usePathname();
  return (
    <nav aria-label={title} className="mt-6 flex min-h-0 flex-1 flex-col gap-1">
      {items.map((item) => {
        const on = isOn(pathname, item.href);
        const active = accent === "pill" && on;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition ${
              active ? "bg-violet text-white shadow-[0_10px_24px_rgba(124,58,237,0.35)]" : on ? "bg-white/16 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.icon ? (
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active || on ? "bg-white/15 text-white" : "bg-white/10 text-white/80"}`}>
                <Icon name={item.icon} className="h-5 w-5" />
              </span>
            ) : null}
            {item.label}
          </Link>
        );
      })}
      <Link href="/enter" className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-white/55 hover:bg-white/10 hover:text-white">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
          <Icon name="logout" className="h-5 w-5" />
        </span>
        تبديل الدور
      </Link>
    </nav>
  );
}

export function MobilePills({ title, items }: { title: string; items: SideNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label={title} className="flex gap-2 overflow-x-auto px-4 pb-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isOn(pathname, item.href) ? "page" : undefined}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${
            isOn(pathname, item.href) ? "bg-violet text-white" : "bg-mist text-plum"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
