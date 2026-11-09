import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/demo/db";
import { homeForRole, toActor, type Actor, type Role } from "@/lib/domain/types";

const COOKIE = "ds_actor";

export function demoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}

export async function getActor(): Promise<Actor | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  const user = getDb().users.find((item) => item.id === id);
  if (!user) return null;
  return toActor(user);
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/enter");
  return actor;
}

export async function requireRoles(roles: Role[]): Promise<Actor> {
  const actor = await requireActor();
  if (!roles.includes(actor.role)) redirect(homeForRole(actor.role));
  return actor;
}

export async function setActorCookie(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearActorCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
