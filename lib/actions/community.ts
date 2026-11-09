"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions/types";
import { decideApproval, closeTicket } from "@/lib/domain/admin";
import { createPost, reportPost, resolvePost, toggleSave } from "@/lib/domain/community";
import { AccessError } from "@/lib/domain/errors";
import { transitionService, uploadServiceResult } from "@/lib/domain/services";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import type { ServiceStatus } from "@/lib/domain/types";

export async function createPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const file = formData.get("image");
  const imageLabel = file instanceof File && file.size > 0 ? file.name : "";
  try {
    const result = createPost(getDb(), actor, {
      body: String(formData.get("body") ?? ""),
      specialty: String(formData.get("specialty") ?? ""),
      tags: String(formData.get("tags") ?? "")
        .split(/[،,]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageLabel,
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
  revalidatePath("/app/community");
  revalidatePath("/admin/moderation");
  redirect("/app/community?notice=post_queued");
}

export async function reportPostAction(formData: FormData) {
  const actor = await requireActor();
  const result = reportPost(getDb(), actor, String(formData.get("id") ?? ""), String(formData.get("reason") ?? ""));
  revalidatePath("/app/community");
  if (!result.ok) redirect(`/app/community?error=${encodeURIComponent(result.error)}`);
  redirect("/app/community?notice=reported");
}

export async function savePostAction(formData: FormData) {
  const actor = await requireActor();
  toggleSave(getDb(), actor, String(formData.get("id") ?? ""));
  revalidatePath("/app/community");
  redirect("/app/community?notice=saved");
}

export async function resolvePostAction(formData: FormData) {
  const actor = await requireActor();
  const result = resolvePost(
    getDb(),
    actor,
    String(formData.get("id") ?? ""),
    String(formData.get("decision") ?? "dismiss") as "publish" | "remove" | "dismiss",
  );
  revalidatePath("/admin/moderation");
  if (!result.ok) redirect(`/admin/moderation?error=${encodeURIComponent(result.error)}`);
  redirect("/admin/moderation?notice=approved");
}

export async function approvalAction(formData: FormData) {
  const actor = await requireActor();
  decideApproval(
    getDb(),
    actor,
    String(formData.get("kind") ?? "clinic") as "clinic" | "store" | "doctor",
    String(formData.get("id") ?? ""),
    String(formData.get("decision") ?? "approved") as "approved" | "rejected",
  );
  revalidatePath("/admin/approvals");
  redirect("/admin/approvals?notice=approved");
}

export async function closeTicketAction(formData: FormData) {
  const actor = await requireActor();
  closeTicket(getDb(), actor, String(formData.get("id") ?? ""));
  revalidatePath("/admin/support");
  redirect("/admin/support?notice=approved");
}

export async function providerStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const result = transitionService(getDb(), actor, id, String(formData.get("to") ?? "") as ServiceStatus);
  if (!result.ok) redirect(`/provider/orders/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/provider");
  redirect(`/provider/orders/${id}?notice=lab_updated`);
}

export async function uploadResultAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const file = formData.get("file");
  try {
    const result = uploadServiceResult(getDb(), actor, id, {
      summary: String(formData.get("summary") ?? ""),
      fileName: file instanceof File && file.size > 0 ? file.name : undefined,
    });
    if (!result.ok) return { error: result.error };
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/provider/orders/${id}`);
  redirect(`/provider/orders/${id}?notice=result_uploaded`);
}
