import "server-only";
import { click } from "./click";
import { payme } from "./payme";
import { uzum } from "./uzum";
import { stripe } from "./stripe";
import type { GatewayId, PaymentEvent, PaymentGateway } from "./types";
import { getServiceSupabase } from "@/lib/supabase/server";

export const GATEWAYS: Record<GatewayId, PaymentGateway> = { click, payme, uzum, stripe };

/** Persist a normalised payment event: payments row + booking payment_status (idempotent on gateway+external_id). */
export async function recordPaymentEvent(e: PaymentEvent) {
  const db = getServiceSupabase();
  if (!db) { console.info("[payments] demo mode — event", e.gateway, e.orderId, e.status); return; }
  await db.from("payment_events").insert({ gateway: e.gateway, external_id: e.externalId, order_code: e.orderId, status: e.status, amount: e.amount, payload: e.raw });
  await db.from("payments").upsert({ gateway: e.gateway, external_id: e.externalId, booking_code: e.orderId, amount: e.amount, status: e.status }, { onConflict: "gateway,external_id" });
  if (e.status === "succeeded") await db.from("bookings").update({ payment_status: "held" }).eq("code", e.orderId);
  if (e.status === "refunded") await db.from("bookings").update({ payment_status: "refunded" }).eq("code", e.orderId);
}

export async function findBookingAmount(orderId: string): Promise<number | null> {
  const db = getServiceSupabase();
  if (!db) return null;
  const { data } = await db.from("bookings").select("total").eq("code", orderId).maybeSingle();
  return data ? Number(data.total) : null;
}
