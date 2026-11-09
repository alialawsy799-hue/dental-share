import { MobilePills, SideNav, type SideNavItem } from "@/components/side-nav";

export type PortalNavItem = SideNavItem;

export function PortalNav({
  title,
  nav,
  items,
  variant = "side",
}: {
  title: string;
  nav?: SideNavItem[];
  items?: SideNavItem[];
  variant?: "side" | "pills";
}) {
  const list = items ?? nav ?? [];
  if (variant === "pills") return <MobilePills title={title} items={list} />;
  return <SideNav title={title} items={list} />;
}
