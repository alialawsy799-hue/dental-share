export const DEMO_TODAY = "2026-11-05";
export const DEMO_NOW_ISO = "2026-11-05T09:30:00+03:00";
export const CLINIC_TIMEZONE = "Asia/Baghdad";
export const CURRENCY = "IQD";
export const CENTRAL_LAB_ID = "lab_central";

export const ROLES = [
  "clinic_owner",
  "clinic_doctor",
  "clinic_reception",
  "clinic_accountant",
  "clinic_desk",
  "lab_manager",
  "lab_technician",
  "merchant",
  "provider",
  "platform_admin",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "patients.read",
  "patients.write",
  "patients.clinical",
  "appointments.manage",
  "expenses.read",
  "expenses.write",
  "inventory.read",
  "inventory.write",
  "purchases.read",
  "purchases.receive",
  "lab.create",
  "lab.read",
  "commerce.buy",
  "community.post",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const OWNER_PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "patients.clinical",
  "appointments.manage",
  "expenses.read",
  "expenses.write",
  "inventory.read",
  "inventory.write",
  "purchases.read",
  "purchases.receive",
  "lab.create",
  "lab.read",
  "commerce.buy",
  "community.post",
];

export const DOCTOR_PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "patients.clinical",
  "appointments.manage",
  "inventory.read",
  "purchases.read",
  "lab.create",
  "lab.read",
  "commerce.buy",
  "community.post",
];

export const RECEPTION_PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "appointments.manage",
];

export const ACCOUNTANT_PERMISSIONS: Permission[] = [
  "expenses.read",
  "expenses.write",
  "purchases.read",
  "lab.read",
];

export const DESK_PERMISSIONS: Permission[] = [
  "patients.read",
  "patients.write",
  "appointments.manage",
  "expenses.read",
  "expenses.write",
  "inventory.read",
  "inventory.write",
];

export const WORK_TYPES = ["تاج", "جسر", "قشرة", "طقم", "زراعة", "حشوة داخلية", "واقي ليلي"] as const;
export const SHADES = ["A1", "A2", "A3", "A3.5", "B1", "B2", "BL1"] as const;
export const MATERIALS = ["زركونيا", "إيماكس", "معدن مغطى بالخزف", "أكريل", "شمع تشخيصي"] as const;
export const VISIT_TYPES = [
  "كشف",
  "حشوة",
  "قلع",
  "تنظيف",
  "علاج عصب",
  "تركيب",
  "تقويم",
  "زراعة",
  "متابعة",
  "معالجة",
  "استشارة",
] as const;

export const CLINIC_SERVICES = ["كشف", "حشوة", "قلع", "تنظيف", "علاج عصب", "تركيب", "تقويم", "زراعة", "متابعة"] as const;
export type ClinicService = (typeof CLINIC_SERVICES)[number];
export const PRIORITIES = ["normal", "urgent"] as const;
export const REGIONS = ["فك علوي", "فك سفلي", "الفكان", "منطقة محددة"] as const;

export const LAB_STATUSES = [
  "draft",
  "submitted",
  "lab_review",
  "accepted",
  "needs_revision",
  "preparing",
  "design",
  "awaiting_doctor_approval",
  "manufacturing",
  "quality_check",
  "ready",
  "out_for_delivery",
  "delivered",
  "rejected",
  "on_hold",
] as const;

export type LabStatus = (typeof LAB_STATUSES)[number];

export const COMMERCE_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type CommerceStatus = (typeof COMMERCE_STATUSES)[number];

export const SERVICE_STATUSES = [
  "submitted",
  "accepted",
  "in_progress",
  "needs_info",
  "result_ready",
  "closed",
] as const;

export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const APPOINTMENT_STATUSES = ["confirmed", "arrived", "cancelled", "no_show"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  title: string;
  clinicId?: string;
  storeId?: string;
  providerId?: string;
  labId?: string;
  verified: boolean;
  city: string;
  permissions: Permission[];
  locale: "ar";
  notificationPrefs: { appointments: boolean; orders: boolean; community: boolean };
}

export interface Actor {
  id: string;
  name: string;
  role: Role;
  title: string;
  clinicId?: string;
  storeId?: string;
  providerId?: string;
  labId?: string;
  verified: boolean;
  permissions: Permission[];
}

export interface ClinicAccess {
  systemEmail: string;
  systemPassword: string;
  doctorEmail: string;
  doctorPassword: string;
  doctorName: string;
  provisionedAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  district: string;
  phone: string;
  address: string;
  status: "active" | "pending" | "suspended";
  branchName: string;
  specialty?: string;
  joinedAt?: string;
  systemEmail?: string;
  access?: ClinicAccess;
}

export interface Chair {
  id: string;
  clinicId: string;
  name: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  fileNumber: string;
  name: string;
  phone: string;
  sex: "female" | "male";
  birthYear: number;
  medicalHistory: string;
  notes: string;
  allergies: string;
  consentStatus: "granted" | "pending";
  teeth: { fdi: string; note: string }[];
  createdAt: string;
}

export type PatientClinicalView = {
  access: "clinical";
  id: string;
  clinicId: string;
  fileNumber: string;
  name: string;
  phone: string;
  sex: "female" | "male";
  birthYear: number;
  medicalHistory: string;
  notes: string;
  allergies: string;
  consentStatus: "granted" | "pending";
  teeth: { fdi: string; note: string }[];
  createdAt: string;
};

export type PatientDeskView = {
  access: "desk";
  id: string;
  clinicId: string;
  fileNumber: string;
  name: string;
  phone: string;
  sex: "female" | "male";
  birthYear: number;
  consentStatus: "granted" | "pending";
  createdAt: string;
};

export type PatientView = PatientClinicalView | PatientDeskView;

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  chairId: string;
  visitType: string;
  startsAt: string;
  durationMin: number;
  status: AppointmentStatus;
  adminNote: string;
}

export type FundFrom = "income" | "external";

export interface Expense {
  id: string;
  clinicId: string;
  category: "operating" | "purchase" | "lab" | "other";
  bucket: "paid" | "unpaid" | "estimated";
  amountIqd: number;
  description: string;
  sourceType: "manual" | "commerce_order" | "lab_invoice";
  sourceId?: string;
  fundFrom?: FundFrom;
  occurredOn: string;
}

export interface InventoryItem {
  id: string;
  clinicId: string;
  name: string;
  unit: string;
  quantity: number;
  minQty: number;
  expiry?: string;
  sku: string;
}

export interface StockMovement {
  id: string;
  clinicId: string;
  itemId: string;
  type: "in" | "out" | "consume";
  quantity: number;
  reason: string;
  sourceType?: "commerce_order" | "manual" | "appointment";
  sourceId?: string;
  at: string;
}

export interface Attachment {
  name: string;
  mime: string;
  size: number;
}

export interface TimelineEvent {
  id: string;
  at: string;
  label: string;
  actorName: string;
  kind: "status" | "note" | "file" | "system";
}

export interface LabOrder {
  id: string;
  labId: string;
  clinicId: string;
  doctorId: string;
  patientId?: string;
  caseId?: string;
  caseCode: string;
  workType: string;
  teeth: string[];
  shade: string;
  material: string;
  dueAt: string;
  priority: "normal" | "urgent";
  status: LabStatus;
  clinicalNotes?: string;
  shareConsent: boolean;
  attachments: Attachment[];
  technicianId?: string;
  remakeOf?: string;
  remakeReason?: string;
  timeline: TimelineEvent[];
  quoteIqd?: number;
}

export interface LabInvoice {
  id: string;
  clinicId: string;
  labOrderId: string;
  amountIqd: number;
  status: "unpaid" | "paid";
  issuedOn: string;
}

export interface ServiceOrder {
  id: string;
  clinicId: string;
  doctorId: string;
  providerId: string;
  kind: "cbct" | "opg" | "ortho";
  patientId?: string;
  caseId?: string;
  caseCode: string;
  purpose: string;
  region?: string;
  instructions: string;
  dueAt: string;
  priority: "normal" | "urgent";
  status: ServiceStatus;
  attachments: Attachment[];
  result?: { summary: string; fileName?: string; uploadedAt: string };
  timeline: TimelineEvent[];
  shareConsent: boolean;
}

export interface ScannerRequest {
  id: string;
  clinicId: string;
  doctorId: string;
  mode: "courier" | "booking";
  dueAt: string;
  note: string;
  location?: string;
  caseCode: string;
  caseId?: string;
  patientId?: string;
  status: "submitted" | "scheduled" | "done";
  createdAt: string;
}

export interface ZipCaseRequest {
  id: string;
  clinicId: string;
  doctorId: string;
  note: string;
  file: Attachment;
  createdAt: string;
  status: "submitted";
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  city: string;
  categories: string[];
  deliveryNote: string;
  policy: string;
  about: string;
  status: "active" | "pending";
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  brand: string;
  category: string;
  priceIqd: number;
  stock: number;
  unit: string;
  published: boolean;
  sku: string;
  description: string;
}

export interface Cart {
  id: string;
  clinicId: string;
  userId: string;
  lines: { productId: string; qty: number }[];
}

export interface CommerceLine {
  productId: string;
  name: string;
  qty: number;
  unitPriceIqd: number;
}

export interface CommerceOrder {
  id: string;
  storeId: string;
  clinicId: string;
  placedBy: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  lines: CommerceLine[];
  status: CommerceStatus;
  paymentMethod: "cod" | "manual_transfer";
  paymentStatus: "unpaid" | "paid";
  totalIqd: number;
  caseId?: string;
  inventoryReceived: boolean;
  timeline: TimelineEvent[];
  createdAt: string;
}

export interface ClinicalCase {
  id: string;
  clinicId: string;
  patientId: string;
  code: string;
  title: string;
  teeth: string[];
  status: "active" | "completed";
  clinicalNotes: string;
  createdAt: string;
}

export interface CaseCost {
  id: string;
  caseId: string;
  clinicId: string;
  label: string;
  bucket: "paid" | "unpaid" | "estimated";
  amountIqd: number;
  sourceType: string;
  sourceId: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  body: string;
  tags: string[];
  specialty: string;
  createdAt: string;
  savedBy: string[];
  reports: { by: string; reason: string; at: string }[];
  status: "published" | "pending_review" | "removed";
  imageLabel?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  at: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  clinicId?: string;
}

export interface SupportTicket {
  id: string;
  fromName: string;
  topic: string;
  status: "open" | "closed";
  createdAt: string;
}

export interface ApprovalItem {
  id: string;
  name: string;
  detail: string;
  status: "pending" | "approved" | "rejected";
}

export interface Subscription {
  clinicId: string;
  plan: "trial";
  status: "trial";
  note: string;
}

export interface ProviderOrg {
  id: string;
  name: string;
  kind: "radiology" | "orthodontics";
  services: Array<"cbct" | "opg" | "ortho">;
  city: string;
}

export interface Database {
  users: User[];
  clinics: Clinic[];
  chairs: Chair[];
  patients: Patient[];
  appointments: Appointment[];
  expenses: Expense[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  labOrders: LabOrder[];
  labInvoices: LabInvoice[];
  serviceOrders: ServiceOrder[];
  scannerRequests: ScannerRequest[];
  zipRequests: ZipCaseRequest[];
  providers: ProviderOrg[];
  stores: Store[];
  products: Product[];
  carts: Cart[];
  commerceOrders: CommerceOrder[];
  cases: ClinicalCase[];
  caseCosts: CaseCost[];
  posts: CommunityPost[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  pendingClinics: ApprovalItem[];
  pendingStores: ApprovalItem[];
  pendingDoctors: ApprovalItem[];
  subscriptions: Subscription[];
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  group: "clinic" | "lab" | "store" | "provider" | "admin";
  groupLabel: string;
  detail: string;
}

export function toActor(user: User): Actor {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    title: user.title,
    clinicId: user.clinicId,
    storeId: user.storeId,
    providerId: user.providerId,
    labId: user.labId,
    verified: user.verified,
    permissions: user.permissions,
  };
}

export function homeForRole(role: Role): string {
  switch (role) {
    case "lab_manager":
    case "lab_technician":
      return "/lab";
    case "merchant":
      return "/merchant";
    case "provider":
      return "/provider";
    case "platform_admin":
      return "/admin";
    case "clinic_desk":
      return "/desk";
    default:
      return "/app";
  }
}

export const IDS = {
  clinicA: "clinic_noor",
  clinicB: "clinic_shams",
  lab: CENTRAL_LAB_ID,
  ahmed: "user_ahmed",
  layla: "user_layla",
  reception: "user_reception",
  accountant: "user_accountant",
  deskNoor: "user_noor_desk",
  sara: "user_sara",
  labManager: "user_lab_mgr",
  labTech: "user_lab_tech",
  merchantA: "user_merchant_basma",
  merchantB: "user_merchant_naqa",
  providerRadio: "user_provider_vision",
  providerOrtho: "user_provider_ortho",
  admin: "user_admin",
  patientA1: "pat_a_1042",
  patientA2: "pat_a_1088",
  patientA3: "pat_a_1110",
  patientB1: "pat_b_2201",
  apptA1: "appt_a_1",
  apptB1: "appt_b_1",
  labA: "lab_a_100",
  labApproval: "lab_a_101",
  labInbox: "lab_a_102",
  labB: "lab_b_200",
  invoiceUnpaid: "inv_lab_100",
  invoicePaid: "inv_lab_old",
  orderPaid: "ord_a_paid",
  orderUnpaid: "ord_a_open",
  orderB: "ord_b_1",
  storeBasma: "store_basma",
  storeNaqa: "store_naqa",
  prodZir: "prod_zir",
  prodGlove: "prod_glove",
  prodLed: "prod_led",
  caseA: "case_a_17",
  caseB: "case_a_18",
  postReported: "post_2",
  providerVision: "prov_vision",
  orthoOrg: "prov_ortho",
  svcCbct: "svc_cbct_1",
  svcOpg: "svc_opg_1",
  svcOrtho: "svc_ortho_1",
} as const;
