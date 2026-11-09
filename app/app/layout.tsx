import { DoctorShell } from "@/components/shell";
import { requireRoles } from "@/lib/demo/session";
import type { Role } from "@/lib/domain/types";
import { getLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const roles: Role[] = ["clinic_owner", "clinic_doctor", "clinic_reception", "clinic_accountant"];

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  await requireRoles(roles);
  const lang = await getLang();
  return <DoctorShell lang={lang}>{children}</DoctorShell>;
}
