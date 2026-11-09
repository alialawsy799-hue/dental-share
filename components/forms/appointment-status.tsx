import { setAppointmentStatusAction } from "@/lib/actions/clinic";
import { appointmentStatusLabel } from "@/lib/domain/labels";
import type { AppointmentStatus } from "@/lib/domain/types";

const STATUSES: AppointmentStatus[] = ["arrived", "cancelled", "no_show", "confirmed"];

export function AppointmentStatusForms({
  id,
  returnTo,
  date,
}: {
  id: string;
  returnTo: string;
  date?: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {STATUSES.map((status) => (
        <form key={status} action={setAppointmentStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="returnTo" value={returnTo} />
          {date ? <input type="hidden" name="date" value={date} /> : null}
          <button type="submit" className="rounded-full bg-mist px-3 py-1 text-xs font-bold">
            {appointmentStatusLabel[status]}
          </button>
        </form>
      ))}
    </div>
  );
}
