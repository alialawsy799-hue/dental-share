import { migrateClinicDeskAccounts } from "@/lib/domain/admin";
import { dedupeById } from "@/lib/domain/guard";
import { ensureAllClinicSupplies } from "@/lib/domain/inventory";
import { createDatabase } from "@/lib/domain/seed";
import type { Database } from "@/lib/domain/types";

const SEED_VERSION = 3;

type Store = { version: number; db: Database };

const globalStore = globalThis as unknown as { __dentalShare?: Store };

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
