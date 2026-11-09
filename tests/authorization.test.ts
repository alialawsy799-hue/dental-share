import { describe, expect, it } from "vitest";
import { analytics, listAudit, listSupport } from "@/lib/domain/admin";
import { createAppointment, getAppointment, setAppointmentStatus } from "@/lib/domain/appointments";
import { getCaseHub } from "@/lib/domain/cases";
import { checkout, getMerchantOrder, merchantReport, saveProduct, transitionCommerce } from "@/lib/domain/commerce";
import { createPost, listFeed } from "@/lib/domain/community";
import { expenseLedger, getExpense, summarizeExpenses } from "@/lib/domain/expenses";
import { AccessError } from "@/lib/domain/errors";
import { receiveCommerceOrder } from "@/lib/domain/inventory";
import { createLabOrder, getLabOrder, transitionLab } from "@/lib/domain/lab";
import { createPatient, getPatient } from "@/lib/domain/patients";
import { createDatabase } from "@/lib/domain/seed";
import { getProviderOrder } from "@/lib/domain/services";
import { CENTRAL_LAB_ID, IDS, toActor, type Actor, type Database, type Expense } from "@/lib/domain/types";

function actor(db: Database, id: string): Actor {
  const user = db.users.find((item) => item.id === id);
  if (!user) throw new Error(`missing ${id}`);
  return toActor(user);
}

const names = ["نور الهدى عبد الله", "حسين مازن كريم", "رنا صالح مهدي", "دانا كمال رشيد"];

describe("عزل العيادات", () => {
  it("يمنع عيادة النور من قراءة مريض أو موعد أو مصروف عيادة الشمس", () => {
    const db = createDatabase();
    const ahmed = actor(db, IDS.ahmed);
    expect(() => getPatient(db, ahmed, IDS.patientB1)).toThrow(AccessError);
    expect(() => getAppointment(db, ahmed, IDS.apptB1)).toThrow(AccessError);
    expect(() => getExpense(db, ahmed, "exp_b_rent")).toThrow(AccessError);
    try {
      getPatient(db, ahmed, IDS.patientB1);
    } catch (error) {
      expect(error).toBeInstanceOf(AccessError);
      expect((error as AccessError).code).toBe("FORBIDDEN");
      expect((error as AccessError).message).not.toContain("دانا");
    }
  });

  it("يميز السجل المفقود عن سجل عيادة أخرى", () => {
    const db = createDatabase();
    const ahmed = actor(db, IDS.ahmed);
    expect(() => getPatient(db, ahmed, "pat_missing")).toThrowError(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("يرفض حجز مريض من عيادة أخرى دون كشف اسمه", () => {
    const db = createDatabase();
    const result = createAppointment(db, actor(db, IDS.ahmed), {
      patientId: IDS.patientB1,
      doctorId: IDS.ahmed,
      chairId: "chair_a1",
      visitType: "كشف",
      date: "2026-11-08",
      time: "09:00",
      durationMin: 30,
      adminNote: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toContain("دانا");
  });

  it("لا يتيح للمحاسب أو الإدارة أو المزوّد أو التاجر قراءة الملف السريري", () => {
    const db = createDatabase();
    for (const id of [IDS.accountant, IDS.admin, IDS.providerRadio, IDS.merchantA]) {
      expect(() => getPatient(db, actor(db, id), IDS.patientA1)).toThrowError(
        expect.objectContaining({ code: "FORBIDDEN" }),
      );
    }
  });

  it("يعرض للاستقبال بيانات التواصل فقط", () => {
    const db = createDatabase();
    const view = getPatient(db, actor(db, IDS.reception), IDS.patientA1);
    expect(view.access).toBe("desk");
    expect("medicalHistory" in view).toBe(false);
    expect(JSON.stringify(view)).not.toContain("بنسلين");
  });

  it("يتجاهل التاريخ الطبي إذا أدخله الاستقبال", () => {
    const db = createDatabase();
    const result = createPatient(db, actor(db, IDS.reception), {
      name: "مريض تجريبي جديد",
      phone: "07701234567",
      sex: "male",
      birthYear: 1990,
      fileNumber: "A-2000",
      medicalHistory: "معلومة يجب ألا تُحفظ",
      allergies: "سر",
      notes: "ملاحظة سريرية",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.medicalHistory).toBe("");
      expect(result.data.clinicId).toBe(IDS.clinicA);
      expect(result.data.allergies).toBe("");
    }
  });
});

describe("المختبر المركزي الواحد", () => {
  it("لا يمرر الملاحظات السريرية أو اسم المريض إلى المختبر", () => {
    const db = createDatabase();
    const view = getLabOrder(db, actor(db, IDS.labManager), IDS.labA);
    expect(view.audience).toBe("lab");
    expect("clinicalNotes" in view).toBe(false);
    expect("patientId" in view).toBe(false);
    const raw = JSON.stringify(view);
    expect(raw).not.toContain("بنسلين");
    expect(raw).not.toContain("خط الإنهاء");
    expect(raw).not.toContain("07700001042");
    for (const name of names) expect(raw).not.toContain(name);
    expect(view.clinicName).toContain("النور");
    expect("patientName" in view).toBe(false);
  });

  it("يمنع عيادة من فتح طلب مختبر عيادة أخرى ويمنع الفني من غير المكلّف", () => {
    const db = createDatabase();
    expect(() => getLabOrder(db, actor(db, IDS.ahmed), IDS.labB)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    expect(() => getLabOrder(db, actor(db, IDS.labTech), IDS.labInbox)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    expect(() => getLabOrder(db, actor(db, IDS.labTech), IDS.labB)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    const assigned = getLabOrder(db, actor(db, IDS.labTech), IDS.labA);
    expect(assigned.audience).toBe("lab");
  });

  it("يبقي اعتماد التصميم عند طبيب العيادة", () => {
    const db = createDatabase();
    expect(() => transitionLab(db, actor(db, IDS.labManager), IDS.labApproval, "manufacturing")).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    const doctor = transitionLab(db, actor(db, IDS.layla), IDS.labApproval, "manufacturing");
    expect(doctor.ok).toBe(true);
  });

  it("ينشئ كل الطلبات على المختبر المركزي فقط", () => {
    const db = createDatabase();
    const created = createLabOrder(db, actor(db, IDS.ahmed), {
      link: "case",
      caseId: IDS.caseA,
      workType: "تاج",
      teeth: ["16"],
      shade: "A2",
      material: "زركونيا",
      dueAt: "2026-11-20",
      priority: "normal",
      shareConsent: true,
      attachments: [],
    });
    expect(created.ok).toBe(true);
    if (created.ok) expect(created.data.labId).toBe(CENTRAL_LAB_ID);
    expect(db.labOrders.every((order) => order.labId === CENTRAL_LAB_ID)).toBe(true);
  });

  it("يعرض للمحاسب الفاتورة دون الملفات السريرية", () => {
    const db = createDatabase();
    const view = getLabOrder(db, actor(db, IDS.accountant), IDS.labA);
    expect(view.audience).toBe("clinic_finance");
    expect(view.invoice?.amountIqd).toBe(450_000);
    expect("clinicalNotes" in view).toBe(false);
    expect(view.attachments).toBeUndefined();
  });
});

describe("المتاجر", () => {
  it("يمنع التاجر من طلب متجر آخر ومن تعديل منتج غيره", () => {
    const db = createDatabase();
    expect(() => getMerchantOrder(db, actor(db, IDS.merchantA), IDS.orderUnpaid)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    expect(() => saveProduct(db, actor(db, IDS.merchantA), {
      id: IDS.prodLed,
      name: "تغيير غير مسموح",
      brand: "x",
      category: "x",
      priceIqd: 10,
      stock: 1,
      unit: "وحدة",
      sku: "x",
      description: "",
    })).toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("لا يضع هوية المريض أو ربط الحالة في بيانات التنفيذ", () => {
    const db = createDatabase();
    const view = getMerchantOrder(db, actor(db, IDS.merchantA), IDS.orderPaid);
    expect("caseId" in view).toBe(false);
    expect("patientId" in view).toBe(false);
    const raw = JSON.stringify(view);
    for (const name of names) expect(raw).not.toContain(name);
    expect(raw).not.toContain("07700001042");
    expect(raw).not.toContain("بنسلين");
  });

  it("لا يسمح للعيادة بتغيير حالة التجهيز الخاصة بالتاجر", () => {
    const db = createDatabase();
    expect(() => transitionCommerce(db, actor(db, IDS.ahmed), IDS.orderUnpaid, "shipped")).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("تقرير التاجر لا يحتوي أسماء مرضى", () => {
    const db = createDatabase();
    const report = merchantReport(db, actor(db, IDS.merchantA));
    const raw = JSON.stringify(report);
    for (const name of names) expect(raw).not.toContain(name);
  });
});

describe("المصاريف", () => {
  it("يحتسب المدفوع مرة واحدة ويتجاهل القيد المكرر وغير المدفوع والتقديري", () => {
    const db = createDatabase();
    const { summary } = expenseLedger(db, actor(db, IDS.ahmed));
    expect(summary.settledIqd).toBe(1_500_000 + 170_000 + 275_000);
    expect(summary.unpaidIqd).toBe(90_000 + 450_000);
    expect(summary.estimatedIqd).toBe(200_000);
    expect(summary.collapsedSources).toBe(1);
  });

  it("إذا وُجد قيد إنشاء وقيد دفع لنفس المصدر يُحتسب المدفوع فقط", () => {
    const expenses: Expense[] = [
      {
        id: "1",
        clinicId: "c",
        category: "purchase",
        bucket: "unpaid",
        amountIqd: 100,
        description: "عند الإنشاء",
        sourceType: "commerce_order",
        sourceId: "same",
        occurredOn: "2026-11-01",
      },
      {
        id: "2",
        clinicId: "c",
        category: "purchase",
        bucket: "paid",
        amountIqd: 100,
        description: "عند الدفع",
        sourceType: "commerce_order",
        sourceId: "same",
        occurredOn: "2026-11-02",
      },
    ];
    expect(summarizeExpenses(expenses)).toMatchObject({ settledIqd: 100, unpaidIqd: 0, estimatedIqd: 0 });
  });
});

describe("المواعيد", () => {
  it("يمنع تعارض الطبيب أو الكرسي ولا يمنع موعد عيادة أخرى", () => {
    const db = createDatabase();
    const ahmed = actor(db, IDS.ahmed);
    const sameDoctor = createAppointment(db, ahmed, {
      patientId: IDS.patientA2,
      doctorId: IDS.ahmed,
      chairId: "chair_a2",
      visitType: "كشف",
      date: "2026-11-05",
      time: "09:15",
      durationMin: 30,
      adminNote: "",
    });
    expect(sameDoctor.ok).toBe(false);
    if (!sameDoctor.ok) expect(sameDoctor.error).not.toContain("نور");

    const sameChair = createAppointment(db, ahmed, {
      patientId: IDS.patientA2,
      doctorId: IDS.layla,
      chairId: "chair_a1",
      visitType: "كشف",
      date: "2026-11-05",
      time: "09:15",
      durationMin: 30,
      adminNote: "",
    });
    expect(sameChair.ok).toBe(false);

    const clear = createAppointment(db, ahmed, {
      patientId: IDS.patientA2,
      doctorId: IDS.layla,
      chairId: "chair_a2",
      visitType: "كشف",
      date: "2026-11-05",
      time: "09:15",
      durationMin: 30,
      adminNote: "",
    });
    expect(clear.ok).toBe(true);
  });

  it("يتجاهل الموعد الملغى عند فحص التعارض", () => {
    const db = createDatabase();
    setAppointmentStatus(db, actor(db, IDS.ahmed), IDS.apptA1, "cancelled");
    const result = createAppointment(db, actor(db, IDS.ahmed), {
      patientId: IDS.patientA2,
      doctorId: IDS.ahmed,
      chairId: "chair_a1",
      visitType: "كشف",
      date: "2026-11-05",
      time: "09:00",
      durationMin: 30,
      adminNote: "",
    });
    expect(result.ok).toBe(true);
  });
});

describe("المجتمع", () => {
  it("يرفض الهاتف ورقم الملف واسم المريض وملف المسح ويبقي المنشور قيد المراجعة", () => {
    const db = createDatabase();
    const ahmed = actor(db, IDS.ahmed);
    const samples = [
      "هذا نقاش عن حالة والمريض رقمه 07700001042 اليوم",
      "أرجو مراجعة ملف A-1042 قبل التعليق",
      "هذه حالة نور الهدى عبد الله بعد التحضير",
      "أرفقت scan.stl للتعليق",
    ];
    for (const body of samples) {
      const result = createPost(db, ahmed, { body, specialty: "تعويضات", tags: [] });
      expect(result.ok).toBe(false);
    }
    const accepted = createPost(db, ahmed, {
      body: "ما البروتوكول الذي تتبعونه لتوثيق لون التاج داخل العيادة من غير صور مرضى؟",
      specialty: "تعويضات",
      tags: ["تاج"],
    });
    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.data.status).toBe("pending_review");
      expect(listFeed(db, ahmed).some((post) => post.id === accepted.data.id)).toBe(true);
      expect(listFeed(db, actor(db, IDS.sara)).some((post) => post.id === accepted.data.id)).toBe(false);
    }
  });
});

describe("المخزون والإدارة", () => {
  it("لا يكرر حركة الاستلام", () => {
    const db = createDatabase();
    const beforeQty = db.inventory.find((item) => item.id === "stk_zir")!.quantity;
    const beforeMoves = db.movements.length;
    const first = receiveCommerceOrder(db, actor(db, IDS.ahmed), IDS.orderPaid);
    const second = receiveCommerceOrder(db, actor(db, IDS.ahmed), IDS.orderPaid);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(db.inventory.find((item) => item.id === "stk_zir")!.quantity).toBe(beforeQty);
    expect(db.movements.length).toBe(beforeMoves);
  });

  it("لوحة الإدارة تشغيلية ولا تعرض الأسماء الطبية", () => {
    const db = createDatabase();
    getPatient(db, actor(db, IDS.ahmed), IDS.patientA1);
    const admin = actor(db, IDS.admin);
    const raw = JSON.stringify({
      analytics: analytics(db, admin),
      support: listSupport(db, admin),
      audit: listAudit(db, admin),
    });
    for (const name of names) expect(raw).not.toContain(name);
    expect(raw).not.toContain("بنسلين");
    expect(raw).not.toContain(IDS.patientA1);
    expect(raw).toContain("مخفي");
  });

  it("مزود الأشعة لا يرى اسم المريض داخل الطلب", () => {
    const db = createDatabase();
    const view = getProviderOrder(db, actor(db, IDS.providerRadio), IDS.svcCbct);
    expect(view.audience).toBe("provider");
    expect(view.patientName).toBeUndefined();
    const raw = JSON.stringify(view);
    for (const name of names) expect(raw).not.toContain(name);
  });

  it("ينشئ قيداً مالياً واحداً عند إتمام الشراء", () => {
    const db = createDatabase();
    const result = checkout(db, actor(db, IDS.ahmed), {
      address: "عيادة النور، الكرادة داخل",
      paymentMethod: "cod",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      const id = result.data[0].id;
      expect(db.expenses.filter((expense) => expense.sourceId === id)).toHaveLength(1);
      expect(db.expenses.find((expense) => expense.sourceId === id)?.bucket).toBe("unpaid");
    }
  });
});

describe("مركز الحالة", () => {
  it("يفصل المدفوع والمستحق والتقديري", () => {
    const db = createDatabase();
    const hub = getCaseHub(db, actor(db, IDS.ahmed), IDS.caseA);
    expect(hub.costs.paid).toBe(85_000);
    expect(hub.costs.unpaid).toBe(450_000);
    expect(hub.costs.estimated).toBe(200_000);
    expect(() => getCaseHub(db, actor(db, IDS.sara), IDS.caseA)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });
});
