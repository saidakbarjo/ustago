import type { PaymentGateway } from "./types";

/**
 * Payme (payme.uz) — Merchant API (JSON-RPC 2.0). Amounts are in tiyin (1 UZS = 100 tiyin).
 * Checkout: https://checkout.paycom.uz/<base64("m=<merchant>;ac.order_id=<id>;a=<amount_tiyin>;c=<return_url>")>
 * Docs: https://developer.help.paycom.uz
 */
const env = () => ({ merchantId: process.env.PAYME_MERCHANT_ID ?? "", key: process.env.PAYME_SECRET_KEY ?? "" });

export const payme: PaymentGateway = {
  id: "payme",
  isConfigured: () => Boolean(env().merchantId && env().key),
  async createCheckout({ orderId, amount, returnUrl }) {
    const params = `m=${env().merchantId};ac.order_id=${orderId};a=${Math.round(amount * 100)};c=${returnUrl}`;
    return { redirectUrl: `https://checkout.paycom.uz/${Buffer.from(params).toString("base64")}` };
  },
};

export function verifyPaymeAuth(header: string | null) {
  if (!header?.startsWith("Basic ")) return false;
  const [login, pass] = Buffer.from(header.slice(6), "base64").toString().split(":");
  return login === "Paycom" && pass === env().key;
}

export const PAYME_ERRORS = {
  AUTH: { code: -32504, message: "Insufficient privilege" },
  METHOD: { code: -32601, message: "Method not found" },
  AMOUNT: { code: -31001, message: "Incorrect amount" },
  ORDER: { code: -31050, message: { uz: "Buyurtma topilmadi", ru: "Заказ не найден", en: "Order not found" } },
  TRANSACTION: { code: -31003, message: "Transaction not found" },
  CANT_PERFORM: { code: -31008, message: "Unable to perform operation" },
} as const;
