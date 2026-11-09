import { NextResponse } from "next/server";
import { getDb } from "@/lib/demo/db";
import { getActor } from "@/lib/demo/session";
import { getMerchantOrder } from "@/lib/domain/commerce";
import { AccessError } from "@/lib/domain/errors";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  const { id } = await context.params;
  try {
    const order = getMerchantOrder(getDb(), actor, id);
    return NextResponse.json(order, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "NOT_FOUND" ? 404 : 403;
      return NextResponse.json({ error: error.code, message: error.message }, { status, headers: { "Cache-Control": "private, no-store" } });
    }
    throw error;
  }
}
