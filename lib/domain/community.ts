import { AccessError, fail, ok, type Result } from "./errors";
import { audit, requireAdmin, uid } from "./guard";
import { identifierProblem } from "./identifiers";
import type { Actor, CommunityPost, Database } from "./types";

export interface FeedPost {
  id: string;
  authorName: string;
  authorTitle: string;
  verified: boolean;
  body: string;
  tags: string[];
  specialty: string;
  createdAt: string;
  saved: boolean;
  reportCount: number;
  status: CommunityPost["status"];
  imageLabel?: string;
  mine: boolean;
}

function assertMember(actor: Actor) {
  if (!actor.permissions.includes("community.post") || !actor.verified) {
    throw new AccessError("FORBIDDEN", "المجتمع متاح للأطباء بعد التحقق المهني.");
  }
}

function present(db: Database, actor: Actor, post: CommunityPost): FeedPost {
  const author = db.users.find((user) => user.id === post.authorId);
  return {
    id: post.id,
    authorName: author?.name ?? "طبيب",
    authorTitle: author?.title ?? "طبيب",
    verified: Boolean(author?.verified),
    body: post.body,
    tags: post.tags,
    specialty: post.specialty,
    createdAt: post.createdAt,
    saved: post.savedBy.includes(actor.id),
    reportCount: post.reports.length,
    status: post.status,
    imageLabel: post.imageLabel,
    mine: post.authorId === actor.id,
  };
}

export function listFeed(db: Database, actor: Actor): FeedPost[] {
  assertMember(actor);
  return db.posts
    .filter((post) => post.status === "published" || (post.status === "pending_review" && post.authorId === actor.id))
    .filter((post) => post.status !== "removed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => present(db, actor, post));
}

export function createPost(
  db: Database,
  actor: Actor,
  input: { body: string; specialty: string; tags: string[]; imageLabel?: string },
): Result<FeedPost> {
  assertMember(actor);
  const body = input.body.trim();
  if (body.length < 20) return fail("المنشور قصير. اكتب سؤالاً مهنياً أوضح.", { body: "النص قصير." });
  if (body.length > 2000) return fail("المنشور طويل جداً.", { body: "اختصر النص." });
  const problem = identifierProblem(db, `${body} ${input.imageLabel ?? ""}`);
  if (problem) return fail(problem, { body: problem });
  const post: CommunityPost = {
    id: uid("post"),
    authorId: actor.id,
    body,
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
    specialty: input.specialty.trim() || "عام",
    createdAt: new Date().toISOString(),
    savedBy: [],
    reports: [],
    status: "pending_review",
    imageLabel: input.imageLabel?.trim() || undefined,
  };
  db.posts.push(post);
  audit(db, actor, "community.submit", "community_post", post.id);
  return ok(present(db, actor, post));
}

export function reportPost(db: Database, actor: Actor, postId: string, reason: string): Result<{ id: string }> {
  assertMember(actor);
  const post = db.posts.find((item) => item.id === postId && item.status !== "removed");
  if (!post) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (reason.trim().length < 3) return fail("اكتب سبب التبليغ.");
  post.reports.push({ by: actor.id, reason: reason.trim(), at: new Date().toISOString() });
  audit(db, actor, "community.report", "community_post", post.id);
  return ok({ id: post.id });
}

export function toggleSave(db: Database, actor: Actor, postId: string): Result<{ saved: boolean }> {
  assertMember(actor);
  const post = db.posts.find((item) => item.id === postId && item.status === "published");
  if (!post) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (post.savedBy.includes(actor.id)) post.savedBy = post.savedBy.filter((id) => id !== actor.id);
  else post.savedBy.push(actor.id);
  return ok({ saved: post.savedBy.includes(actor.id) });
}

export function listModeration(db: Database, actor: Actor) {
  requireAdmin(actor);
  return db.posts
    .filter((post) => post.status === "pending_review" || post.reports.length > 0)
    .map((post) => ({
      id: post.id,
      body: post.body,
      status: post.status,
      reports: post.reports.map((report) => report.reason),
      authorName: db.users.find((user) => user.id === post.authorId)?.name ?? "طبيب",
    }));
}

export function resolvePost(db: Database, actor: Actor, postId: string, decision: "publish" | "remove" | "dismiss"): Result<{ id: string }> {
  requireAdmin(actor);
  const post = db.posts.find((item) => item.id === postId);
  if (!post) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (decision === "remove") post.status = "removed";
  if (decision === "publish") {
    const problem = identifierProblem(db, post.body);
    if (problem) return fail("لا يمكن نشر منشور ما زال يحتوي بيانات تعريفية.");
    post.status = "published";
  }
  if (decision === "dismiss") post.reports = [];
  audit(db, actor, `community.${decision}`, "community_post", post.id);
  return ok({ id: post.id });
}
