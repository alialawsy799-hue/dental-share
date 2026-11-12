"use client";

import { SoftLink, useSoftRoute } from "@/components/soft-nav";

export function ClinicHubNav({ items }: { items: { href: string; label: string }[] }) {
  const { path, go } = useSoftRoute(items.map((item) => item.href));
  return (
    <nav aria-label="تبويبات العيادة" className="-mx-1 mb-4 overflow-x-auto no-scrollbar">
      <ul className="flex gap-2 px-1">
        {items.map((item) => (
          <li key={item.href}>
            <SoftLink
              href={item.href}
              exact={item.href === "/app/clinic"}
              path={path}
              onGo={go}
              className="block shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors duration-200 bg-white/80 text-plum ring-1 ring-line aria-[current=page]:bg-violet aria-[current=page]:text-white aria-[current=page]:shadow-[0_8px_16px_rgba(124,58,237,0.28)] aria-[current=page]:ring-0"
            >
              {item.label}
            </SoftLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
