"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturn } from "@/lib/actions/types";
import { LANG_COOKIE } from "@/lib/i18n";

export async function setLangAction(formData: FormData) {
  const lang = formData.get("lang") === "ar" ? "ar" : "en";
  const jar = await cookies();
  jar.set(LANG_COOKIE, lang, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(safeReturn(formData.get("returnTo"), "/app/profile"));
}
