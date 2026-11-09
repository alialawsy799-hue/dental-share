import type { Database, Persona, User } from "./types";

const GROUP: Record<User["role"], Persona["group"]> = {
  clinic_owner: "clinic",
  clinic_doctor: "clinic",
  clinic_reception: "clinic",
  clinic_accountant: "clinic",
  clinic_desk: "clinic",
  lab_manager: "lab",
  lab_technician: "lab",
  merchant: "store",
  provider: "provider",
  platform_admin: "admin",
};

const GROUP_LABEL: Record<Persona["group"], string> = {
  clinic: "العيادات",
  lab: "المختبر المركزي",
  store: "المتاجر",
  provider: "مزودو الخدمة",
  admin: "إدارة المنصة",
};

export function listPersonas(db: Database): Persona[] {
  return db.users.map((user) => {
    const clinic = db.clinics.find((item) => item.id === user.clinicId);
    const store = db.stores.find((item) => item.id === user.storeId);
    const provider = db.providers.find((item) => item.id === user.providerId);
    const detail = clinic?.name ?? store?.name ?? provider?.name ?? (user.labId ? "مختبر دينتال شير المركزي" : "تشغيل المنصة");
    const group = GROUP[user.role];
    return {
      id: user.id,
      name: user.name,
      title: user.title,
      group,
      groupLabel: GROUP_LABEL[group],
      detail,
    };
  });
}
