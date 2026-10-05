"use client";
/**
 * Data-access layer. When Supabase env vars are set every store action is mirrored to PostgreSQL
 * (tables in supabase/migrations/0001_init.sql, protected by RLS). Without env vars the app runs in
 * DEMO mode and the zustand store (localStorage) is the source of truth.
 */
import { getSupabase, isSupabaseEnabled } from "./client";
import type { Booking, BookingStatus, Message, Provider, ProviderApplication, Review } from "@/lib/types";

const sb = () => getSupabase();
const log = (op: string) => ({ error }: { error: unknown }) => { if (error) console.warn(`[supabase] ${op}`, error); };

export const repo = {
  enabled: isSupabaseEnabled,

  async signIn(email: string, password: string) {
    return sb()?.auth.signInWithPassword({ email, password });
  },
  async signUp(email: string, password: string, meta: { full_name: string; phone?: string; role: "customer" | "provider" }) {
    return sb()?.auth.signUp({ email, password, options: { data: meta } });
  },
  async signInWithOtp(phone: string) {
    return sb()?.auth.signInWithOtp({ phone });
  },
  async signOut() {
    await sb()?.auth.signOut();
  },

  async toggleFavorite(providerId: string, on: boolean) {
    const c = sb(); if (!c) return;
    const { data } = await c.auth.getUser(); if (!data.user) return;
    if (on) await c.from("favorites").insert({ user_id: data.user.id, provider_id: providerId }).then(log("favorites.insert"));
    else await c.from("favorites").delete().match({ user_id: data.user.id, provider_id: providerId }).then(log("favorites.delete"));
  },

  async createBooking(b: Booking) {
    const c = sb(); if (!c) return;
    await c.from("bookings").insert({
      code: b.id, provider_id: b.providerId, service_id: b.serviceId, description: b.description, address: b.address,
      city_slug: b.citySlug, scheduled_date: b.date, scheduled_time: b.time, price: b.price, service_fee: b.fee,
      discount: b.discount, total: b.total, promo_code: b.promoCode ?? null, payment_method: b.paymentMethod,
      customer_name: b.customerName, customer_phone: b.customerPhone, photos: b.photos.length,
    }).then(log("bookings.insert"));
  },

  async updateBookingStatus(code: string, status: BookingStatus) {
    await sb()?.from("bookings").update({ status }).eq("code", code).then(log("bookings.update"));
  },

  async createReview(r: Review) {
    // RLS + trigger `reviews_require_completed_booking` guarantee the booking is completed & owned by the author
    await sb()?.from("reviews").insert({
      booking_code: r.bookingId, provider_id: r.providerId, rating: r.rating, quality: r.quality,
      communication: r.communication, price: r.price, punctuality: r.punctuality, body: r.text,
    }).then(log("reviews.insert"));
  },

  async sendMessage(m: Message) {
    await sb()?.from("messages").insert({
      conversation_id: m.conversationId, kind: m.kind, body: m.text ?? null, image_path: m.image?.startsWith("data:") ? null : m.image ?? null,
      location: m.location ?? null, booking_code: m.bookingId ?? null,
    }).then(log("messages.insert"));
  },

  /** Realtime subscription for chat (Supabase Realtime / postgres_changes). */
  subscribeToConversation(conversationId: string, onInsert: (row: Record<string, unknown>) => void) {
    const c = sb(); if (!c) return () => {};
    const ch = c.channel(`conv:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (p) => onInsert(p.new))
      .subscribe();
    return () => { void c.removeChannel(ch); };
  },

  async submitApplication(a: ProviderApplication) {
    await sb()?.from("provider_applications").insert({
      full_name: a.name, phone: a.phone, city_slug: a.citySlug, category_id: a.categoryId, services_text: a.services,
      experience_years: a.experienceYears, price_from: a.priceFrom, description: a.description,
      working_hours: a.hours, document_name: a.documentName,
    }).then(log("provider_applications.insert"));
  },

  async reviewApplication(id: string, status: "approved" | "rejected") {
    await sb()?.rpc("review_provider_application", { application_id: id, decision: status }).then(log("rpc.review_provider_application"));
  },

  async updateProvider(id: string, patch: Partial<Provider>) {
    const row: Record<string, unknown> = {};
    if (patch.status) row.status = patch.status;
    if (patch.about) row.about = patch.about;
    if (patch.priceFrom) row.price_from = patch.priceFrom;
    if (patch.availability) row.weekly_hours = patch.availability;
    if (Object.keys(row).length) await sb()?.from("providers").update(row).eq("slug", id).then(log("providers.update"));
  },

  async uploadFile(bucket: "avatars" | "portfolio" | "booking-photos" | "provider-documents" | "chat", file: File) {
    const c = sb(); if (!c) return null;
    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await c.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) { console.warn(error); return null; }
    return bucket === "provider-documents" ? path : c.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
};
