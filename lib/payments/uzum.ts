import type { PaymentGateway } from "./types";

/**
 * Uzum Bank — Checkout (acquiring) API. Register an order and redirect the customer to the returned payment page.
 * Webhook (status callback) is received at /api/payments/uzum.
 */
const env = () => ({ terminalId: process.env.UZUM_TERMINAL_ID ?? "", apiKey: process.env.UZUM_API_KEY ?? "", base: process.env.UZUM_API_URL ?? "https://checkout-key.inplat-tech.com/api/v1" });

export const uzum: PaymentGateway = {
  id: "uzum",
  isConfigured: () => Boolean(env().terminalId && env().apiKey),
  async createCheckout({ orderId, amount, description, returnUrl }) {
    const { terminalId, apiKey, base } = env();
    const res = await fetch(`${base}/payment/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Terminal-Id": terminalId, "X-API-Key": apiKey },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 860, orderNumber: orderId, viewType: "REDIRECT", sessionTimeoutSecs: 1800, successUrl: returnUrl, failureUrl: returnUrl, clientId: orderId, paymentDetails: description }),
    });
    if (!res.ok) throw new Error(`Uzum register failed: ${res.status}`);
    const data = (await res.json()) as { result?: { orderId: string; paymentRedirectUrl: string } };
    return { redirectUrl: data.result?.paymentRedirectUrl ?? returnUrl, externalId: data.result?.orderId };
  },
};
