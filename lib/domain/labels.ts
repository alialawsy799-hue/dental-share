import type { AppointmentStatus, CommerceStatus, LabStatus, Role, ServiceStatus } from "./types";

export const labStatusLabel: Record<LabStatus, string> = {
  draft: "مسودة",
  submitted: "مُرسل",
  lab_review: "بانتظار مراجعة المختبر",
  accepted: "مقبول",
  needs_revision: "بحاجة تعديل",
  preparing: "تحت التحضير",
  design: "التصميم",
  awaiting_doctor_approval: "بانتظار اعتماد الطبيب",
  manufacturing: "تصنيع",
  quality_check: "فحص جودة",
  ready: "جاهز",
  out_for_delivery: "بالتوصيل",
  delivered: "مُسلّم",
  rejected: "مرفوض",
  on_hold: "معلّق",
};

export const commerceStatusLabel: Record<CommerceStatus, string> = {
  new: "جديد",
  confirmed: "مؤكد",
  preparing: "قيد التجهيز",
  shipped: "أُرسل",
  delivered: "تم التسليم",
  cancelled: "ملغى",
  returned: "مُعاد",
};

export const serviceStatusLabel: Record<ServiceStatus, string> = {
  submitted: "مُرسل",
  accepted: "مقبول",
  in_progress: "قيد التنفيذ",
  needs_info: "بحاجة استكمال",
  result_ready: "النتيجة جاهزة",
  closed: "مغلق",
};

export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  confirmed: "مؤكد",
  arrived: "حضر",
  cancelled: "أُلغي",
  no_show: "لم يحضر",
};

export const roleLabel: Record<Role, string> = {
  clinic_owner: "مالك العيادة",
  clinic_doctor: "طبيب",
  clinic_reception: "استقبال",
  clinic_accountant: "محاسب",
  clinic_desk: "نظام الحجوزات",
  lab_manager: "مدير المختبر",
  lab_technician: "فني مختبر",
  merchant: "تاجر",
  provider: "مزود خدمة",
  platform_admin: "إدارة المنصة",
};

export const serviceKindLabel = {
  lab: "المختبر المركزي",
  cbct: "تصوير CBCT",
  opg: "تصوير OPG",
  ortho: "خدمات التقويم",
} as const;

export const bucketLabel = {
  paid: "مدفوع",
  unpaid: "غير مدفوع",
  estimated: "تقديري",
} as const;

export const fundFromLabel = {
  income: "من الدخل",
  external: "من مكان خارجي",
} as const;

export const priorityLabel = {
  normal: "اعتيادي",
  urgent: "عاجل",
} as const;

export const NOTICES: Record<string, string> = {
  patient_created: "حُفظ ملف المريض داخل عيادة هذا الحساب فقط.",
  appointment_created: "ثُبّت الموعد وخُصمت مواد الخدمة من المخزن إن توفرت.",
  appointment_updated: "تحدّثت حالة الموعد.",
  expense_created: "أُضيف المصروف اليدوي في التصنيف الذي اخترته.",
  stock_updated: "سُجّلت حركة المخزون.",
  received: "أُضيف الاستلام إلى المخزن مرة واحدة ولن يتكرر.",
  paid: "نُقل المبلغ إلى المدفوع على نفس القيد دون إنشاء مصروف ثانٍ.",
  lab_created: "أُرسل الطلب إلى المختبر المركزي بعد موافقة المشاركة الدنيا.",
  scanner_created: "أُرسل طلب المندوب إلى تلغرام.",
  zip_created: "أُرسل ملف ZIP مع معلومات العيادة إلى تلغرام.",
  service_created: "أُرسل الطلب إلى المزوّد المحدد لهذا النوع.",
  lab_updated: "تحدّث مسار طلب المختبر.",
  design_approved: "اعتُمد التصميم وأصبحت المرحلة: تصنيع.",
  note_added: "أُضيفت الملاحظة إلى سجل الطلب.",
  order_placed: "ثُبت طلب المتجر. الدفع غير مربوط ببوابة حقيقية.",
  cart_updated: "تحدّثت السلة.",
  commerce_updated: "تحدّثت حالة طلب المتجر.",
  product_saved: "حُفظ المنتج داخل متجرك فقط.",
  post_queued: "وصل المنشور إلى طابور الإشراف ولن يُنشر علناً في هذه النسخة.",
  reported: "سُجّل التبليغ في طابور الإشراف.",
  saved: "تحدّث الحفظ.",
  result_uploaded: "رُفعت نتيجة الطلب ووصلت للعيادة داخل نفس الطلب.",
  approved: "تم اعتماد الطلب التشغيلي.",
  prefs_saved: "حُفظت تفضيلات الإشعارات داخل العرض التجريبي.",
  remake_created: "فُتح طلب إعادة صنع مرتبط بالطلب الأصلي.",
  clinic_created: "أُنشئت العيادة. إيميل النظام يفتح الحجوزات، وحساب الطبيب يفتح تطبيق العيادة. كلمات المرور في تبويب الفريق.",
  clinic_provisioned: "أُنشئ إيميل نظام الحجوزات وحساب الطبيب. الإيميل يفتح /desk والطبيب يفتح /app لنفس العيادة.",
  clinic_updated: "تحدّثت حالة العيادة.",
};

export const clinicStatusLabel = {
  active: "نشطة",
  pending: "بانتظار التفعيل",
  suspended: "موقوفة",
} as const;
