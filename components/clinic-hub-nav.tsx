"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClinicHubNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="تبويبات العيادة" className="-mx-1 mb-4 overflow-x-auto no-scrollbar">
      <ul className="flex gap-2 px-1">
        {items.map((item) => {
          const on = item.href === "/app/clinic" ? pathname === "/app/clinic" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`block shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold ${
                  on ? "bg-violet text-white shadow-[0_8px_16px_rgba(124,58,237,0.28)]" : "bg-white/80 text-plum ring-1 ring-line"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
