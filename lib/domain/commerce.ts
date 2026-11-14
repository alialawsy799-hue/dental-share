import { AccessError, fail, ok, type Result } from "./errors";
import { upsertSourceExpense } from "./expenses";
import { audit, clinicName, requireMerchant, requirePermission, requireSameClinic, uid } from "./guard";
import { commerceStatusLabel } from "./labels";
import type { Actor, CommerceOrder, CommerceStatus, Database, Product } from "./types";

export interface MerchantOrderView {
  id: string;
  storeId: string;
  clinicName: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  lines: CommerceOrder["lines"];
  status: CommerceStatus;
  paymentMethod: CommerceOrder["paymentMethod"];
  paymentStatus: CommerceOrder["paymentStatus"];
  totalIqd: number;
  timeline: CommerceOrder["timeline"];
  createdAt: string;
}

export interface ClinicOrderView extends MerchantOrderView {
  caseId?: string;
  inventoryReceived: boolean;
  placedByName: string;
}

const FORWARD: Record<CommerceStatus, CommerceStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["shipped"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

function toMerchant(db: Database, order: CommerceOrder): MerchantOrderView {
  return {
    id: order.id,
    storeId: order.storeId,
    clinicName: clinicName(db, order.clinicId),
    deliveryAddress: order.deliveryAddress,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    lines: order.lines,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalIqd: order.totalIqd,
    timeline: order.timeline,
    createdAt: order.createdAt,
  };
}

function toClinic(db: Database, order: CommerceOrder): ClinicOrderView {
  const placer = db.users.find((user) => user.id === order.placedBy);
  return {
    ...toMerchant(db, order),
    caseId: order.caseId,
    inventoryReceived: order.inventoryReceived,
    placedByName: placer?.name ?? order.contactName,
  };
}

export function listCatalog(db: Database, actor: Actor) {
  requirePermission(actor, "commerce.buy");
  const active = new Set(db.stores.filter((store) => store.status === "active").map((store) => store.id));
  return db.products.filter((product) => product.published && active.has(product.storeId));
}

export function listDepartmentProducts(db: Database, actor: Actor, categories: readonly string[]) {
  const allowed = new Set(categories);
  return listCatalog(db, actor).filter((product) => allowed.has(product.category));
}

export function listStores(db: Database, actor: Actor, query = "", category = "") {
  requirePermission(actor, "commerce.buy");
  const needle = query.trim();
  return db.stores.filter((store) => {
    if (store.status !== "active") return false;
    if (category && !store.categories.includes(category)) return false;
    if (!needle) return true;
    return store.name.includes(needle) || store.city.includes(needle) || store.categories.some((item) => item.includes(needle));
  });
}

export function getStore(db: Database, actor: Actor, slug: string) {
  requirePermission(actor, "commerce.buy");
  const store = db.stores.find((item) => item.slug === slug && item.status === "active");
  if (!store) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  const products = db.products.filter((product) => product.storeId === store.id && product.published);
  return { store, products };
}

export function getCart(db: Database, actor: Actor) {
  requirePermission(actor, "commerce.buy");
  const cart = db.carts.find((item) => item.userId === actor.id && item.clinicId === actor.clinicId);
  const lines = (cart?.lines ?? []).map((line) => {
    const product = db.products.find((item) => item.id === line.productId);
    return product
      ? { productId: product.id, name: product.name, unit: product.unit, priceIqd: product.priceIqd, qty: line.qty, storeId: product.storeId }
      : null;
  }).filter((line): line is NonNullable<typeof line> => Boolean(line));
  const totalIqd = lines.reduce((sum, line) => sum + line.priceIqd * line.qty, 0);
  return { lines, totalIqd };
}

export function addToCart(db: Database, actor: Actor, productId: string, qty = 1): Result<{ count: number }> {
  requirePermission(actor, "commerce.buy");
  const product = db.products.find((item) => item.id === productId && item.published);
  if (!product) return fail("المنتج غير متاح.");
  if (!Number.isInteger(qty) || qty < 1 || qty > 50) return fail("الكمية غير صالحة.");
  let cart = db.carts.find((item) => item.userId === actor.id && item.clinicId === actor.clinicId);
  if (!cart) {
    cart = { id: uid("cart"), clinicId: actor.clinicId!, userId: actor.id, lines: [] };
    db.carts.push(cart);
  }
  const line = cart.lines.find((item) => item.productId === productId);
  const nextQty = (line?.qty ?? 0) + qty;
  if (nextQty > product.stock) return fail("الكمية المطلوبة أكبر من متوفر المتجر.");
  if (line) line.qty = nextQty;
  else cart.lines.push({ productId, qty });
  return ok({ count: cart.lines.reduce((sum, item) => sum + item.qty, 0) });
}

export function updateCartQty(db: Database, actor: Actor, productId: string, qty: number): Result<{ count: number }> {
  requirePermission(actor, "commerce.buy");
  const cart = db.carts.find((item) => item.userId === actor.id && item.clinicId === actor.clinicId);
  if (!cart) return fail("السلة فارغة.");
  if (qty === 0) {
    cart.lines = cart.lines.filter((line) => line.productId !== productId);
    return ok({ count: cart.lines.length });
  }
  const product = db.products.find((item) => item.id === productId);
  if (!product || qty > product.stock) return fail("الكمية غير متوفرة.");
  const line = cart.lines.find((item) => item.productId === productId);
  if (!line) return fail("الصنف ليس في السلة.");
  line.qty = qty;
  return ok({ count: qty });
}

export function checkout(
  db: Database,
  actor: Actor,
  input: { address: string; paymentMethod: "cod" | "manual_transfer"; caseId?: string },
): Result<CommerceOrder[]> {
  requirePermission(actor, "commerce.buy");
  const cart = db.carts.find((item) => item.userId === actor.id && item.clinicId === actor.clinicId);
  if (!cart || cart.lines.length === 0) return fail("السلة فارغة.");
  if (input.address.trim().length < 8) return fail("اكتب عنوان استلام أوضح.", { address: "العنوان قصير." });
  if (input.caseId) {
    const clinicalCase = db.cases.find((item) => item.id === input.caseId && item.clinicId === actor.clinicId);
    if (!clinicalCase) return fail("لا يمكن ربط الطلب بحالة خارج عيادتك.");
  }
  const clinic = db.clinics.find((item) => item.id === actor.clinicId);
  const groups = new Map<string, typeof cart.lines>();
  for (const line of cart.lines) {
    const product = db.products.find((item) => item.id === line.productId && item.published);
    if (!product) return fail("أحد المنتجات لم يعد متاحاً.");
    if (line.qty > product.stock) return fail(`الكمية غير كافية لصنف ${product.name}.`);
    const list = groups.get(product.storeId) ?? [];
    list.push(line);
    groups.set(product.storeId, list);
  }

  const created: CommerceOrder[] = [];
  for (const [storeId, lines] of groups) {
    const detailed = lines.map((line) => {
      const product = db.products.find((item) => item.id === line.productId)!;
      product.stock -= line.qty;
      return { productId: product.id, name: product.name, qty: line.qty, unitPriceIqd: product.priceIqd };
    });
    const totalIqd = detailed.reduce((sum, line) => sum + line.qty * line.unitPriceIqd, 0);
    const order: CommerceOrder = {
      id: uid("ord"),
      storeId,
      clinicId: actor.clinicId!,
      placedBy: actor.id,
      deliveryAddress: input.address.trim(),
      contactName: actor.name,
      contactPhone: clinic?.phone ?? "",
      lines: detailed,
      status: "new",
      paymentMethod: input.paymentMethod,
      paymentStatus: "unpaid",
      totalIqd,
      caseId: input.caseId,
      inventoryReceived: false,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: uid("evt"),
          at: new Date().toISOString(),
          label: "أُنشئ الطلب وهو غير مدفوع، ولم يُحسب ضمن المصروف المدفوع.",
          actorName: actor.name,
          kind: "status",
        },
      ],
    };
    db.commerceOrders.push(order);
    upsertSourceExpense(db, order.clinicId, {
      category: "purchase",
      bucket: "unpaid",
      amountIqd: totalIqd,
      description: `طلب متجر ${order.id}`,
      sourceType: "commerce_order",
      sourceId: order.id,
      occurredOn: order.createdAt.slice(0, 10),
    });
    created.push(order);
  }
  cart.lines = [];
  audit(db, actor, "commerce.checkout", "commerce_order", created.map((order) => order.id).join(","));
  return ok(created);
}

export function listClinicOrders(db: Database, actor: Actor): ClinicOrderView[] {
  requirePermission(actor, "purchases.read");
  return db.commerceOrders
    .filter((order) => order.clinicId === actor.clinicId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => toClinic(db, order));
}

export function getClinicOrder(db: Database, actor: Actor, id: string): ClinicOrderView {
  requirePermission(actor, "purchases.read");
  const order = db.commerceOrders.find((item) => item.id === id);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, order.clinicId);
  return toClinic(db, order);
}

export function markCommerceOrderPaid(db: Database, actor: Actor, orderId: string): Result<ClinicOrderView> {
  requirePermission(actor, "expenses.write");
  const order = db.commerceOrders.find((item) => item.id === orderId);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, order.clinicId);
  if (order.status === "cancelled") return fail("لا يمكن تعليم طلب ملغى كمدفوع.");
  order.paymentStatus = "paid";
  upsertSourceExpense(db, order.clinicId, {
    category: "purchase",
    bucket: "paid",
    amountIqd: order.totalIqd,
    description: `طلب متجر مدفوع ${order.id}`,
    sourceType: "commerce_order",
    sourceId: order.id,
    occurredOn: new Date().toISOString().slice(0, 10),
  });
  if (!order.timeline.some((event) => event.label.includes("سُجّل الدفع"))) {
    order.timeline.push({
      id: uid("evt"),
      at: new Date().toISOString(),
      label: "سُجّل الدفع على نفس القيد المالي دون تكراره.",
      actorName: actor.name,
      kind: "system",
    });
  }
  audit(db, actor, "commerce.pay", "commerce_order", order.id);
  return ok(toClinic(db, order));
}

export function listMerchantOrders(db: Database, actor: Actor): MerchantOrderView[] {
  requireMerchant(actor);
  return db.commerceOrders
    .filter((order) => order.storeId === actor.storeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => toMerchant(db, order));
}

export function getMerchantOrder(db: Database, actor: Actor, id: string): MerchantOrderView {
  requireMerchant(actor);
  const order = db.commerceOrders.find((item) => item.id === id);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (order.storeId !== actor.storeId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  return toMerchant(db, order);
}

export function transitionCommerce(db: Database, actor: Actor, orderId: string, to: CommerceStatus): Result<MerchantOrderView> {
  requireMerchant(actor);
  const order = db.commerceOrders.find((item) => item.id === orderId);
  if (!order) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (order.storeId !== actor.storeId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  if (!FORWARD[order.status].includes(to)) return fail("لا يمكن نقل الطلب إلى هذه الحالة.");
  order.status = to;
  order.timeline.push({
    id: uid("evt"),
    at: new Date().toISOString(),
    label: commerceStatusLabel[to],
    actorName: actor.name,
    kind: "status",
  });
  audit(db, actor, "commerce.status", "commerce_order", order.id);
  return ok(toMerchant(db, order));
}

export function listOwnProducts(db: Database, actor: Actor): Product[] {
  requireMerchant(actor);
  return db.products.filter((product) => product.storeId === actor.storeId);
}

export function saveProduct(
  db: Database,
  actor: Actor,
  input: { id?: string; name: string; brand: string; category: string; priceIqd: number; stock: number; unit: string; sku: string; description: string },
): Result<Product> {
  requireMerchant(actor);
  if (input.name.trim().length < 2) return fail("اسم المنتج قصير.", { name: "اسم قصير." });
  if (!Number.isInteger(input.priceIqd) || input.priceIqd <= 0) return fail("السعر غير صالح.", { priceIqd: "سعر غير صالح." });
  if (!Number.isInteger(input.stock) || input.stock < 0) return fail("المخزون غير صالح.", { stock: "كمية غير صالحة." });
  if (input.id) {
    const product = db.products.find((item) => item.id === input.id);
    if (!product) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
    if (product.storeId !== actor.storeId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
    Object.assign(product, {
      name: input.name.trim(),
      brand: input.brand.trim(),
      category: input.category.trim(),
      priceIqd: input.priceIqd,
      stock: input.stock,
      unit: input.unit.trim() || "وحدة",
      sku: input.sku.trim(),
      description: input.description.trim(),
    });
    audit(db, actor, "product.update", "product", product.id);
    return ok(product);
  }
  const product: Product = {
    id: uid("prod"),
    storeId: actor.storeId!,
    name: input.name.trim(),
    brand: input.brand.trim(),
    category: input.category.trim() || "عام",
    priceIqd: input.priceIqd,
    stock: input.stock,
    unit: input.unit.trim() || "وحدة",
    published: true,
    sku: input.sku.trim() || uid("sku"),
    description: input.description.trim(),
  };
  db.products.push(product);
  audit(db, actor, "product.create", "product", product.id);
  return ok(product);
}

export function setProductPublished(db: Database, actor: Actor, productId: string, published: boolean): Result<Product> {
  requireMerchant(actor);
  const product = db.products.find((item) => item.id === productId);
  if (!product) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  if (product.storeId !== actor.storeId) throw new AccessError("FORBIDDEN", "لا تملك صلاحية الوصول إلى هذا السجل.");
  product.published = published;
  audit(db, actor, "product.publish", "product", product.id);
  return ok(product);
}

export function merchantReport(db: Database, actor: Actor) {
  requireMerchant(actor);
  const orders = db.commerceOrders.filter((order) => order.storeId === actor.storeId);
  const active = orders.filter((order) => order.status !== "cancelled" && order.status !== "returned");
  return {
    orders: orders.length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    grossIqd: active.reduce((sum, order) => sum + order.totalIqd, 0),
    products: db.products.filter((product) => product.storeId === actor.storeId).length,
  };
}
