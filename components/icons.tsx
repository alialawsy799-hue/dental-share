import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "clinic"
  | "services"
  | "store"
  | "user"
  | "bell"
  | "plus"
  | "search"
  | "calendar"
  | "box"
  | "receipt"
  | "users"
  | "warning"
  | "check"
  | "lab"
  | "scan"
  | "community"
  | "cart"
  | "arrow"
  | "chevron"
  | "sliders"
  | "wallet"
  | "truck"
  | "edit"
  | "globe"
  | "shield"
  | "lock"
  | "bolt"
  | "refresh"
  | "logout"
  | "chat"
  | "tooth"
  | "braces"
  | "panorama"
  | "building"
  | "card"
  | "star";

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<IconName, ReactNode> = {
    home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />,
    clinic: (
      <>
        <path d="M4 20h16" />
        <path d="M6 20V9.5L12 5l6 4.5V20" />
        <path d="M12 10v6M9.2 13H14.8" />
      </>
    ),
    services: (
      <>
        <path d="M12 3.5 4.5 7.5 12 11.5l7.5-4L12 3.5z" />
        <path d="M4.5 12 12 16l7.5-4" />
        <path d="M4.5 16.5 12 20.5l7.5-4" />
      </>
    ),
    store: (
      <>
        <circle cx="9" cy="19" r="1.3" />
        <circle cx="17" cy="19" r="1.3" />
        <path d="M3 5h2.2l1.8 9.2h9.6L19.5 8H7" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.5-3 3.8-4.5 7-4.5S17.5 16 19 19" />
      </>
    ),
    bell: (
      <>
        <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15z" />
        <path d="M10 18a2 2 0 0 0 4 0" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    box: (
      <>
        <path d="M3 8l9-4 9 4-9 4-9-4z" />
        <path d="M3 8v8l9 4 9-4V8" />
        <path d="M12 12v8" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M3.5 19c.8-2.5 2.8-4 5.5-4s4.7 1.5 5.5 4" />
        <path d="M14 15.2c1.4-.2 2.8.3 3.8 1.8" />
      </>
    ),
    warning: (
      <>
        <path d="M12 4 3 19h18L12 4z" />
        <path d="M12 10v4M12 16.5v.5" />
      </>
    ),
    check: <path d="m5 12 5 5 9-10" />,
    lab: (
      <>
        <path d="M9 3h6M10 3v6L5 19a3 3 0 0 0 2.6 4h8.8A3 3 0 0 0 19 19l-5-10V3" />
      </>
    ),
    scan: (
      <>
        <path d="M4 8V5h3M16 5h3v3M20 16v3h-3M8 19H5v-3" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    community: (
      <>
        <circle cx="7" cy="12" r="2" />
        <circle cx="17" cy="8" r="2" />
        <circle cx="17" cy="16" r="2" />
        <path d="M9 12h6M15.2 9.2 9.5 11M15.2 14.8 9.5 13" />
      </>
    ),
    cart: (
      <>
        <circle cx="9" cy="19" r="1.4" />
        <circle cx="17" cy="19" r="1.4" />
        <path d="M3 5h2l2.2 10h10.3L20 8H7" />
      </>
    ),
    arrow: <path d="M15 6 9 12l6 6" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    wallet: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="3" />
        <path d="M3 10h18M16 14.5h2" />
        <path d="M6 7V5.5A1.5 1.5 0 0 1 7.5 4h9" />
      </>
    ),
    truck: (
      <>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l10-10-4-4L4 16z" />
        <path d="m12.5 7.5 4 4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c3 3.5 3 12.5 0 16M12 4c-3 3.5-3 12.5 0 16" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z" />
        <path d="M12 9v6M9 12h6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2.5" />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      </>
    ),
    bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
    refresh: (
      <>
        <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8" />
        <path d="M20 4v4h-4M20 12a8 8 0 0 1-13.6 5.7L4 16" />
        <path d="M4 20v-4h4" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
        <path d="M14 8l4 4-4 4M18 12H9" />
      </>
    ),
    chat: (
      <>
        <path d="M5 5h14v10H9l-4 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    tooth: (
      <path d="M12 3.5c3 0 5.3 2 5.8 4.9.5 2.5-.5 4-.5 6.8 0 3 1.2 4.9-.8 7.2-1 1.2-2.1-.6-3-2.5-.6 1.9-1.6 3.7-3.2 2.5-2.6-2.1-1.1-4.5-1.1-7.2 0-2.8-1-4.3-.5-6.8C7.2 5.5 9 3.5 12 3.5z" />
    ),
    braces: (
      <>
        <path d="M6 4.5c2.5 0 3.5 1.5 3.6 3.5.1 1.6-.5 2.6-.5 4.4 0 2 .8 3.4-.5 5-.7.8-1.4-.4-2-1.6-.5 1.2-1.2 2.4-2.2 1.6-1.7-1.4-.7-3-.7-5 0-1.8-.6-2.8-.5-4.4C3.3 6 4.3 4.5 6 4.5zM18 4.5c1.7 0 2.7 1.5 2.8 3.5.1 1.6-.5 2.6-.5 4.4 0 2 .8 3.4-.5 5-.7.8-1.4-.4-2-1.6-.5 1.2-1.2 2.4-2.2 1.6-1.7-1.4-.7-3-.7-5 0-1.8-.6-2.8-.5-4.4C14.5 6 15.5 4.5 18 4.5z" />
        <path d="M3 11h18" />
      </>
    ),
    panorama: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M6 12c2-2.5 4-2.5 6 0s4 2.5 6 0" />
        <path d="M8 10.5v3M12 11.5v3M16 10.5v3" />
      </>
    ),
    building: (
      <>
        <path d="M4 20h16M6 20V9l6-4 6 4v11" />
        <path d="M10 20v-5h4v5M12 9v4M10 11h4" />
      </>
    ),
    card: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2.5" />
        <path d="M3 10h18M7 14.5h4" />
      </>
    ),
    star: <path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z" />,
    sliders: (
      <>
        <path d="M4 8h16M4 16h16" />
        <circle cx="9" cy="8" r="2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="16" r="2" fill="currentColor" stroke="none" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}
