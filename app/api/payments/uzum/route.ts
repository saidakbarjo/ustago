import { NextResponse } from "next/server";
import { recordPaymentEvent } from "@/lib/payments";

/** Uzum Bank status callback. Validate the shared API key header before trusting the payload. */
export async function POST(req: Request) {
  if (req.headers.get("x-api-key") !== process.env.UZUM_API_KEY) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = (await req.json()) as { orderId: string; orderNumber: string; status: string; amount: number };
  const status = b.status === "COMPLETED" || b.status === "AUTHORIZED" ? "succeeded" : b.status === "REFUNDED" || b.status === "REVERSED" ? "refunded" : b.status === "DECLINED" ? "failed" : "pending";
  await recordPaymentEvent({ gateway: "uzum", orderId: b.orderNumber, externalId: b.orderId, amount: b.amount / 100, status, raw: b });
  return NextResponse.json({ ok: true });
}
