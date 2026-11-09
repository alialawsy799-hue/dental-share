import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Denied } from "@/components/kit";
import { AccessError } from "@/lib/domain/errors";

export function accessResponse(error: unknown): ReactNode {
  if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
  if (error instanceof AccessError && error.code === "FORBIDDEN") return <Denied message={error.message} />;
  throw error;
}
