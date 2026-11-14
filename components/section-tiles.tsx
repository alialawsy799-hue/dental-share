import Link from "next/link";
import { type IconName } from "@/components/icons";
import { IconBadge } from "@/components/purple";

export function SectionTiles({
  items,
}: {
  items: { href: string; label: string; hint?: string; icon: IconName }[];
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="glass flex aspect-square flex-col items-center justify-center rounded-[22px] p-4 text-center shadow-card"
        >
          <IconBadge name={item.icon} size="lg" />
          <h2 className="mt-4 text-[16px] font-extrabold leading-5 text-plum">{item.label}</h2>
          {item.hint ? <p className="mt-1 text-[12px] leading-5 text-muted">{item.hint}</p> : null}
        </Link>
      ))}
    </div>
  );
}
