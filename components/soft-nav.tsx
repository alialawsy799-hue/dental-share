"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ComponentProps, type MouseEvent, type ReactNode } from "react";

export function isRouteOn(pathname: string, href: string, exact = false) {
  const path = href.split("?")[0] ?? href;
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function useSoftRoute(prefetch: string[] = []) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [path, setPath] = useState(pathname);
  const routes = useRef(prefetch);
  routes.current = prefetch;

  useEffect(() => {
    setPath(pathname);
  }, [pathname]);

  useEffect(() => {
    for (const href of routes.current) router.prefetch(href);
  }, [router]);

  function go(href: string) {
    const next = href.split("?")[0] ?? href;
    if (next === pathname) return;
    setPath(next);
    startTransition(() => {
      router.push(href);
    });
  }

  return { path, pending, go };
}

export function SoftLink({
  href,
  exact = false,
  path,
  onGo,
  className = "",
  children,
  ...rest
}: {
  href: string;
  exact?: boolean;
  path: string;
  onGo: (href: string) => void;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "prefetch" | "onClick">) {
  const on = isRouteOn(path, href, exact);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onGo(href);
  }

  return (
    <Link href={href} prefetch aria-current={on ? "page" : undefined} className={className} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
