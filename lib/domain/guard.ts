import { AccessError } from "./errors";
import type { Actor, Database, Permission } from "./types";
import { CENTRAL_LAB_ID } from "./types";

export function has(actor: Actor, permission: Permission): boolean {
  return actor.permissions.includes(permission);
}

export function requirePermission(actor: Actor, permission: Permission): void {
  if (!actor.clinicId || !has(actor, permission)) {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
}

export function requireSameClinic(actor: Actor, clinicId: string): void {
  if (!actor.clinicId || actor.clinicId !== clinicId) {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
}

export function requireLab(actor: Actor): void {
  if ((actor.role !== "lab_manager" && actor.role !== "lab_technician") || actor.labId !== CENTRAL_LAB_ID) {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
}

export function requireMerchant(actor: Actor): void {
  if (actor.role !== "merchant" || !actor.storeId) {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
}

export function requireProvider(actor: Actor): void {
  if (actor.role !== "provider" || !actor.providerId) {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
}

export function requireAdmin(actor: Actor): void {
  if (actor.role !== "platform_admin") {
    throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  }
}

const uidStore = globalThis as unknown as { __dsUid?: number };

export function uid(prefix: string): string {
  const next = Math.max(uidStore.__dsUid ?? 0, Date.now()) + 1;
  uidStore.__dsUid = next;
  return `${prefix}_${next.toString(36)}`;
}

export function dedupeById<T extends { id: string }>(items: T[], prefix: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) item.id = uid(prefix);
    seen.add(item.id);
  }
}

export function audit(db: Database, actor: Actor, action: string, entityType: string, entityId: string): void {
  db.auditLogs.push({
    id: uid("aud"),
    at: new Date().toISOString(),
    actorId: actor.id,
    action,
    entityType,
    entityId,
    clinicId: actor.clinicId,
  });
}

export function clinicName(db: Database, clinicId: string): string {
  return db.clinics.find((clinic) => clinic.id === clinicId)?.name ?? "عيادة";
}

export function userName(db: Database, userId: string): string {
  return db.users.find((user) => user.id === userId)?.name ?? "مستخدم";
}
