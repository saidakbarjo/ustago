import { NextResponse } from "next/server";
import { PAYME_ERRORS, verifyPaymeAuth } from "@/lib/payments/payme";
import { findBookingAmount, recordPaymentEvent } from "@/lib/payments";

type RpcReq = { id: number; method: string; params: Record<string, unknown> & { account?: { order_id?: string }; amount?: number; id?: string; time?: number } };

/** Payme Merchant API (JSON-RPC 2.0). */
export async function POST(req: Request) {
  const body = (await req.json()) as RpcReq;
  const ok = (result: unknown) => NextResponse.json({ jsonrpc: "2.0", id: body.id, result });
  const err = (e: { code: number; message: unknown }) => NextResponse.json({ jsonrpc: "2.0", id: body.id, error: e });
  if (!verifyPaymeAuth(req.headers.get("authorization"))) return err(PAYME_ERRORS.AUTH);
  const orderId = body.params.account?.order_id ?? "";
  switch (body.method) {
    case "CheckPerformTransaction": {
      const amount = await findBookingAmount(orderId);
      if (amount === null) return err(PAYME_ERRORS.ORDER);
      if (Math.round(amount * 100) !== body.params.amount) return err(PAYME_ERRORS.AMOUNT);
      return ok({ allow: true });
    }
    case "CreateTransaction":
      await recordPaymentEvent({ gateway: "payme", orderId, externalId: String(body.params.id), amount: (body.params.amount ?? 0) / 100, status: "pending", raw: body });
      return ok({ create_time: Date.now(), transaction: String(body.params.id), state: 1 });
    case "PerformTransaction":
      await recordPaymentEvent({ gateway: "payme", orderId, externalId: String(body.params.id), amount: 0, status: "succeeded", raw: body });
      return ok({ transaction: String(body.params.id), perform_time: Date.now(), state: 2 });
    case "CancelTransaction":
      await recordPaymentEvent({ gateway: "payme", orderId, externalId: String(body.params.id), amount: 0, status: "refunded", raw: body });
      return ok({ transaction: String(body.params.id), cancel_time: Date.now(), state: -2 });
    case "CheckTransaction":
      return ok({ transaction: String(body.params.id), state: 2, create_time: 0, perform_time: 0, cancel_time: 0, reason: null });
    case "GetStatement":
      return ok({ transactions: [] });
    default:
      return err(PAYME_ERRORS.METHOD);
  }
}
