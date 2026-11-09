import { ClinicCreateForm } from "@/components/forms/clinic-create-form";
import { Card, GhostLink, PageIntro } from "@/components/kit";

export default function NewClinicPage() {
  return (
    <div>
      <PageIntro
        eyebrow="تسجيل عيادة"
        title="عيادة جديدة"
        description="يُنشأ إيميل نظام الحجوزات وحساب لطبيب العيادة على نفس الملف. إيميل العيادة يفتح /desk، وحساب الطبيب يفتح /app."
        action={<GhostLink href="/admin/clinics">العودة للعيادات</GhostLink>}
      />
      <Card>
        <ClinicCreateForm />
      </Card>
    </div>
  );
}
