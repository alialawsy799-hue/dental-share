import type { ClinicService } from "./types";

export const STARTER_SUPPLIES: { sku: string; name: string; unit: string; quantity: number; minQty: number }[] = [
  { sku: "desk:glove", name: "قفازات نيتريل", unit: "علبة", quantity: 24, minQty: 6 },
  { sku: "desk:mask", name: "كمامات", unit: "علبة", quantity: 18, minQty: 4 },
  { sku: "desk:gauze", name: "شاش طبي", unit: "علبة", quantity: 16, minQty: 4 },
  { sku: "desk:anesthetic", name: "مخدر موضعي", unit: "أمبولة", quantity: 20, minQty: 6 },
  { sku: "desk:composite", name: "حشوة كمبوزت", unit: "وحدة", quantity: 12, minQty: 4 },
  { sku: "desk:paste", name: "معجون تنظيف", unit: "أنبوب", quantity: 8, minQty: 3 },
  { sku: "desk:file", name: "مبارد علاج عصب", unit: "علبة", quantity: 6, minQty: 2 },
  { sku: "desk:cement", name: "إسمنت تثبيت", unit: "علبة", quantity: 5, minQty: 2 },
];

export const SERVICE_CONSUME: Record<ClinicService, { sku: string; qty: number }[]> = {
  كشف: [{ sku: "desk:glove", qty: 1 }],
  حشوة: [
    { sku: "desk:glove", qty: 1 },
    { sku: "desk:composite", qty: 1 },
  ],
  قلع: [
    { sku: "desk:glove", qty: 1 },
    { sku: "desk:gauze", qty: 1 },
    { sku: "desk:anesthetic", qty: 1 },
  ],
  تنظيف: [
    { sku: "desk:glove", qty: 1 },
    { sku: "desk:paste", qty: 1 },
  ],
  "علاج عصب": [
    { sku: "desk:glove", qty: 1 },
    { sku: "desk:file", qty: 1 },
    { sku: "desk:anesthetic", qty: 1 },
  ],
  تركيب: [
    { sku: "desk:glove", qty: 1 },
    { sku: "desk:cement", qty: 1 },
  ],
  تقويم: [{ sku: "desk:glove", qty: 1 }],
  زراعة: [
    { sku: "desk:glove", qty: 1 },
    { sku: "desk:gauze", qty: 1 },
    { sku: "desk:anesthetic", qty: 1 },
  ],
  متابعة: [{ sku: "desk:glove", qty: 1 }],
};

export function suppliesForService(service: string): { sku: string; qty: number }[] {
  return SERVICE_CONSUME[service as ClinicService] ?? [];
}
