"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions/types";
import { getDb, persistDemoExtras } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import { createClinicWithAccess, provisionClinicAccess, setClinicStatus } from "@/lib/domain/admin";
import { AccessError } from "@/lib/domain/errors";
import type { Clinic } from "@/lib/domain/types";

function fromAccess(error: unknown): ActionState | null {
  if (error instanceof AccessError) return { error: error.message };
  return null;
}

function formText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export async function createClinicAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  let id = "";
  try {
    const result = createClinicWithAccess(getDb(), actor, {
      name: formText(formData, "name"),
      city: formText(formData, "city"),
      district: formText(formData, "district"),
      phone: formText(formData, "phone"),
      address: formText(formData, "address"),
      branchName: formText(formData, "branchName") || "الفرع الرئيسي",
      specialty: formText(formData, "specialty") || "طب أسنان عام",
      doctorName: formText(formData, "doctorName"),
      doctorEmail: formText(formData, "doctorEmail"),
      systemEmail: formText(formData, "systemEmail"),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
    id = result.data.id;
    await persistDemoExtras();
  } catch (error) {
    const known = fromAccess(error);
    if (known) return known;
    throw error;
  }
  revalidatePath("/admin/clinics");
  redirect(`/admin/clinics/${id}?tab=team&notice=clinic_created`);
}

export async function provisionClinicAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const clinicId = formText(formData, "clinicId");
  try {
    const result = provisionClinicAccess(getDb(), actor, {
      clinicId,
      doctorName: formText(formData, "doctorName"),
      doctorEmail: formText(formData, "doctorEmail"),
      systemEmail: formText(formData, "systemEmail"),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
    await persistDemoExtras();
  } catch (error) {
    const known = fromAccess(error);
    if (known) return known;
    throw error;
  }
  revalidatePath("/admin/clinics");
  revalidatePath(`/admin/clinics/${clinicId}`);
  redirect(`/admin/clinics/${clinicId}?tab=team&notice=clinic_provisioned`);
}

export async function setClinicStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = formText(formData, "id");
  const status = formText(formData, "status") as Clinic["status"];
  try {
    const result = setClinicStatus(getDb(), actor, id, status);
    if (!result.ok) redirect(`/admin/clinics/${id}?error=${encodeURIComponent(result.error)}`);
  } catch (error) {
    if (error instanceof AccessError) redirect(`/admin/clinics?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath("/admin/clinics");
  redirect(`/admin/clinics/${id}?tab=info&notice=clinic_updated`);
}
