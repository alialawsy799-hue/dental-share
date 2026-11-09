"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeReturn, type ActionState } from "@/lib/actions/types";
import { AccessError } from "@/lib/domain/errors";
import { addLabNote, createLabOrder, requestRemake, transitionLab } from "@/lib/domain/lab";
import { createServiceOrder } from "@/lib/domain/services";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import type { Attachment, LabStatus } from "@/lib/domain/types";

function attachments(formData: FormData): Attachment[] {
  return formData.getAll("files").flatMap((entry) => {
    if (!(entry instanceof File) || entry.size <= 0) return [];
    return [{ name: entry.name, mime: entry.type || "application/octet-stream", size: entry.size }];
  });
}

function teeth(value: string): string[] {
  return value
    .split(/[،,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function createRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const kind = String(formData.get("kind") ?? "lab");
  const db = getDb();
  try {
    if (kind === "lab") {
      const result = createLabOrder(db, actor, {
        link: String(formData.get("link") ?? "case") as "case" | "patient" | "code",
        caseId: String(formData.get("caseId") ?? ""),
        patientId: String(formData.get("patientId") ?? ""),
        caseCode: String(formData.get("caseCode") ?? ""),
        workType: String(formData.get("workType") ?? ""),
        teeth: teeth(String(formData.get("teeth") ?? "")),
        shade: String(formData.get("shade") ?? ""),
        material: String(formData.get("material") ?? ""),
        dueAt: String(formData.get("dueAt") ?? ""),
        priority: String(formData.get("priority") ?? "normal") as "normal" | "urgent",
        note: String(formData.get("note") ?? ""),
        shareConsent: formData.get("shareConsent") === "on",
        attachments: attachments(formData),
      });
      if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
      revalidatePath("/app/services");
      redirect(`/app/services/orders/${result.data.id}?notice=lab_created`);
    }
    const result = createServiceOrder(db, actor, {
      kind: kind as "cbct" | "opg" | "ortho",
      link: String(formData.get("link") ?? "case") as "case" | "patient" | "code",
      caseId: String(formData.get("caseId") ?? ""),
      patientId: String(formData.get("patientId") ?? ""),
      caseCode: String(formData.get("caseCode") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      region: String(formData.get("region") ?? ""),
      instructions: String(formData.get("instructions") ?? ""),
      dueAt: String(formData.get("dueAt") ?? ""),
      priority: String(formData.get("priority") ?? "normal") as "normal" | "urgent",
      note: String(formData.get("note") ?? ""),
      shareConsent: formData.get("shareConsent") === "on",
      attachments: attachments(formData),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
    revalidatePath("/app/services");
    redirect(`/app/services/orders/${result.data.id}?notice=service_created`);
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
}

export async function transitionLabAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const back = safeReturn(formData.get("returnTo"), `/app/services/orders/${id}`);
  try {
    const result = transitionLab(
      getDb(),
      actor,
      id,
      String(formData.get("to") ?? "") as LabStatus,
      String(formData.get("reason") ?? ""),
    );
    if (!result.ok) redirect(`${back}?error=${encodeURIComponent(result.error)}`);
  } catch (error) {
    if (error instanceof AccessError) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath(back);
  revalidatePath("/lab");
  redirect(`${back}?notice=lab_updated`);
}

export async function labNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  try {
    const result = addLabNote(getDb(), actor, id, String(formData.get("note") ?? ""));
    if (!result.ok) return { error: result.error };
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/app/services/orders/${id}`);
  revalidatePath(`/lab/orders/${id}`);
  redirect(`${safeReturn(formData.get("returnTo"), `/app/services/orders/${id}`)}?notice=note_added`);
}

export async function remakeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = requestRemake(getDb(), actor, String(formData.get("id") ?? ""), String(formData.get("reason") ?? ""));
    if (!result.ok) return { error: result.error };
    revalidatePath("/app/services");
    redirect(`/app/services/orders/${result.data.id}?notice=remake_created`);
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
}
