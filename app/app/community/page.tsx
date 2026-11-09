import { reportPostAction, savePostAction } from "@/lib/actions/community";
import { Composer } from "@/components/forms/composer";
import { Card, PageIntro, Pill } from "@/components/kit";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { listFeed } from "@/lib/domain/community";
import { formatDateTime } from "@/lib/domain/format";
import { accessResponse } from "@/lib/ui/access";

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const actor = await requireActor();
  const { error } = await searchParams;
  try {
    const posts = listFeed(getDb(), actor);
    return (
      <div>
        <PageIntro title="مجتمع الأطباء" description="محتوى مهني للأطباء الموثقين. المنشورات الجديدة تذهب للإشراف ولا تُنشر علناً. الهوية المعروضة هنا اسم الطبيب وتخصصه، وإظهار اسم العيادة قرار لم يُحسم." />
        {error ? <p role="alert" className="mb-4 text-sm text-danger">{error}</p> : null}
        <Card>
          <Composer />
        </Card>
        <div className="mt-4 grid gap-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">{post.authorName}</p>
                  <p className="text-sm text-muted">{post.authorTitle} · {post.specialty}</p>
                </div>
                <Pill tone={post.status === "pending_review" ? "warn" : "teal"}>{post.status === "pending_review" ? "بانتظار المراجعة" : "منشور تجريبي مراجع"}</Pill>
              </div>
              <p className="mt-3 text-sm leading-7">{post.body}</p>
              {post.imageLabel ? <p className="mt-2 text-xs text-muted">مرفق محايد: {post.imageLabel}</p> : null}
              <p className="mt-2 text-xs text-muted">{formatDateTime(post.createdAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-mist px-2 py-1 text-xs font-bold">{tag}</span>
                ))}
              </div>
              {post.status === "published" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={savePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button className="h-10 rounded-xl bg-mist px-3 text-sm font-bold" type="submit">{post.saved ? "محفوظ" : "حفظ"}</button>
                  </form>
                  <form action={reportPostAction} className="flex gap-2">
                    <input type="hidden" name="id" value={post.id} />
                    <input name="reason" required placeholder="سبب التبليغ" aria-label="سبب التبليغ" className="h-10 rounded-xl border border-line px-3 text-sm" />
                    <button className="h-10 rounded-xl bg-white px-3 text-sm font-bold ring-1 ring-line" type="submit">تبليغ</button>
                  </form>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return accessResponse(error);
  }
}
