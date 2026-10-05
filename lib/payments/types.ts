export type GatewayId = "click" | "payme" | "uzum" | "stripe";

export interface CheckoutInput {
  orderId: string;          // booking code (USG-xxxxxx) or subscription id
  amount: number;           // in UZS (or USD cents for stripe)
  currency: "UZS" | "USD";
  description: string;
  returnUrl: string;
  customerPhone?: string;
}

export interface CheckoutResult { redirectUrl: string; externalId?: string }

export interface PaymentGateway {
  id: GatewayId;
  isConfigured(): boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}

/** Normalised result every webhook handler produces → persisted by `recordPaymentEvent` */
export interface PaymentEvent {
  gateway: GatewayId;
  orderId: string;
  externalId: string;
  amount: number;
  status: "pending" | "succeeded" | "failed" | "refunded";
  raw: unknown;
}
