import { z } from "zod";
import { fail, ok, validationError, type Result } from "./errors";
import { audit, requireAdmin, uid } from "./guard";
import { ensureClinicSupplies } from "./inventory";
import { DEMO_TODAY, DESK_PERMISSIONS, DOCTOR_PERMISSIONS, OWNER_PERMISSIONS, type Actor, type Clinic, type Database, type Role, type User } from "./types";

export function analytics(db: Database, actor: Actor) {
  requireAdmin(actor);
  const gmv = db.commerceOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalIqd, 0);
  const activeClinics = db.clinics.filter((clinic) => clinic.status === "active").length;
  const pendingClinics = db.pendingClinics.filter((item) => item.status === "pending").length;
  const suspendedClinics = db.clinics.filter((clinic) => clinic.status === "suspended").length;
  const deliveredLab = db.labOrders.filter((order) => order.status === "delivered").length;
  const openReports = db.posts.filter((post) => post.reports.length > 0 && post.status !== "removed").length;
  const providers = db.providers.length;
  const monthKeys = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`);
  const monthly = monthKeys.map((key) => {
    const labs = db.labOrders.filter((order) => (order.timeline[0]?.at ?? order.dueAt).startsWith(key)).length;
    const orders = db.commerceOrders.filter((order) => order.createdAt.startsWith(key)).length;
    const visits = db.appointments.filter((item) => item.startsAt.startsWith(key)).length;
    return { key, value: labs + orders + visits };
  });
  const peak = monthly.reduce((best, point) => (point.value > best.value ? point : best), monthly[0]);
  const clinicShare = Math.max(activeClinics, 1);
  const labShare = Math.max(db.labOrders.length, 1);
  const storeShare = Math.max(db.stores.length, 1);
  const reportShare = Math.max(openReports, 1);
  const mixTotal = clinicShare + labShare + storeShare + reportShare;
  const health = Math.round(
    Math.min(
      1000,
      (activeClinics / Math.max(activeClinics + pendingClinics + suspendedClinics, 1)) * 420 +
        (deliveredLab / Math.max(db.labOrders.length, 1)) * 320 +
        (openReports ? 80 : 180) +
        80,
    ),
  );
  return {
    clinics: activeClinics,
    pendingClinics,
    suspendedClinics,
    stores: db.stores.filter((store) => store.status === "active").length,
    providers,
    labOrders: db.labOrders.length,
    deliveredLab,
    commerceOrders: db.commerceOrders.length,
    gmvIqd: gmv,
    openReports,
    appointmentsToday: db.appointments.filter((item) => item.startsAt.startsWith(DEMO_TODAY)).length,
    deskAccounts: db.users.filter((user) => user.role === "clinic_desk").length,
    doctors: db.users.filter((user) => user.role === "clinic_owner" || user.role === "clinic_doctor").length,
    health,
    monthly,
    peak,
    mix: [
      { label: "عيادات", value: clinicShare, color: "#a78bfa" },
      { label: "مختبر", value: labShare, color: "#e879f9" },
      { label: "متاجر", value: storeShare, color: "#818cf8" },
      { label: "بلاغات", value: reportShare, color: "#38bdf8" },
    ],
    mixTotal,
  };
}

export function listApprovals(db: Database, actor: Actor) {
  requireAdmin(actor);
  return {
    clinics: db.pendingClinics,
    stores: db.pendingStores,
    doctors: db.pendingDoctors,
  };
}

export function decideApproval(
  db: Database,
  actor: Actor,
  kind: "clinic" | "store" | "doctor",
  id: string,
  decision: "approved" | "rejected",
): Result<{ id: string }> {
  requireAdmin(actor);
  const list = kind === "clinic" ? db.pendingClinics : kind === "store" ? db.pendingStores : db.pendingDoctors;
  const item = list.find((entry) => entry.id === id);
  if (!item) return { ok: false, error: "الطلب غير موجود." };
  item.status = decision;
  if (decision === "approved" && kind === "clinic") {
    db.clinics.push({
      id: uid("clinic"),
      name: item.name,
      city: "بغداد",
      district: "بانتظار استكمال العنوان",
      phone: "00000000000",
      address: "غير مكتمل",
      status: "active",
      branchName: "الفرع الرئيسي",
      specialty: "طب أسنان عام",
      joinedAt: DEMO_TODAY,
    });
  }
  if (decision === "approved" && kind === "store") {
    db.stores.push({
      id: uid("store"),
      slug: `store-${id}`,
      name: item.name,
      city: "بغداد",
      categories: ["عام"],
      deliveryNote: "يُحدد لاحقاً",
      policy: "بانتظار سياسة البيع",
      about: item.detail,
      status: "active",
    });
  }
  audit(db, actor, `approval.${decision}`, kind, id);
  return ok({ id });
}

export function listSupport(db: Database, actor: Actor) {
  requireAdmin(actor);
  return db.supportTickets;
}

export function closeTicket(db: Database, actor: Actor, id: string): Result<{ id: string }> {
  requireAdmin(actor);
  const ticket = db.supportTickets.find((item) => item.id === id);
  if (!ticket) return { ok: false, error: "التذكرة غير موجودة." };
  ticket.status = "closed";
  audit(db, actor, "support.close", "support", id);
  return ok({ id });
}

export function listAudit(db: Database, actor: Actor, clinicId?: string) {
  requireAdmin(actor);
  return db.auditLogs
    .slice()
    .reverse()
    .filter((entry) => !clinicId || entry.clinicId === clinicId || entry.entityId === clinicId)
    .slice(0, clinicId ? 24 : 12)
    .map((entry) => ({
      id: entry.id,
      at: entry.at,
      action: entry.action,
      actorName: db.users.find((user) => user.id === entry.actorId)?.name ?? "النظام",
      entityType: entry.entityType,
      entityId: entry.entityType === "patient" ? "مخفي" : entry.entityId,
    }));
}

const NAME_SLUGS: [string, string][] = [
  ["النور", "noor"],
  ["نور", "noor"],
  ["الشمس", "shams"],
  ["الرافدين", "rafidain"],
  ["الأمل", "amal"],
  ["السلام", "salam"],
  ["الورود", "wurood"],
  ["البيان", "bayan"],
  ["الشفاء", "shifa"],
  ["الريان", "rayyan"],
  ["المستقبل", "mustaqbal"],
];

export function clinicSlugFromName(name: string, fallback = "clinic"): string {
  for (const [arabic, latin] of NAME_SLUGS) {
    if (name.includes(arabic)) return latin;
  }
  const latin = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12);
  if (latin.length >= 3) return latin;
  const fromFallback = fallback.replace(/[^a-z0-9]+/gi, "").toLowerCase().slice(0, 12);
  return fromFallback || "clinic";
}

function uniqueEmail(db: Database, localPart: string): string {
  const base = localPart.replace(/[^a-z0-9.]+/gi, "").toLowerCase() || "clinic";
  let email = `${base}@dentalshare.demo`;
  let index = 2;
  while (db.users.some((user) => user.email.toLowerCase() === email)) {
    email = `${base}${index}@dentalshare.demo`;
    index += 1;
  }
  return email;
}

function passwordFor(slug: string, kind: "clinic" | "doc"): string {
  const stem = slug.replace(/[^a-z0-9]/gi, "");
  const label = stem ? stem[0].toUpperCase() + stem.slice(1) : "Clinic";
  return kind === "clinic" ? `${label}Clinic@2026` : `${label}Doc@2026`;
}

function staffOf(db: Database, clinicId: string) {
  return db.users
    .filter((user) => user.clinicId === clinicId)
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      title: user.title,
      verified: user.verified,
      city: user.city,
    }));
}

export type ClinicDossier = {
  clinic: Clinic;
  staff: ReturnType<typeof staffOf>;
  owners: number;
  doctors: number;
  patientCount: number;
  chairCount: number;
  todayAppointments: number;
  openLab: number;
  openPurchases: number;
  unpaidLabInvoices: number;
  inventoryAlerts: number;
  subscriptionNote: string;
  hasSystemAccount: boolean;
  hasDoctorAccount: boolean;
};

function dossierOf(db: Database, clinic: Clinic): ClinicDossier {
  const staff = staffOf(db, clinic.id);
  return {
    clinic,
    staff,
    owners: staff.filter((member) => member.role === "clinic_owner").length,
    doctors: staff.filter((member) => member.role === "clinic_owner" || member.role === "clinic_doctor").length,
    patientCount: db.patients.filter((patient) => patient.clinicId === clinic.id).length,
    chairCount: db.chairs.filter((chair) => chair.clinicId === clinic.id).length,
    todayAppointments: db.appointments.filter((item) => item.clinicId === clinic.id && item.startsAt.startsWith(DEMO_TODAY)).length,
    openLab: db.labOrders.filter((order) => order.clinicId === clinic.id && !["delivered", "rejected", "draft"].includes(order.status)).length,
    openPurchases: db.commerceOrders.filter((order) => order.clinicId === clinic.id && !["delivered", "cancelled", "returned"].includes(order.status)).length,
    unpaidLabInvoices: db.labInvoices.filter((invoice) => invoice.clinicId === clinic.id && invoice.status === "unpaid").length,
    inventoryAlerts: db.inventory.filter((item) => item.clinicId === clinic.id && item.quantity <= item.minQty).length,
    subscriptionNote: db.subscriptions.find((item) => item.clinicId === clinic.id)?.note ?? "تجربة تشغيل بلا تحصيل.",
    hasSystemAccount: Boolean(clinic.systemEmail && db.users.some((user) => user.email.toLowerCase() === clinic.systemEmail?.toLowerCase())),
    hasDoctorAccount: staff.some((member) => member.role === "clinic_owner" || member.role === "clinic_doctor"),
  };
}

export function listClinicDossiers(db: Database, actor: Actor, query = ""): ClinicDossier[] {
  requireAdmin(actor);
  const needle = query.trim();
  return db.clinics
    .filter((clinic) => {
      if (!needle) return true;
      return clinic.name.includes(needle) || clinic.city.includes(needle) || clinic.district.includes(needle) || (clinic.systemEmail ?? "").includes(needle);
    })
    .map((clinic) => dossierOf(db, clinic))
    .sort((a, b) => {
      const rank = { active: 0, pending: 1, suspended: 2 };
      return rank[a.clinic.status] - rank[b.clinic.status] || a.clinic.name.localeCompare(b.clinic.name, "ar");
    });
}

export function getClinicDossier(db: Database, actor: Actor, clinicId: string) {
  requireAdmin(actor);
  const clinic = db.clinics.find((item) => item.id === clinicId);
  if (!clinic) return fail("العيادة غير موجودة.");
  const card = dossierOf(db, clinic);
  const labOrders = db.labOrders
    .filter((order) => order.clinicId === clinic.id)
    .slice()
    .reverse()
    .slice(0, 8)
    .map((order) => ({
      id: order.id,
      caseCode: order.caseCode,
      workType: order.workType,
      status: order.status,
      quoteIqd: order.quoteIqd,
      priority: order.priority,
    }));
  const purchases = db.commerceOrders
    .filter((order) => order.clinicId === clinic.id)
    .slice()
    .reverse()
    .slice(0, 8)
    .map((order) => ({
      id: order.id,
      storeName: db.stores.find((store) => store.id === order.storeId)?.name ?? "متجر",
      status: order.status,
      totalIqd: order.totalIqd,
      createdAt: order.createdAt,
    }));
  const expensesSettled = db.expenses
    .filter((expense) => expense.clinicId === clinic.id && expense.bucket === "paid")
    .reduce((sum, expense) => sum + expense.amountIqd, 0);
  return ok({
    ...card,
    labOrders,
    purchases,
    expensesSettled,
    activeCases: db.cases.filter((item) => item.clinicId === clinic.id && item.status === "active").length,
    audit: listAudit(db, actor, clinic.id),
  });
}

const optionalEmail = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email(message).optional(),
  );

const clinicSchema = z.object({
  name: z.string().trim().min(4, "اكتب اسم العيادة.").max(80),
  city: z.string().trim().min(2, "حدد المدينة.").max(40),
  district: z.string().trim().min(2, "حدد الحي.").max(40),
  phone: z.string().trim().regex(/^07\d{9}$/, "اكتب رقماً عراقياً من 11 خانة يبدأ بـ 07."),
  address: z.string().trim().min(6, "اكتب العنوان.").max(160),
  branchName: z.string().trim().min(3, "اكتب اسم الفرع.").max(40).optional().default("الفرع الرئيسي"),
  specialty: z.string().trim().min(3, "اكتب التخصص.").max(80).optional().default("طب أسنان عام"),
  doctorName: z.string().trim().min(4, "اكتب اسم طبيب العيادة.").max(80),
  doctorEmail: optionalEmail("بريد الطبيب غير صالح."),
  systemEmail: optionalEmail("بريد النظام غير صالح."),
});

export type ClinicCreateInput = z.infer<typeof clinicSchema>;

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

function permissionsFor(role: Role) {
  if (role === "clinic_desk") return DESK_PERMISSIONS;
  if (role === "clinic_doctor") return DOCTOR_PERMISSIONS;
  return OWNER_PERMISSIONS;
}

function asDeskAccount(user: User) {
  user.role = "clinic_desk";
  user.title = "نظام حجوزات العيادة";
  user.permissions = DESK_PERMISSIONS;
}

export function migrateClinicDeskAccounts(db: Database) {
  for (const user of db.users) {
    if (user.role === "clinic_desk" || user.title === "حساب نظام العيادة") {
      asDeskAccount(user);
    }
  }
}

function pushUser(
  db: Database,
  input: {
    email: string;
    password: string;
    name: string;
    role: User["role"];
    title: string;
    clinicId: string;
    city: string;
  },
): User {
  const user: User = {
    id: uid("user"),
    email: input.email.toLowerCase(),
    password: input.password,
    name: input.name,
    role: input.role,
    title: input.title,
    clinicId: input.clinicId,
    verified: true,
    city: input.city,
    permissions: permissionsFor(input.role),
    locale: "ar",
    notificationPrefs: { appointments: true, orders: true, community: false },
  };
  db.users.push(user);
  return user;
}

function attachAccess(
  clinic: Clinic,
  system: { email: string; password: string },
  doctor: { email: string; password: string; name: string },
) {
  clinic.systemEmail = system.email;
  clinic.access = {
    systemEmail: system.email,
    systemPassword: system.password,
    doctorEmail: doctor.email,
    doctorPassword: doctor.password,
    doctorName: doctor.name,
    provisionedAt: new Date().toISOString(),
  };
}

export function createClinicWithAccess(db: Database, actor: Actor, raw: unknown): Result<{ id: string }> {
  requireAdmin(actor);
  const parsed = clinicSchema.safeParse(raw);
  if (!parsed.success) return validationError(fieldErrorsOf(parsed.error));
  const input = parsed.data;
  if (db.clinics.some((clinic) => clinic.name === input.name && clinic.city === input.city)) {
    return fail("عيادة بهذا الاسم موجودة في نفس المدينة.", { name: "اسم مكرر في هذه المدينة." });
  }

  const clinicId = uid("clinic");
  const slug = clinicSlugFromName(input.name, clinicId);
  const systemEmail = input.systemEmail || uniqueEmail(db, `${slug}.clinic`);
  const doctorEmail = input.doctorEmail || uniqueEmail(db, `dr.${slug}`);
  if (db.users.some((user) => user.email.toLowerCase() === systemEmail.toLowerCase())) {
    return fail("بريد نظام العيادة مستخدم.", { systemEmail: "بريد مكرر." });
  }
  if (db.users.some((user) => user.email.toLowerCase() === doctorEmail.toLowerCase())) {
    return fail("بريد الطبيب مستخدم.", { doctorEmail: "بريد مكرر." });
  }

  const clinic: Clinic = {
    id: clinicId,
    name: input.name,
    city: input.city,
    district: input.district,
    phone: input.phone,
    address: input.address,
    status: "active",
    branchName: input.branchName,
    specialty: input.specialty,
    joinedAt: DEMO_TODAY,
    systemEmail,
  };
  const systemPassword = passwordFor(slug, "clinic");
  const doctorPassword = passwordFor(slug, "doc");
  attachAccess(clinic, { email: systemEmail, password: systemPassword }, { email: doctorEmail, password: doctorPassword, name: input.doctorName });
  db.clinics.push(clinic);
  db.chairs.push({ id: uid("chair"), clinicId, name: "كرسي 1" });
  ensureClinicSupplies(db, clinicId);
  db.subscriptions.push({
    clinicId,
    plan: "trial",
    status: "trial",
    note: "التسعير غير معتمد. لا يوجد تحصيل في هذه النسخة.",
  });
  pushUser(db, {
    email: systemEmail,
    password: systemPassword,
    name: input.name,
    role: "clinic_desk",
    title: "نظام حجوزات العيادة",
    clinicId,
    city: input.city,
  });
  pushUser(db, {
    email: doctorEmail,
    password: doctorPassword,
    name: input.doctorName,
    role: "clinic_owner",
    title: "طبيب أسنان · مالك",
    clinicId,
    city: input.city,
  });
  audit(db, actor, "clinic.create", "clinic", clinicId);
  return ok({ id: clinicId });
}

const provisionSchema = z.object({
  clinicId: z.string().min(1),
  doctorName: z.string().trim().min(4, "اكتب اسم طبيب العيادة.").max(80),
  doctorEmail: optionalEmail("بريد الطبيب غير صالح."),
  systemEmail: optionalEmail("بريد النظام غير صالح."),
});

export function provisionClinicAccess(db: Database, actor: Actor, raw: unknown): Result<{ id: string }> {
  requireAdmin(actor);
  const parsed = provisionSchema.safeParse(raw);
  if (!parsed.success) return validationError(fieldErrorsOf(parsed.error));
  const input = parsed.data;
  const clinic = db.clinics.find((item) => item.id === input.clinicId);
  if (!clinic) return fail("العيادة غير موجودة.");

  const slug = clinicSlugFromName(clinic.name, clinic.id);
  const systemEmail = (input.systemEmail || clinic.systemEmail || uniqueEmail(db, `${slug}.clinic`)).toLowerCase();
  const doctorEmail = (input.doctorEmail || uniqueEmail(db, `dr.${slug}`)).toLowerCase();
  const systemPassword = clinic.access?.systemPassword || passwordFor(slug, "clinic");
  const doctorPassword = passwordFor(slug, "doc");

  const systemTaken = db.users.find((user) => user.email.toLowerCase() === systemEmail);
  if (systemTaken && systemTaken.clinicId !== clinic.id) {
    return fail("بريد نظام العيادة مستخدم لعيادة أخرى.", { systemEmail: "بريد مكرر." });
  }
  const doctorTaken = db.users.find((user) => user.email.toLowerCase() === doctorEmail);
  if (doctorTaken) return fail("بريد الطبيب مستخدم.", { doctorEmail: "بريد مكرر." });

  if (!systemTaken) {
    pushUser(db, {
      email: systemEmail,
      password: systemPassword,
      name: clinic.name,
      role: "clinic_desk",
      title: "نظام حجوزات العيادة",
      clinicId: clinic.id,
      city: clinic.city,
    });
  } else if (systemTaken.title === "حساب نظام العيادة" || systemTaken.role === "clinic_desk") {
    asDeskAccount(systemTaken);
  }
  const hasOwner = db.users.some(
    (user) =>
      user.clinicId === clinic.id &&
      (user.role === "clinic_owner" || user.role === "clinic_doctor") &&
      user.email.toLowerCase() !== systemEmail,
  );
  pushUser(db, {
    email: doctorEmail,
    password: doctorPassword,
    name: input.doctorName,
    role: hasOwner ? "clinic_doctor" : "clinic_owner",
    title: hasOwner ? "طبيب أسنان" : "طبيب أسنان · مالك",
    clinicId: clinic.id,
    city: clinic.city,
  });
  attachAccess(clinic, { email: systemEmail, password: systemTaken?.password ?? systemPassword }, { email: doctorEmail, password: doctorPassword, name: input.doctorName });
  audit(db, actor, "clinic.provision", "clinic", clinic.id);
  return ok({ id: clinic.id });
}

export function setClinicStatus(db: Database, actor: Actor, clinicId: string, status: Clinic["status"]): Result<{ id: string }> {
  requireAdmin(actor);
  const clinic = db.clinics.find((item) => item.id === clinicId);
  if (!clinic) return fail("العيادة غير موجودة.");
  clinic.status = status;
  audit(db, actor, `clinic.${status}`, "clinic", clinicId);
  return ok({ id: clinicId });
}
