import type { IconName } from "@/components/icons";

export const STORE_DEPARTMENTS = [
  { id: "disposable", categories: ["دسبوزبل"] },
  { id: "fillings", categories: ["حشوات", "حشوات الجذر"] },
  { id: "prostho", categories: ["بروس"] },
  { id: "surgical", categories: ["سيرجكال"] },
] as const;

export type StoreDepartmentId = (typeof STORE_DEPARTMENTS)[number]["id"];

export const STORE_DEPARTMENT_ICONS: Record<StoreDepartmentId, IconName> = {
  disposable: "box",
  fillings: "tooth",
  prostho: "star",
  surgical: "bolt",
};

export function isStoreDepartment(value: string): value is StoreDepartmentId {
  return STORE_DEPARTMENTS.some((item) => item.id === value);
}

export function departmentCategories(id: StoreDepartmentId): readonly string[] {
  return STORE_DEPARTMENTS.find((item) => item.id === id)?.categories ?? [];
}
