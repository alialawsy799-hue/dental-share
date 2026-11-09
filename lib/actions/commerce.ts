"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeReturn, type ActionState } from "@/lib/actions/types";
import { addToCart, checkout, setProductPublished, saveProduct, transitionCommerce, updateCartQty } from "@/lib/domain/commerce";
import { AccessError } from "@/lib/domain/errors";
import { assignTechnician, issueLabInvoice } from "@/lib/domain/lab";
import { getDb } from "@/lib/demo/db";
import { requireActor } from "@/lib/demo/session";
import type { CommerceStatus } from "@/lib/domain/types";

export async function addToCartAction(formData: FormData) {
  const actor = await requireActor();
  const slug = String(formData.get("slug") ?? "");
  const fallback = slug ? `/app/stores/${slug}` : "/app/stores";
  const back = safeReturn(formData.get("returnTo"), fallback);
  const result = addToCart(getDb(), actor, String(formData.get("productId") ?? ""), Number(formData.get("qty") ?? 1));
  revalidatePath("/app/cart");
  revalidatePath("/app/stores");
  if (slug) revalidatePath(`/app/stores/${slug}`);
  const sep = back.includes("?") ? "&" : "?";
  if (!result.ok) redirect(`${back}${sep}error=${encodeURIComponent(result.error)}`);
  redirect(`${back}${sep}notice=cart_updated`);
}

export async function updateCartAction(formData: FormData) {
  const actor = await requireActor();
  const result = updateCartQty(getDb(), actor, String(formData.get("productId") ?? ""), Number(formData.get("qty") ?? 0));
  revalidatePath("/app/cart");
  if (!result.ok) redirect(`/app/cart?error=${encodeURIComponent(result.error)}`);
  redirect("/app/cart?notice=cart_updated");
}

export async function checkoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = checkout(getDb(), actor, {
      address: String(formData.get("address") ?? ""),
      paymentMethod: String(formData.get("paymentMethod") ?? "cod") as "cod" | "manual_transfer",
      caseId: String(formData.get("caseId") ?? "") || undefined,
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
    revalidatePath("/app/cart");
    revalidatePath("/app/clinic/purchases");
    redirect(`/app/orders/${result.data[0].id}?notice=order_placed`);
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
}

export async function commerceStatusAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  try {
    const result = transitionCommerce(getDb(), actor, id, String(formData.get("to") ?? "") as CommerceStatus);
    if (!result.ok) redirect(`/merchant/orders/${id}?error=${encodeURIComponent(result.error)}`);
  } catch (error) {
    if (error instanceof AccessError) redirect(`/merchant?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath("/merchant");
  redirect(`/merchant/orders/${id}?notice=commerce_updated`);
}

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireActor();
  try {
    const result = saveProduct(getDb(), actor, {
      id: String(formData.get("id") ?? "") || undefined,
      name: String(formData.get("name") ?? ""),
      brand: String(formData.get("brand") ?? ""),
      category: String(formData.get("category") ?? ""),
      priceIqd: Number(formData.get("priceIqd") ?? 0),
      stock: Number(formData.get("stock") ?? 0),
      unit: String(formData.get("unit") ?? "وحدة"),
      sku: String(formData.get("sku") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
    if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };
  } catch (error) {
    if (error instanceof AccessError) return { error: error.message };
    throw error;
  }
  revalidatePath("/merchant/products");
  redirect("/merchant/products?notice=product_saved");
}

export async function publishProductAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  try {
    setProductPublished(getDb(), actor, id, formData.get("published") === "true");
  } catch (error) {
    if (error instanceof AccessError) redirect(`/merchant/products?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
  revalidatePath("/merchant/products");
  redirect("/merchant/products?notice=product_saved");
}

export async function assignTechAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const result = assignTechnician(getDb(), actor, id, String(formData.get("technicianId") ?? ""));
  if (!result.ok) redirect(`/lab/orders/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/lab");
  redirect(`/lab/orders/${id}?notice=lab_updated`);
}

export async function invoiceAction(formData: FormData) {
  const actor = await requireActor();
  const id = String(formData.get("id") ?? "");
  const result = issueLabInvoice(getDb(), actor, id, Number(formData.get("amountIqd") ?? 0));
  if (!result.ok) redirect(`/lab/orders/${id}?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/lab/billing");
  redirect(`/lab/orders/${id}?notice=lab_updated`);
}
