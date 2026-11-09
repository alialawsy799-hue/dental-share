"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeReturn, type ActionState } from "@/lib/actions/types";
import { createAppointment, setAppointmentStatus } from "@/lib/domain/appointments";
import { createManualExpense } from "@/lib/domain/expenses";
import { AccessError } from "@/lib/domain/errors";
import { adjustStock, receiveCommerceOrder } from "@/lib/domain/inventory";
import { payLabInvoice } from "@/lib/domain/lab";
import { createPatient, registerDeskPatient } from "@/lib/domain/patients";
import { markNotificationsRead } from "@/lib/domain/home";
import { markCommerceOrderPaid } from "@/lib/domain/commerce";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import type { AppointmentStatus, Expense } from "@/lib/domain/types";

function fromAccess(error: unknown): ActionState | null {
  if (error instanceof AccessError) return { error: error.message };
  return null;
}

export async function createPatientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  let id = "";
  try {
    const result = createPatient(getDb(), actor, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      sex: String(formData.get("sex") ?? ""),
      birthYear: String(formData.get("birthYear") ?? ""),
      fileNumber: String(formData.get("fileNumber") ?? ""),
      medicalHistory: String(formData.get("medicalHistory") ?? ""),
      allergies: String(formData.get("allergies") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
    id = result.data.id;
  } catch (error) {
    const known = fromAccess(error);
    if (known) return known;
    throw error;
  }
  revalidatePath("/app/clinic/patients");
  revalidatePath("/desk/patients");
  const dest = safeReturn(formData.get("returnTo"), `/app/clinic/patients/${id}`).startsWith("/desk")
    ? `/desk/patients/${id}`
    : `/app/clinic/patients/${id}`;
  redirect(`${dest}?notice=patient_created`);
}

export async function registerDeskPatientAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = registerDeskPatient(getDb(), actor, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
  } catch (error) {
    const known = fromAccess(error);
    if (known) return known;
    throw error;
  }
  revalidatePath("/desk/patients");
  revalidatePath("/desk");
  revalidatePath("/desk/book");
  revalidatePath("/app/clinic/patients");
  redirect("/desk/patients?notice=patient_created");
}

export async function createAppointmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = createAppointment(getDb(), actor, {
      patientId: String(formData.get("patientId") ?? ""),
      doctorId: String(formData.get("doctorId") ?? ""),
      chairId: String(formData.get("chairId") ?? ""),
      visitType: String(formData.get("visitType") ?? ""),
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      durationMin: Number(formData.get("durationMin") ?? 30),
      adminNote: String(formData.get("adminNote") ?? ""),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
  } catch (error) {
    const known = fromAccess(error);
    if (known) return known;
    throw error;
  }
  revalidatePath("/app/clinic/appointments");
  revalidatePath("/app");
  revalidatePath("/app/clinic");
  revalidatePath("/desk");
  revalidatePath("/desk/book");
  revalidatePath("/desk/inventory");
  const date = String(formData.get("date") ?? "");
  const dest = safeReturn(formData.get("returnTo"), "/app/clinic/appointments").startsWith("/desk")
    ? `/desk/book?date=${date}&notice=appointment_created`
    : `/app/clinic/appointments?date=${date}&notice=appointment_created`;
  redirect(dest);
}

function withQuery(path: string, params: Record<string, string>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function setAppointmentStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as AppointmentStatus;
  const back = safeReturn(formData.get("returnTo"), "/app/clinic/appointments");
  const date = String(formData.get("date") ?? "");
  const dateParam = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  try {
    setAppointmentStatus(getDb(), actor, id, status);
  } catch (error) {
    if (error instanceof AccessError) redirect(withQuery(back, { date: dateParam, error: error.message }));
    throw error;
  }
  revalidatePath("/app/clinic/appointments");
  revalidatePath("/app");
  revalidatePath("/app/clinic");
  revalidatePath("/desk");
  revalidatePath("/desk/book");
  redirect(withQuery(back, { date: dateParam, notice: "appointment_updated" }));
}

export async function createExpenseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = createManualExpense(getDb(), actor, {
      description: String(formData.get("description") ?? ""),
      amountIqd: Number(formData.get("amountIqd") ?? 0),
      bucket: String(formData.get("bucket") ?? "paid") as Expense["bucket"],
      category: String(formData.get("category") ?? "operating") as "operating" | "other",
      occurredOn: String(formData.get("occurredOn") ?? "2026-11-05"),
      fundFrom: String(formData.get("fundFrom") ?? "") === "external" ? "external" : String(formData.get("fundFrom") ?? "") === "income" ? "income" : undefined,
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
  } catch (error) {
    const known = fromAccess(error);
    if (known) return known;
    throw error;
  }
  revalidatePath("/app/clinic/expenses");
  revalidatePath("/desk/expenses");
  const dest = safeReturn(formData.get("returnTo"), "/app/clinic/expenses");
  redirect(`${dest}?notice=expense_created`);
}

export async function adjustStockAction(formData: FormData) {
  const actor = await requireActor();
  const back = safeReturn(formData.get("returnTo"), "/app/clinic/inventory");
  const result = adjustStock(getDb(), actor, {
    itemId: String(formData.get("itemId") ?? ""),
    type: String(formData.get("type") ?? "in") as "in" | "out" | "consume",
    quantity: Number(formData.get("quantity") ?? 0),
    reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath("/app/clinic/inventory");
  revalidatePath("/desk/inventory");
  if (!result.ok) redirect(`${back}?error=${encodeURIComponent(result.error)}`);
  redirect(`${back}?notice=stock_updated`);
}

export async function receiveOrderAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const result = receiveCommerceOrder(getDb(), actor, id);
  const back = safeReturn(formData.get("returnTo"), `/app/orders/${id}`);
  revalidatePath("/app/clinic/purchases");
  revalidatePath("/app/clinic/inventory");
  if (!result.ok) redirect(`${back}?error=${encodeURIComponent(result.error)}`);
  redirect(`${back}?notice=received`);
}

export async function payOrderAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  try {
    const result = markCommerceOrderPaid(getDb(), actor, id);
    const back = safeReturn(formData.get("returnTo"), `/app/orders/${id}`);
    if (!result.ok) redirect(`${back}?error=${encodeURIComponent(result.error)}`);
  } catch (error) {
    if (error instanceof AccessError) redirect(`/app/clinic/purchases?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath("/app/clinic/expenses");
  redirect(`${safeReturn(formData.get("returnTo"), `/app/orders/${id}`)}?notice=paid`);
}

export async function payInvoiceAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  try {
    const result = payLabInvoice(getDb(), actor, id);
    if (!result.ok) redirect(`/app/clinic/expenses?error=${encodeURIComponent(result.error)}`);
  } catch (error) {
    if (error instanceof AccessError) redirect(`/app/clinic/expenses?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath("/app/clinic/expenses");
  redirect("/app/clinic/expenses?notice=paid");
}

export async function readNotificationsAction() {
  const actor = await requireActor();
  markNotificationsRead(getDb(), actor);
  revalidatePath("/app/notifications");
  redirect("/app/notifications");
}

export async function savePrefsAction(formData: FormData) {
  const actor = await requireActor();
  const user = getDb().users.find((item) => item.id === actor.id);
  if (!user) redirect("/enter");
  user.notificationPrefs = {
    appointments: formData.get("appointments") === "on",
    orders: formData.get("orders") === "on",
    community: formData.get("community") === "on",
  };
  revalidatePath("/app/profile");
  redirect("/app/profile?notice=prefs_saved");
}
