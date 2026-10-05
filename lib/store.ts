"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useMemo, useState } from "react";
import type {
  AppNotification, AppUser, Booking, BookingStatus, Conversation, Message, Payment, PlanId, PromoCode, Provider,
  ProviderApplication, Review, PaymentMethod,
} from "@/lib/types";
import { PROVIDERS, categoryImage } from "@/lib/data/providers";
import { DEFAULT_PLANS, getCity } from "@/lib/data/catalog";
import {
  DEMO_PROVIDER_ID, DEMO_USER_ID, SEED_PROMOS, seedApplications, seedBookings, seedConversations, seedNotifications,
  seedPayments, seedReviews, seedUsers,
} from "@/lib/data/seed";
import { repo } from "@/lib/supabase/repository";

export type Role = "customer" | "provider" | "admin";
export interface Session { userId: string; role: Role; providerId?: string; name: string; email: string }

const uid = (p = "") => p + Math.random().toString(36).slice(2, 10);
const bookingCode = () => `USG-${Math.floor(100000 + Math.random() * 899999)}`;
const nowIso = () => new Date().toISOString();

interface State {
  session: Session | null;
  users: AppUser[];
  extraProviders: Provider[];
  providerPatches: Record<string, Partial<Provider>>;
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  typing: Record<string, boolean>;
  notifications: AppNotification[];
  reviews: Review[];
  reviewStatus: Record<string, NonNullable<Review["status"]>>;
  reviewReplies: Record<string, string>;
  favorites: string[];
  applications: ProviderApplication[];
  myApplicationId?: string;
  payments: Payment[];
  promos: PromoCode[];
  planPrices: Record<PlanId, number>;
  commission: Record<PlanId, number>;
  serviceFeePercent: number;
  promotedIds: string[];
  inactiveCategories: string[];
  inactiveCities: string[];
  settings: { email: boolean; sms: boolean; push: boolean };

  login: (s: { role: Role; name?: string; email?: string; phone?: string }) => void;
  logout: () => void;
  toggleFavorite: (providerId: string) => void;
  createBooking: (input: Omit<Booking, "id" | "createdAt" | "status" | "reviewed" | "paymentStatus" | "userId">) => Booking;
  setBookingStatus: (id: string, status: BookingStatus) => void;
  addReview: (r: Omit<Review, "id" | "date" | "providerId" | "userId" | "author" | "avatar" | "status">) => { ok: boolean; error?: string };
  replyToReview: (reviewId: string, text: string) => void;
  ensureConversation: (providerId: string, bookingId?: string) => string;
  sendMessage: (conversationId: string, m: Pick<Message, "kind" | "text" | "image" | "location" | "bookingId">, sender?: "user" | "provider") => void;
  markConversationRead: (conversationId: string, reader: "user" | "provider") => void;
  pushNotification: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (audience: AppNotification["audience"]) => void;
  submitApplication: (a: Omit<ProviderApplication, "id" | "status" | "submittedAt">) => string;
  approveApplication: (id: string) => void;
  rejectApplication: (id: string) => void;
  updateProvider: (id: string, patch: Partial<Provider>) => void;
  setUserStatus: (id: string, status: AppUser["status"]) => void;
  setProviderStatus: (id: string, status: NonNullable<Provider["status"]>) => void;
  togglePromoted: (id: string) => void;
  setPlanPrice: (plan: PlanId, price: number) => void;
  setCommission: (plan: PlanId, pct: number) => void;
  setServiceFee: (pct: number) => void;
  addPromo: (p: PromoCode) => void;
  togglePromo: (code: string) => void;
  validatePromo: (code: string) => number | null;
  setReviewStatus: (id: string, status: NonNullable<Review["status"]>) => void;
  toggleCategory: (id: string) => void;
  toggleCity: (slug: string) => void;
  updateSettings: (s: Partial<State["settings"]>) => void;
  updateUser: (patch: Partial<AppUser>) => void;
  resetDemo: () => void;
}

function initialData() {
  const now = new Date();
  const bookings = seedBookings(now);
  const { conversations, messages } = seedConversations(now);
  return {
    session: null as Session | null,
    users: seedUsers(now),
    extraProviders: [] as Provider[],
    providerPatches: {} as Record<string, Partial<Provider>>,
    bookings, conversations, messages, typing: {},
    notifications: seedNotifications(now),
    reviews: [] as Review[],
    reviewStatus: {} as Record<string, NonNullable<Review["status"]>>,
    reviewReplies: {} as Record<string, string>,
    favorites: ["malika-yusupova", "nodira-saidova"],
    applications: seedApplications(now),
    myApplicationId: undefined as string | undefined,
    payments: seedPayments(bookings, now),
    promos: SEED_PROMOS,
    planPrices: Object.fromEntries(DEFAULT_PLANS.map((p) => [p.id, p.priceUsd])) as Record<PlanId, number>,
    commission: { free: 15, pro: 10, business: 8, premium: 5 } as Record<PlanId, number>,
    serviceFeePercent: 5,
    promotedIds: ["aziz-karimov", "malika-yusupova", "nodira-saidova"],
    inactiveCategories: [] as string[],
    inactiveCities: [] as string[],
    settings: { email: true, sms: true, push: false },
  };
}

const autoReplies = [
  "Rahmat! Tushunarli, vaqtida yetib boraman 👍",
  "Принято! Если будут вопросы — пишите.",
  "Got it, thanks! See you soon.",
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialData(),

      login: ({ role, name, email, phone }) => {
        const providerId = role === "provider" ? get().session?.providerId ?? (get().myApplicationId ? get().applications.find((a) => a.id === get().myApplicationId)?.providerId : undefined) ?? DEMO_PROVIDER_ID : undefined;
        const demoUser = get().users.find((u) => u.id === DEMO_USER_ID)!;
        const displayName = role === "admin" ? "Admin" : role === "provider" ? (getProviderById(providerId!)?.name ?? name ?? "Specialist") : name || demoUser.name;
        if (role === "customer" && (name || email || phone)) get().updateUser({ name: name || demoUser.name, email: email || demoUser.email, phone: phone || demoUser.phone });
        set({ session: { userId: DEMO_USER_ID, role, providerId, name: displayName, email: email || (role === "admin" ? "admin@ustago.uz" : demoUser.email) } });
      },
      logout: () => { set({ session: null }); void repo.signOut(); },

      toggleFavorite: (providerId) => {
        const has = get().favorites.includes(providerId);
        set({ favorites: has ? get().favorites.filter((f) => f !== providerId) : [...get().favorites, providerId] });
        void repo.toggleFavorite(providerId, !has);
      },

      createBooking: (input) => {
        const s = get().session;
        const booking: Booking = {
          ...input, id: bookingCode(), userId: s?.userId ?? DEMO_USER_ID, status: "pending", reviewed: false,
          paymentStatus: input.paymentMethod === "cash" ? "unpaid" : "held", createdAt: nowIso(),
        };
        const provider = getProviderById(booking.providerId);
        set((st) => ({
          bookings: [booking, ...st.bookings],
          payments: input.paymentMethod === "cash" ? st.payments : [{ id: uid("pay-"), bookingId: booking.id, providerId: booking.providerId, userId: booking.userId, amount: booking.total, currency: "UZS", method: input.paymentMethod as PaymentMethod, status: "pending", kind: "booking", at: nowIso() }, ...st.payments],
        }));
        const convId = get().ensureConversation(booking.providerId, booking.id);
        set((st) => ({ messages: [...st.messages, { id: uid("m-"), conversationId: convId, sender: "user", kind: "booking", bookingId: booking.id, at: nowIso(), read: true }] }));
        get().pushNotification({ audience: "user", kind: "booking_created", params: { id: booking.id, name: provider?.name ?? "" }, href: "/dashboard/bookings" });
        get().pushNotification({ audience: "provider", kind: "new_request", params: { name: booking.customerName }, href: "/provider-dashboard/orders" });
        void repo.createBooking(booking);
        // Demo: specialist confirms automatically after a few seconds (in production this is done from the provider dashboard / realtime)
        if (!repo.enabled) setTimeout(() => {
          const b = get().bookings.find((x) => x.id === booking.id);
          if (b?.status === "pending") get().setBookingStatus(booking.id, "confirmed");
        }, 6000);
        return booking;
      },

      setBookingStatus: (id, status) => {
        const b = get().bookings.find((x) => x.id === id);
        if (!b) return;
        set((st) => ({
          bookings: st.bookings.map((x) => x.id === id ? { ...x, status, paymentStatus: status === "completed" && x.paymentStatus !== "unpaid" ? "paid" : status === "cancelled" && x.paymentStatus === "held" ? "refunded" : x.paymentStatus } : x),
          payments: st.payments.map((p) => p.bookingId === id ? { ...p, status: status === "completed" ? "succeeded" : status === "cancelled" ? "refunded" : p.status } : p),
        }));
        if (status === "confirmed") get().pushNotification({ audience: "user", kind: "booking_confirmed", params: { id }, href: "/dashboard/bookings" });
        if (status === "completed") {
          get().pushNotification({ audience: "user", kind: "booking_completed", params: { id }, href: `/dashboard/bookings?review=${id}` });
          get().pushNotification({ audience: "provider", kind: "payment", params: { amount: b.price.toLocaleString("ru-RU").replace(/ /g, " ") }, href: "/provider-dashboard/earnings" });
        }
        void repo.updateBookingStatus(id, status);
      },

      addReview: (r) => {
        const b = get().bookings.find((x) => x.id === r.bookingId);
        if (!b) return { ok: false, error: "booking_not_found" };
        if (b.status !== "completed") return { ok: false, error: "not_completed" };
        if (b.reviewed) return { ok: false, error: "already_reviewed" };
        const s = get().session;
        const review: Review = { ...r, id: uid("r-"), providerId: b.providerId, userId: b.userId, author: s?.name ?? b.customerName, avatar: get().users.find((u) => u.id === b.userId)?.avatar, date: nowIso(), status: "published" };
        const prov = getProviderById(b.providerId);
        set((st) => ({ reviews: [review, ...st.reviews], bookings: st.bookings.map((x) => x.id === b.id ? { ...x, reviewed: true } : x) }));
        if (prov) {
          const count = prov.reviewsCount + 1;
          get().updateProvider(prov.id, { reviewsCount: count, rating: Math.round(((prov.rating * prov.reviewsCount + r.rating) / count) * 100) / 100 });
        }
        get().pushNotification({ audience: "user", kind: "review_published", params: {}, href: "/dashboard/reviews" });
        void repo.createReview(review);
        return { ok: true };
      },
      replyToReview: (reviewId, text) => set((st) => ({ reviewReplies: { ...st.reviewReplies, [reviewId]: text } })),

      ensureConversation: (providerId, bookingId) => {
        const existing = get().conversations.find((c) => c.providerId === providerId && c.userId === (get().session?.userId ?? DEMO_USER_ID));
        if (existing) {
          set((st) => ({ conversations: st.conversations.map((c) => c.id === existing.id ? { ...c, bookingId: bookingId ?? c.bookingId, updatedAt: nowIso() } : c) }));
          return existing.id;
        }
        const c: Conversation = { id: uid("c-"), providerId, userId: get().session?.userId ?? DEMO_USER_ID, bookingId, updatedAt: nowIso() };
        set((st) => ({ conversations: [c, ...st.conversations] }));
        return c.id;
      },

      sendMessage: (conversationId, m, sender = "user") => {
        const msg: Message = { id: uid("m-"), conversationId, sender, at: nowIso(), read: false, ...m };
        set((st) => ({ messages: [...st.messages, msg], conversations: st.conversations.map((c) => c.id === conversationId ? { ...c, updatedAt: msg.at } : c) }));
        void repo.sendMessage(msg);
        if (!repo.enabled) {
          // Demo realtime: the other side "types" and answers
          const other = sender === "user" ? "provider" : "user";
          setTimeout(() => set((st) => ({ typing: { ...st.typing, [conversationId]: true } })), 700);
          setTimeout(() => {
            const conv = get().conversations.find((c) => c.id === conversationId);
            set((st) => ({
              typing: { ...st.typing, [conversationId]: false },
              messages: [...st.messages, { id: uid("m-"), conversationId, sender: other, kind: "text", text: autoReplies[Math.floor(Math.random() * autoReplies.length)], at: nowIso(), read: false }],
            }));
            if (other === "provider" && conv) get().pushNotification({ audience: "user", kind: "message", params: { name: getProviderById(conv.providerId)?.name ?? "" }, href: `/dashboard/messages?c=${conversationId}` });
          }, 2400);
        }
      },

      markConversationRead: (conversationId, reader) => set((st) => ({
        messages: st.messages.map((m) => m.conversationId === conversationId && m.sender !== reader && !m.read ? { ...m, read: true } : m),
      })),

      pushNotification: (n) => set((st) => ({ notifications: [{ ...n, id: uid("n-"), at: nowIso(), read: false }, ...st.notifications].slice(0, 80) })),
      markNotificationRead: (id) => set((st) => ({ notifications: st.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),
      markAllNotificationsRead: (audience) => set((st) => ({ notifications: st.notifications.map((n) => n.audience === audience ? { ...n, read: true } : n) })),

      submitApplication: (a) => {
        const app: ProviderApplication = { ...a, id: uid("app-"), status: "under_review", submittedAt: nowIso() };
        set((st) => ({ applications: [app, ...st.applications], myApplicationId: app.id }));
        get().pushNotification({ audience: "admin", kind: "verification_submitted", params: { name: a.name }, href: "/admin/verification" });
        void repo.submitApplication(app);
        return app.id;
      },

      approveApplication: (id) => {
        const app = get().applications.find((a) => a.id === id);
        if (!app) return;
        const city = getCity(app.citySlug);
        const pid = `${app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id.slice(-4)}`;
        const days = new Set(app.hours.days);
        const from = parseInt(app.hours.from), to = parseInt(app.hours.to);
        const provider: Provider = {
          id: pid, name: app.name, gender: "m", avatar: app.photo ?? "", profession: { uz: app.services.split(",")[0], ru: app.services.split(",")[0], en: app.services.split(",")[0] },
          categoryId: app.categoryId, serviceSlugs: [], citySlug: app.citySlug, district: "Markaz", lat: (city?.lat ?? 41.3) + 0.01, lng: (city?.lng ?? 69.24) + 0.01,
          rating: 5, reviewsCount: 0, ordersCount: 0, priceFrom: app.priceFrom, priceUnit: "job", responseMinutes: 15, experienceYears: app.experienceYears,
          languages: ["uz", "ru"], verified: true, badges: ["verified"], about: { uz: app.description, ru: app.description, en: app.description },
          services: app.services.split(",").map((s, i) => ({ id: `${pid}-s${i + 1}`, name: { uz: s.trim(), ru: s.trim(), en: s.trim() }, price: app.priceFrom * (i + 1), unit: "job" as const, durationMin: 60 })).slice(0, 6),
          portfolio: (app.portfolio.length ? app.portfolio : [categoryImage(app.categoryId, 0), categoryImage(app.categoryId, 1)]).map((src, i) => ({ id: `${pid}-p${i}`, title: { uz: "Ish", ru: "Работа", en: "Work" }, image: src, completedAt: nowIso() })),
          availability: Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, days.has(d) ? [from, to] : null])) as Provider["availability"],
          plan: "free", phone: app.phone, joinedYear: new Date().getFullYear(), status: "active",
        };
        set((st) => ({
          applications: st.applications.map((a) => a.id === id ? { ...a, status: "approved", providerId: pid } : a),
          extraProviders: [...st.extraProviders, provider],
          session: st.myApplicationId === id && st.session ? { ...st.session, providerId: pid } : st.session,
        }));
        if (get().myApplicationId === id) get().pushNotification({ audience: "provider", kind: "verification_approved", params: {}, href: "/provider-dashboard" });
        void repo.reviewApplication(id, "approved");
      },
      rejectApplication: (id) => { set((st) => ({ applications: st.applications.map((a) => a.id === id ? { ...a, status: "rejected" } : a) })); void repo.reviewApplication(id, "rejected"); },

      updateProvider: (id, patch) => {
        if (get().extraProviders.some((p) => p.id === id)) set((st) => ({ extraProviders: st.extraProviders.map((p) => p.id === id ? { ...p, ...patch } : p) }));
        else set((st) => ({ providerPatches: { ...st.providerPatches, [id]: { ...st.providerPatches[id], ...patch } } }));
        void repo.updateProvider(id, patch);
      },
      setUserStatus: (id, status) => set((st) => ({ users: st.users.map((u) => u.id === id ? { ...u, status } : u) })),
      setProviderStatus: (id, status) => get().updateProvider(id, { status }),
      togglePromoted: (id) => set((st) => ({ promotedIds: st.promotedIds.includes(id) ? st.promotedIds.filter((x) => x !== id) : [...st.promotedIds, id] })),
      setPlanPrice: (plan, price) => set((st) => ({ planPrices: { ...st.planPrices, [plan]: price } })),
      setCommission: (plan, pct) => set((st) => ({ commission: { ...st.commission, [plan]: pct } })),
      setServiceFee: (pct) => set({ serviceFeePercent: pct }),
      addPromo: (p) => set((st) => ({ promos: [p, ...st.promos.filter((x) => x.code !== p.code)] })),
      togglePromo: (code) => set((st) => ({ promos: st.promos.map((p) => p.code === code ? { ...p, active: !p.active } : p) })),
      validatePromo: (code) => {
        const p = get().promos.find((x) => x.code.toUpperCase() === code.trim().toUpperCase());
        if (!p || !p.active || p.uses >= p.maxUses || new Date(p.expiresAt) < new Date()) return null;
        return p.percent;
      },
      setReviewStatus: (id, status) => set((st) => ({ reviewStatus: { ...st.reviewStatus, [id]: status } })),
      toggleCategory: (id) => set((st) => ({ inactiveCategories: st.inactiveCategories.includes(id) ? st.inactiveCategories.filter((x) => x !== id) : [...st.inactiveCategories, id] })),
      toggleCity: (slug) => set((st) => ({ inactiveCities: st.inactiveCities.includes(slug) ? st.inactiveCities.filter((x) => x !== slug) : [...st.inactiveCities, slug] })),
      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      updateUser: (patch) => set((st) => ({ users: st.users.map((u) => u.id === (st.session?.userId ?? DEMO_USER_ID) ? { ...u, ...patch } : u), session: st.session && patch.name ? { ...st.session, name: patch.name } : st.session })),
      resetDemo: () => set({ ...initialData(), session: get().session }),
    }),
    {
      name: "ustago-demo-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => { const { typing: _t, ...rest } = s; void _t; return rest as unknown as State; },
    },
  ),
);

/* ---------- selectors & hooks ---------- */

let _extra: Provider[] = [];
let _patches: Record<string, Partial<Provider>> = {};
useStore.subscribe((s) => { _extra = s.extraProviders; _patches = s.providerPatches; });

export function getProviderById(id: string): Provider | undefined {
  const base = PROVIDERS.find((p) => p.id === id) ?? _extra.find((p) => p.id === id);
  return base ? { ...base, ..._patches[id] } : undefined;
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    const unsub = useStore.persist.onFinishHydration(() => setH(true));
    return unsub;
  }, []);
  return h;
}

/** All providers with admin/provider edits applied. Before hydration returns static seed (SSR-safe). */
export function useProviders(opts: { includeInactive?: boolean } = {}) {
  const hydrated = useHydrated();
  const extra = useStore((s) => s.extraProviders);
  const patches = useStore((s) => s.providerPatches);
  const promoted = useStore((s) => s.promotedIds);
  return useMemo(() => {
    if (!hydrated) return PROVIDERS;
    const all = [...PROVIDERS, ...extra].map((p) => ({ ...p, ...patches[p.id], featured: promoted.includes(p.id) || p.featured }));
    return opts.includeInactive ? all : all.filter((p) => p.status !== "blocked");
  }, [hydrated, extra, patches, promoted, opts.includeInactive]);
}

const SEED_REVIEWS = seedReviews(new Date("2026-10-01T09:00:00Z"));
/** seeded reviews + reviews written by users, with moderation status applied */
export function useReviews(opts: { providerId?: string; includeHidden?: boolean } = {}) {
  const hydrated = useHydrated();
  const own = useStore((s) => s.reviews);
  const statuses = useStore((s) => s.reviewStatus);
  return useMemo(() => {
    const list = [...(hydrated ? own : []), ...SEED_REVIEWS]
      .filter((r) => !opts.providerId || r.providerId === opts.providerId)
      .map((r) => (hydrated && statuses[r.id] ? { ...r, status: statuses[r.id] } : r));
    return opts.includeHidden ? list : list.filter((r) => r.status !== "hidden");
  }, [hydrated, own, statuses, opts.providerId, opts.includeHidden]);
}

export function useProvider(id: string) {
  const all = useProviders({ includeInactive: true });
  return all.find((p) => p.id === id);
}

export function useUnreadCounts(audience: "user" | "provider" = "user") {
  const hydrated = useHydrated();
  const messages = useStore((s) => s.messages);
  const notifications = useStore((s) => s.notifications);
  const conversations = useStore((s) => s.conversations);
  const session = useStore((s) => s.session);
  return useMemo(() => {
    if (!hydrated) return { messages: 0, notifications: 0 };
    const convIds = new Set(conversations.filter((c) => audience === "user" || c.providerId === (session?.providerId ?? DEMO_PROVIDER_ID)).map((c) => c.id));
    return {
      messages: messages.filter((m) => convIds.has(m.conversationId) && !m.read && m.sender !== audience).length,
      notifications: notifications.filter((n) => n.audience === audience && !n.read).length,
    };
  }, [hydrated, messages, notifications, conversations, audience, session]);
}

export { DEMO_PROVIDER_ID, DEMO_USER_ID };
