import crypto from "node:crypto";
import type { PaymentGateway } from "./types";

/** International cards (Visa/Mastercard) & subscriptions in USD via Stripe Checkout — no SDK dependency, plain REST. */
const key = () => process.env.STRIPE_SECRET_KEY ?? "";

export const stripe: PaymentGateway = {
  id: "stripe",
  isConfigured: () => Boolean(key()),
  async createCheckout({ orderId, amount, currency, description, returnUrl }) {
    const body = new URLSearchParams({
      mode: "payment", success_url: `${returnUrl}?status=success`, cancel_url: `${returnUrl}?status=cancel`, client_reference_id: orderId,
      "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(currency === "USD" ? Math.round(amount * 100) : Math.round(amount)),
      "line_items[0][price_data][product_data][name]": description, "metadata[order_id]": orderId,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
    const data = (await res.json()) as { url?: string; id?: string; error?: { message: string } };
    if (!res.ok || !data.url) throw new Error(data.error?.message ?? "Stripe error");
    return { redirectUrl: data.url, externalId: data.id };
  },
};

export function verifyStripeSignature(payload: string, header: string | null, tolerance = 300) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > tolerance) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1 ?? ""));
}
