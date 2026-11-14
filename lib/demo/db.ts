import { cookies } from "next/headers";
import { migrateClinicDeskAccounts } from "@/lib/domain/admin";
import { dedupeById } from "@/lib/domain/guard";
import { ensureAllClinicSupplies } from "@/lib/domain/inventory";
import { createDatabase } from "@/lib/domain/seed";
import { IDS, type Chair, type Clinic, type Database, type Subscription, type User } from "@/lib/domain/types";

const SEED_VERSION = 5;
const EXTRA_COOKIE = "ds_extra";

type Store = { version: number; db: Database };
type ExtraBundle = {
  clinics: Clinic[];
  users: User[];
  chairs: Chair[];
  subscriptions: Subscription[];
};

const globalStore = globalThis as unknown as { __dentalShare?: Store };

const SEED_USER_IDS = new Set<string>([
  IDS.ahmed,
  IDS.layla,
  IDS.reception,
  IDS.accountant,
  IDS.deskNoor,
  IDS.sara,
  IDS.labManager,
  IDS.labTech,
  IDS.merchantA,
  IDS.merchantB,
  IDS.providerRadio,
  IDS.providerOrtho,
  IDS.admin,
]);
const SEED_CLINIC_IDS = new Set<string>([IDS.clinicA, IDS.clinicB]);
const SEED_CHAIR_IDS = new Set(["chair_a1", "chair_a2", "chair_b1"]);

function mergeById<T extends { id: string }>(target: T[], incoming: T[]) {
  for (const item of incoming) {
    if (!target.some((row) => row.id === item.id)) target.push(item);
  }
}

function captureExtras(db: Database): ExtraBundle {
  return {
    clinics: db.clinics.filter((item) => !SEED_CLINIC_IDS.has(item.id)),
    users: db.users.filter((item) => !SEED_USER_IDS.has(item.id)),
    chairs: db.chairs.filter((item) => !SEED_CHAIR_IDS.has(item.id)),
    subscriptions: db.subscriptions.filter((item) => !SEED_CLINIC_IDS.has(item.clinicId)),
  };
}

function applyExtras(db: Database, extra: ExtraBundle) {
  mergeById(db.clinics, extra.clinics);
  mergeById(db.users, extra.users);
  mergeById(db.chairs, extra.chairs);
  for (const item of extra.subscriptions) {
    if (!db.subscriptions.some((row) => row.clinicId === item.clinicId)) db.subscriptions.push(item);
  }
}

export function getDb(): Database {
  if (!globalStore.__dentalShare || globalStore.__dentalShare.version !== SEED_VERSION) {
    globalStore.__dentalShare = { version: SEED_VERSION, db: createDatabase() };
  }
  migrateClinicDeskAccounts(globalStore.__dentalShare.db);
  ensureAllClinicSupplies(globalStore.__dentalShare.db);
  const db = globalStore.__dentalShare.db;
  dedupeById(db.appointments, "appt");
  dedupeById(db.patients, "pat");
  dedupeById(db.expenses, "exp");
  dedupeById(db.inventory, "stk");
  dedupeById(db.movements, "mov");
  dedupeById(db.users, "user");
  dedupeById(db.clinics, "clinic");
  dedupeById(db.chairs, "chair");
  return db;
}

export async function restoreDemoExtras() {
  try {
    const raw = (await cookies()).get(EXTRA_COOKIE)?.value;
    if (!raw) return;
    const extra = JSON.parse(raw) as ExtraBundle;
    if (!extra || !Array.isArray(extra.users) || !Array.isArray(extra.clinics)) return;
    applyExtras(getDb(), extra);
  } catch {
    return;
  }
}

export async function persistDemoExtras() {
  const extra = captureExtras(getDb());
  const jar = await cookies();
  if (!extra.clinics.length && !extra.users.length) {
    jar.delete(EXTRA_COOKIE);
    return;
  }
  jar.set(EXTRA_COOKIE, JSON.stringify(extra), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
