"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/kit";

export function SubmitButton({
  children,
  pendingLabel = "جارٍ الحفظ…",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant)}>
      {pending ? pendingLabel : children}
    </button>
  );
}
