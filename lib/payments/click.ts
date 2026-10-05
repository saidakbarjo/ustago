import crypto from "node:crypto";
import type { PaymentGateway } from "./types";

/**
 * Click (click.uz) — Merchant API ("SHOP API").
 * Flow: redirect user to my.click.uz/services/pay → Click calls our /api/payments/click with action=0 (Prepare) and action=1 (Complete).
 * Docs: https://docs.click.uz
 */
const env = () => ({ serviceId: process.env.CLICK_SERVICE_ID ?? "", merchantId: process.env.CLICK_MERCHANT_ID ?? "", secret: process.env.CLICK_SECRET_KEY ?? "" });

export const click: PaymentGateway = {
  id: "click",
  isConfigured: () => Boolean(env().serviceId && env().merchantId && env().secret),
  async createCheckout({ orderId, amount, returnUrl }) {
    const { serviceId, merchantId } = env();
    const q = new URLSearchParams({ service_id: serviceId, merchant_id: merchantId, amount: amount.toFixed(2), transaction_param: orderId, return_url: returnUrl });
    return { redirectUrl: `https://my.click.uz/services/pay?${q}` };
  },
};

export interface ClickRequest {
  click_trans_id: string; service_id: string; click_paydoc_id: string; merchant_trans_id: string; merchant_prepare_id?: string;
  amount: string; action: string; error: string; error_note: string; sign_time: string; sign_string: string;
}

export function verifyClickSign(r: ClickRequest) {
  const { secret } = env();
  const base = r.action === "1"
    ? `${r.click_trans_id}${r.service_id}${secret}${r.merchant_trans_id}${r.merchant_prepare_id}${r.amount}${r.action}${r.sign_time}`
    : `${r.click_trans_id}${r.service_id}${secret}${r.merchant_trans_id}${r.amount}${r.action}${r.sign_time}`;
  return crypto.createHash("md5").update(base).digest("hex") === r.sign_string;
}

export const CLICK_ERRORS = { OK: 0, SIGN: -1, AMOUNT: -2, ACTION: -3, ALREADY_PAID: -4, NOT_FOUND: -5, TRANSACTION: -6, CANCELLED: -9 } as const;
