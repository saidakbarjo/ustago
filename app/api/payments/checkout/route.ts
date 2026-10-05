import { NextResponse } from "next/server";
import { z } from "zod";
import { GATEWAYS } from "@/lib/payments";
import { SITE_URL } from "@/lib/utils";

const Body = z.object({ orderId: z.string().min(3), amount: z.number().positive(), currency: z.enum(["UZS", "USD"]).default("UZS"), gateway: z.enum(["click", "payme", "uzum", "stripe"]), description: z.string().default("USTAGO") });

/** POST /api/payments/checkout → { redirectUrl } */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { gateway, ...input } = parsed.data;
  const g = GATEWAYS[gateway];
  const returnUrl = `${SITE_URL}/dashboard/bookings`;
  if (!g.isConfigured()) return NextResponse.json({ demo: true, redirectUrl: returnUrl, message: `${gateway} is not configured — set env vars (see .env.example)` });
  try {
    return NextResponse.json(await g.createCheckout({ ...input, returnUrl }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
