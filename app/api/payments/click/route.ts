import { NextResponse } from "next/server";
import { CLICK_ERRORS, verifyClickSign, type ClickRequest } from "@/lib/payments/click";
import { findBookingAmount, recordPaymentEvent } from "@/lib/payments";

/** Click SHOP-API callback: action=0 Prepare, action=1 Complete (application/x-www-form-urlencoded). */
export async function POST(req: Request) {
  const r = Object.fromEntries((await req.formData()).entries()) as unknown as ClickRequest;
  const reply = (error: number, note: string, extra: Record<string, unknown> = {}) =>
    NextResponse.json({ click_trans_id: r.click_trans_id, merchant_trans_id: r.merchant_trans_id, error, error_note: note, ...extra });
  if (!verifyClickSign(r)) return reply(CLICK_ERRORS.SIGN, "SIGN CHECK FAILED");
  const expected = await findBookingAmount(r.merchant_trans_id);
  if (expected !== null && Math.abs(expected - Number(r.amount)) > 1) return reply(CLICK_ERRORS.AMOUNT, "Incorrect amount");
  if (r.action === "0") return reply(CLICK_ERRORS.OK, "Success", { merchant_prepare_id: Date.now() });
  if (r.action === "1") {
    const ok = r.error === "0";
    await recordPaymentEvent({ gateway: "click", orderId: r.merchant_trans_id, externalId: r.click_trans_id, amount: Number(r.amount), status: ok ? "succeeded" : "failed", raw: r });
    return reply(ok ? CLICK_ERRORS.OK : CLICK_ERRORS.CANCELLED, ok ? "Success" : "Cancelled", { merchant_confirm_id: Date.now() });
  }
  return reply(CLICK_ERRORS.ACTION, "Action not found");
}
