import { fail, ok, type Result } from "./errors";
import { audit, requirePermission, uid } from "./guard";
import { STARTER_SUPPLIES, suppliesForService } from "./supplies";
import { DEMO_TODAY } from "./types";
import type { Actor, Database, InventoryItem, StockMovement } from "./types";

export interface InventoryWarning {
  itemId: string;
  name: string;
  kind: "low" | "expiry";
  detail: string;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ensureAllClinicSupplies(db: Database) {
  for (const clinic of db.clinics) ensureClinicSupplies(db, clinic.id);
}

export function ensureClinicSupplies(db: Database, clinicId: string) {
  for (const supply of STARTER_SUPPLIES) {
    if (db.inventory.some((item) => item.clinicId === clinicId && item.sku === supply.sku)) continue;
    db.inventory.push({
      id: uid("stk"),
      clinicId,
      name: supply.name,
      unit: supply.unit,
      quantity: supply.quantity,
      minQty: supply.minQty,
      sku: supply.sku,
    });
  }
}

export function consumeForVisit(db: Database, clinicId: string, visitType: string, appointmentId: string) {
  for (const line of suppliesForService(visitType)) {
    const item = db.inventory.find((row) => row.clinicId === clinicId && row.sku === line.sku);
    if (!item || item.quantity < line.qty) continue;
    item.quantity -= line.qty;
    db.movements.push({
      id: uid("mov"),
      clinicId,
      itemId: item.id,
      type: "consume",
      quantity: line.qty,
      reason: `استهلاك لحجز ${visitType}`,
      sourceType: "appointment",
      sourceId: appointmentId,
      at: new Date().toISOString(),
    });
  }
}

export function listInventory(db: Database, actor: Actor): InventoryItem[] {
  requirePermission(actor, "inventory.read");
  if (actor.clinicId) ensureClinicSupplies(db, actor.clinicId);
  return db.inventory.filter((item) => item.clinicId === actor.clinicId);
}

export function listMovements(db: Database, actor: Actor): StockMovement[] {
  requirePermission(actor, "inventory.read");
  return db.movements
    .filter((movement) => movement.clinicId === actor.clinicId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function inventoryWarnings(db: Database, actor: Actor): InventoryWarning[] {
  const items = listInventory(db, actor);
  const horizon = addDays(DEMO_TODAY, 90);
  const warnings: InventoryWarning[] = [];
  for (const item of items) {
    if (item.quantity <= item.minQty) {
      warnings.push({
        itemId: item.id,
        name: item.name,
        kind: "low",
        detail: `الكمية ${item.quantity} ${item.unit} والحد الأدنى ${item.minQty}.`,
      });
    }
    if (item.expiry && item.expiry <= horizon) {
      warnings.push({
        itemId: item.id,
        name: item.name,
        kind: "expiry",
        detail: `الصلاحية ${item.expiry}.`,
      });
    }
  }
  return warnings;
}

export function adjustStock(
  db: Database,
  actor: Actor,
  input: { itemId: string; type: "in" | "out" | "consume"; quantity: number; reason: string },
): Result<StockMovement> {
  requirePermission(actor, "inventory.write");
  const item = db.inventory.find((row) => row.id === input.itemId && row.clinicId === actor.clinicId);
  if (!item) return fail("الصنف غير متاح ضمن مخزن عيادتك.");
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) return fail("الكمية غير صالحة.");
  if (input.reason.trim().length < 3) return fail("اكتب سبب الحركة.");
  if ((input.type === "out" || input.type === "consume") && item.quantity < input.quantity) {
    return fail("الكمية الخارجة أكبر من الموجود.");
  }
  item.quantity += input.type === "in" ? input.quantity : -input.quantity;
  const movement: StockMovement = {
    id: uid("mov"),
    clinicId: actor.clinicId!,
    itemId: item.id,
    type: input.type,
    quantity: input.quantity,
    reason: input.reason.trim(),
    sourceType: "manual",
    at: new Date().toISOString(),
  };
  db.movements.push(movement);
  audit(db, actor, "inventory.adjust", "inventory", item.id);
  return ok(movement);
}

export function receiveCommerceOrder(db: Database, actor: Actor, orderId: string): Result<{ orderId: string }> {
  requirePermission(actor, "purchases.receive");
  requirePermission(actor, "inventory.write");
  const order = db.commerceOrders.find((item) => item.id === orderId);
  if (!order || order.clinicId !== actor.clinicId) return fail("الطلب غير متاح ضمن مشتريات عيادتك.");
  if (order.status !== "delivered") return fail("يمكن تأكيد الاستلام بعد أن يسلّم المتجر الطلب.");
  if (order.inventoryReceived) return ok({ orderId: order.id });

  for (const line of order.lines) {
    let item = db.inventory.find(
      (row) => row.clinicId === actor.clinicId && row.sku === `${order.storeId}:${line.productId}`,
    );
    if (!item) {
      item = {
        id: uid("stk"),
        clinicId: actor.clinicId!,
        name: line.name,
        unit: "وحدة",
        quantity: 0,
        minQty: 1,
        sku: `${order.storeId}:${line.productId}`,
      };
      db.inventory.push(item);
    }
    item.quantity += line.qty;
    db.movements.push({
      id: uid("mov"),
      clinicId: actor.clinicId!,
      itemId: item.id,
      type: "in",
      quantity: line.qty,
      reason: `استلام طلب ${order.id}`,
      sourceType: "commerce_order",
      sourceId: order.id,
      at: new Date().toISOString(),
    });
  }
  order.inventoryReceived = true;
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: "أكدت العيادة الاستلام وأُضيف المخزون مرة واحدة.",
    actorName: actor.name,
    kind: "system",
  });
  audit(db, actor, "purchase.receive", "commerce_order", order.id);
  return ok({ orderId: order.id });
}
