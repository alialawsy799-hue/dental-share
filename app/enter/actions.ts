"use server";

import { redirect } from "next/navigation";
import { getDb } from "@/lib/demo/db";
import { clearActorCookie, demoMode, setActorCookie } from "@/lib/demo/session";
import { type ActionState } from "@/lib/actions/types";
import { homeForRole, type Role } from "@/lib/domain/types";

function safeNext(next: string, role: Role): string {
  const home = homeForRole(role);
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return home;
  if (next === home || next.startsWith(`${home}/`)) return next;
  return home;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!demoMode()) redirect("/");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = getDb().users.find((item) => item.email.toLowerCase() === email && item.password === password);
  if (!user) return { error: "البريد أو كلمة المرور غير صحيحة." };
  await setActorCookie(user.id);
  redirect(safeNext(String(formData.get("next") ?? ""), user.role));
}

export async function logoutAction() {
  await clearActorCookie();
  redirect("/enter");
}
