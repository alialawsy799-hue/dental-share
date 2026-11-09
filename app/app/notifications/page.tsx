import Link from "next/link";
import { readNotificationsAction } from "@/lib/actions/clinic";
import { PageIntro } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { formatDateTime } from "@/lib/domain/format";
import { listNotifications } from "@/lib/domain/home";

export default async function NotificationsPage() {
  const actor = await requireActor();
  const items = listNotifications(getDb(), actor);
  return (
    <div>
      <PageIntro title="الإشعارات" action={<form action={readNotificationsAction}><button className="h-11 rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-line" type="submit">تعليم الكل كمقروء</button></form>} />
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="block rounded-card border border-line bg-white p-4 shadow-card">
              <p className="font-extrabold">{item.title}</p>
              <p className="text-sm leading-7 text-muted">{item.body}</p>
              <p className="mt-1 text-xs text-muted">{formatDateTime(item.createdAt)} {item.read ? "· مقروء" : "· جديد"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
