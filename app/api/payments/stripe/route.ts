import { NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { recordPaymentEvent } from "@/lib/payments";

export async function POST(req: Request) {
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"))) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const evt = JSON.parse(payload) as { type: string; data: { object: { id: string; client_reference_id?: string; amount_total?: number; metadata?: { order_id?: string } } } };
  const o = evt.data.object;
  const orderId = o.metadata?.order_id ?? o.client_reference_id ?? "";
  if (evt.type === "checkout.session.completed") await recordPaymentEvent({ gateway: "stripe", orderId, externalId: o.id, amount: (o.amount_total ?? 0) / 100, status: "succeeded", raw: evt });
  if (evt.type === "charge.refunded") await recordPaymentEvent({ gateway: "stripe", orderId, externalId: o.id, amount: 0, status: "refunded", raw: evt });
  return NextResponse.json({ received: true });
}
