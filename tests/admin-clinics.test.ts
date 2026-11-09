import { describe, expect, it } from "vitest";
import {
  createClinicWithAccess,
  getClinicDossier,
  listClinicDossiers,
  migrateClinicDeskAccounts,
  provisionClinicAccess,
} from "@/lib/domain/admin";
import { createAppointment, listAppointments, listDoctors } from "@/lib/domain/appointments";
import { AccessError } from "@/lib/domain/errors";
import { dedupeById, uid } from "@/lib/domain/guard";
import { createManualExpense } from "@/lib/domain/expenses";
import { listInventory } from "@/lib/domain/inventory";
import { createPatient, registerDeskPatient } from "@/lib/domain/patients";
import { createDatabase } from "@/lib/domain/seed";
import { DEMO_TODAY, DESK_PERMISSIONS, homeForRole, IDS, toActor, type Actor, type Database } from "@/lib/domain/types";

function actor(db: Database, id: string): Actor {
  const user = db.users.find((item) => item.id === id);
  if (!user) throw new Error(`missing ${id}`);
  return toActor(user);
}

const patientNames = ["نور الهدى عبد الله", "حسين مازن كريم", "رنا صالح مهدي", "دانا كمال رشيد"];

describe("إدارة العيادات من المنصة", () => {
  it("يعرض ملفات العيادات بلا أسماء مرضى أو ملاحظات طبية", () => {
    const db = createDatabase();
    const raw = JSON.stringify(listClinicDossiers(db, actor(db, IDS.admin)));
    for (const name of patientNames) expect(raw).not.toContain(name);
    expect(raw).not.toContain("بنسلين");
    expect(raw).toContain("عيادة النور");
    expect(raw).toContain("عيادة الشمس");
  });

  it("ينشئ عيادة مع إيميل نظام وحساب طبيب يمكن الدخول به", () => {
    const db = createDatabase();
    const result = createClinicWithAccess(db, actor(db, IDS.admin), {
      name: "عيادة الأمل",
      city: "البصرة",
      district: "العشار",
      phone: "07710003003",
      address: "العشار، شارع تجريبي 8",
      doctorName: "د. كريم وائل",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const clinic = db.clinics.find((item) => item.id === result.data.id);
    expect(clinic?.systemEmail).toMatch(/amal\.clinic\d*@dentalshare\.demo/);
    expect(clinic?.access?.doctorEmail).toMatch(/dr\.amal\d*@dentalshare\.demo/);
    expect(db.users.some((user) => user.email === clinic?.systemEmail && user.password === clinic?.access?.systemPassword)).toBe(true);
    const desk = db.users.find((user) => user.email === clinic?.systemEmail);
    const doctor = db.users.find((user) => user.email === clinic?.access?.doctorEmail);
    expect(desk?.role).toBe("clinic_desk");
    expect(desk?.permissions).toEqual(DESK_PERMISSIONS);
    expect(doctor?.role).toBe("clinic_owner");
    expect(homeForRole(desk!.role)).toBe("/desk");
    expect(homeForRole(doctor!.role)).toBe("/app");
    expect(listDoctors(db, toActor(desk!)).map((item) => item.id)).toEqual([doctor!.id]);
    const dossier = getClinicDossier(db, actor(db, IDS.admin), result.data.id);
    expect(dossier.ok).toBe(true);
    if (dossier.ok) {
      const raw = JSON.stringify(dossier.data);
      for (const name of patientNames) expect(raw).not.toContain(name);
    }
  });

  it("ينشئ إيميل نظام وحساب طبيب لعيادة قائمة دون المساس بحساب المالك الحالي", () => {
    const db = createDatabase();
    const before = db.users.filter((user) => user.clinicId === IDS.clinicA).length;
    const result = provisionClinicAccess(db, actor(db, IDS.admin), {
      clinicId: IDS.clinicA,
      doctorName: "د. هدى سالم",
    });
    expect(result.ok).toBe(true);
    expect(db.users.filter((user) => user.clinicId === IDS.clinicA).length).toBe(before + 2);
    expect(db.users.find((user) => user.id === IDS.ahmed)?.email).toBe("ahmed@dentalshare.demo");
    const clinic = db.clinics.find((item) => item.id === IDS.clinicA);
    expect(clinic?.systemEmail).toMatch(/noor\.clinic/);
    expect(db.users.find((user) => user.email === clinic?.systemEmail)?.role).toBe("clinic_desk");
    expect(db.users.find((user) => user.email === clinic?.access?.doctorEmail)?.role).toBe("clinic_doctor");
    expect(db.users.find((user) => user.id === IDS.ahmed)?.role).toBe("clinic_owner");
  });

  it("يرفض بريداً مكرراً ويمنع الطبيب من إنشاء عيادات المنصة", () => {
    const db = createDatabase();
    const duplicate = provisionClinicAccess(db, actor(db, IDS.admin), {
      clinicId: IDS.clinicA,
      doctorName: "د. هدى سالم",
      doctorEmail: "ahmed@dentalshare.demo",
    });
    expect(duplicate.ok).toBe(false);
    expect(() =>
      createClinicWithAccess(db, actor(db, IDS.ahmed), {
        name: "عيادة تجريبية",
        city: "بغداد",
        district: "المنصور",
        phone: "07710004004",
        address: "المنصور شارع 1",
        doctorName: "د. سامي ناجي",
      }),
    ).toThrow(AccessError);
  });

  it("يحوّل حساب نظام العيادة القديم إلى نظام الحجوزات دون المساس بالطبيب", () => {
    const db = createDatabase();
    const owner = db.users.find((user) => user.id === IDS.ahmed);
    expect(owner?.role).toBe("clinic_owner");
    db.users.push({
      ...owner!,
      id: "user_old_system",
      email: "noor.clinic@dentalshare.demo",
      name: "عيادة النور",
      title: "حساب نظام العيادة",
      permissions: owner!.permissions,
    });
    migrateClinicDeskAccounts(db);
    expect(db.users.find((user) => user.id === "user_old_system")?.role).toBe("clinic_desk");
    expect(db.users.find((user) => user.id === IDS.ahmed)?.role).toBe("clinic_owner");
  });

  it("يظهر حجز نظام العيادة في حساب الطبيب لنفس العيادة", () => {
    const db = createDatabase();
    const created = createClinicWithAccess(db, actor(db, IDS.admin), {
      name: "عيادة البيان",
      city: "النجف",
      district: "الكوفة",
      phone: "07710005005",
      address: "الكوفة شارع 4",
      doctorName: "د. باقر نوري",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const clinic = db.clinics.find((item) => item.id === created.data.id);
    const deskUser = db.users.find((user) => user.email === clinic?.systemEmail);
    const doctorUser = db.users.find((user) => user.email === clinic?.access?.doctorEmail);
    const chair = db.chairs.find((item) => item.clinicId === clinic?.id);
    expect(deskUser && doctorUser && chair).toBeTruthy();
    if (!deskUser || !doctorUser || !chair) return;
    const patient = createPatient(db, toActor(deskUser), {
      name: "حسن علي كاظم",
      phone: "07719998888",
      sex: "male",
      birthYear: "1990",
      fileNumber: "D-1",
    });
    expect(patient.ok).toBe(true);
    if (!patient.ok) return;
    const booked = createAppointment(db, toActor(deskUser), {
      patientId: patient.data.id,
      doctorId: doctorUser.id,
      chairId: chair.id,
      visitType: "كشف",
      date: DEMO_TODAY,
      time: "14:00",
      durationMin: 30,
      adminNote: "",
    });
    expect(booked.ok).toBe(true);
    if (!booked.ok) return;
    const doctorDay = listAppointments(db, toActor(doctorUser));
    expect(doctorDay.some((item) => item.id === booked.data.id)).toBe(true);
    expect(doctorDay[0]?.clinicId).toBe(clinic?.id);
    const gloves = listInventory(db, toActor(deskUser)).find((item) => item.sku === "desk:glove");
    expect(gloves).toBeTruthy();
    expect((gloves?.quantity ?? 0) < 24).toBe(true);
  });

  it("يسجّل المريض بالاسم والهاتف ويحفظ الصرفة من الدخل أو من الخارج", () => {
    const db = createDatabase();
    const created = createClinicWithAccess(db, actor(db, IDS.admin), {
      name: "عيادة الريان",
      city: "كربلاء",
      district: "الحسين",
      phone: "07710006006",
      address: "الحسين شارع 2",
      doctorName: "د. زيد كاظم",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const clinic = db.clinics.find((item) => item.id === created.data.id);
    const deskUser = db.users.find((user) => user.email === clinic?.systemEmail);
    expect(deskUser).toBeTruthy();
    if (!deskUser) return;
    const desk = toActor(deskUser);
    const patient = registerDeskPatient(db, desk, { name: "منى جاسم علي", phone: "07715554444" });
    expect(patient.ok).toBe(true);
    if (patient.ok) {
      expect(patient.data.phone).toBe("07715554444");
      expect(patient.data.fileNumber).toMatch(/^D-/);
    }
    const expense = createManualExpense(db, desk, {
      description: "شراء مواد تعقيم",
      amountIqd: 25000,
      bucket: "paid",
      category: "operating",
      occurredOn: DEMO_TODAY,
      fundFrom: "external",
    });
    expect(expense.ok).toBe(true);
    if (expense.ok) expect(expense.data.fundFrom).toBe("external");
  });

  it("يمنع تكرار معرّفات الحجوزات بعد إعادة ضبط العدّاد", () => {
    const first = uid("appt");
    const second = uid("appt");
    expect(first).not.toBe(second);
    const rows = [{ id: "appt_rt" }, { id: "appt_rt" }, { id: "appt_a_1" }];
    dedupeById(rows, "appt");
    expect(new Set(rows.map((row) => row.id)).size).toBe(3);
    expect(rows[0]?.id).toBe("appt_rt");
    expect(rows[2]?.id).toBe("appt_a_1");
  });
});
