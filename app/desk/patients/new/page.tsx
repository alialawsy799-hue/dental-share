import { redirect } from "next/navigation";

export default function DeskNewPatientRedirect() {
  redirect("/desk/patients");
}
