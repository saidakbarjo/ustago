import type { AppNotification, AppUser, Booking, Conversation, Message, Payment, PromoCode, Review, ProviderApplication } from "@/lib/types";
import { PROVIDERS } from "./providers";

const AUTHORS = [
  "Shohruh T.", "Madina A.", "Aleksandr P.", "Feruza K.", "Bahodir N.", "Olga S.", "Javlon M.", "Zilola R.",
  "Sherzod Q.", "Kamila Y.", "Dmitriy V.", "Nargiza H.", "Temur B.", "Yulduz E.", "Asror D.", "Laylo I.",
];
const TEXTS = [
  "Juda tez keldi, hammasini 40 daqiqada tuzatdi. Narx oldindan aytilganidek boʻldi. Tavsiya qilaman!",
  "Пришёл точно в срок, всё объяснил, после работы убрал за собой. Однозначно буду обращаться ещё.",
  "Professional, polite and very clean work. Price was exactly as quoted in the app.",
  "Ishini biladigan usta. Kafolat ham berdi. Rahmat!",
  "Очень довольна результатом. Отвечает быстро, всё по договорённости. 5 звёзд.",
  "Booked in the evening, he came the next morning. Super convenient, will use USTAGO again.",
  "Sifat aʼlo, muloqot ham yoqimli. Biroz kechikdi, lekin oldindan ogohlantirdi.",
  "Хороший специалист, цена адекватная. Рекомендую друзьям.",
  "Hamma narsa joyida. Ilova orqali buyurtma berish juda qulay ekan.",
  "Сделал больше, чем ожидали, и не взял доплату. Спасибо!",
];

const daysAgo = (n: number, now: Date) => new Date(now.getTime() - n * 86400000).toISOString();
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (now: Date, n: number) => { const d = new Date(now); d.setDate(d.getDate() + n); return d; };

export const DEMO_USER_ID = "u-demo";
export const DEMO_PROVIDER_ID = "aziz-karimov";

export function seedReviews(now = new Date()): Review[] {
  const out: Review[] = [];
  PROVIDERS.forEach((p, pi) => {
    for (let i = 0; i < 6; i++) {
      const k = (pi * 7 + i * 3) % TEXTS.length;
      const base = i === 4 && p.rating < 4.9 ? 4 : 5;
      out.push({
        id: `r-${p.id}-${i}`, providerId: p.id, bookingId: `USG-H${pi}${i}`, userId: `u-${(pi + i) % 16}`,
        author: AUTHORS[(pi + i * 5) % AUTHORS.length],
        avatar: `https://randomuser.me/api/portraits/${(pi + i) % 2 ? "women" : "men"}/${(pi * 3 + i * 11) % 90}.jpg`,
        rating: base, quality: base, communication: 5, price: i % 3 === 0 ? 4 : 5, punctuality: i === 2 ? 4 : 5,
        text: TEXTS[k], date: daysAgo(3 + pi + i * 9, now), serviceName: p.services[i % p.services.length]?.name, status: "published",
      });
    }
  });
  return out;
}

function booking(b: Partial<Booking> & Pick<Booking, "id" | "providerId" | "date" | "time" | "status">): Booking {
  const p = PROVIDERS.find((x) => x.id === b.providerId)!;
  const svc = p.services[0];
  const price = b.price ?? svc.price;
  const fee = Math.round(price * 0.05 / 1000) * 1000;
  return {
    userId: DEMO_USER_ID, customerName: "Javohir Saidov", customerPhone: "+998 90 123 45 67", serviceId: svc.id,
    description: "", photos: [], address: "Toshkent, Yunusobod tumani, 4-mavze, 12-uy", citySlug: p.citySlug,
    price, fee, discount: 0, total: price + fee, paymentMethod: "click", paymentStatus: "held",
    createdAt: new Date().toISOString(), reviewed: false, ...b,
  } as Booking;
}

const CUSTOMERS = ["Shohruh Toshmatov", "Madina Alieva", "Feruza Karimova", "Bahodir Nurmatov", "Olga Smirnova", "Javlon Mirzaev", "Zilola Rashidova", "Sherzod Qodirov"];

export function seedBookings(now = new Date()): Booking[] {
  const list: Booking[] = [
    booking({ id: "USG-482915", providerId: "aziz-karimov", date: ymd(addDays(now, 2)), time: "14:00", status: "confirmed", description: "Oshxonadagi smesitel oqyapti, almashtirish kerak.", serviceId: "aziz-karimov-s2", price: 130000 }),
    booking({ id: "USG-482777", providerId: "dilshod-rahimov", date: ymd(addDays(now, 5)), time: "10:00", status: "pending", description: "Mehmonxonaga lyustra oʻrnatish.", serviceId: "dilshod-rahimov-s2", price: 140000 }),
    booking({ id: "USG-481204", providerId: "malika-yusupova", date: ymd(addDays(now, -4)), time: "09:00", status: "completed", paymentStatus: "paid", description: "3 xonali kvartira bosh tozalash.", serviceId: "malika-yusupova-s2", price: 550000 }),
    booking({ id: "USG-479330", providerId: "nodira-saidova", date: ymd(addDays(now, -21)), time: "18:00", status: "completed", paymentStatus: "paid", reviewed: true, serviceId: "nodira-saidova-s2", price: 180000 }),
  ];
  // provider-side bookings for the demo provider dashboard (Aziz Karimov)
  const times = ["09:00", "11:00", "13:30", "15:00", "17:00"];
  for (let i = 0; i < 26; i++) {
    const offset = i < 3 ? 0 : i < 7 ? i - 2 : -(i - 6) * 3;
    const status = i < 3 ? (i === 0 ? "in_progress" : "confirmed") : i < 5 ? "pending" : i < 7 ? "confirmed" : i % 9 === 0 ? "cancelled" : "completed";
    const s = PROVIDERS[0].services[i % 4];
    list.push(booking({
      id: `USG-47${String(1000 + i * 37).slice(-4)}${i % 10}`, providerId: "aziz-karimov", userId: `u-${i % 8}`,
      customerName: CUSTOMERS[i % CUSTOMERS.length], customerPhone: `+998 9${i % 9} 55${i % 10} ${10 + i} ${20 + i}`,
      date: ymd(addDays(now, offset)), time: times[i % times.length], status: status as Booking["status"],
      serviceId: s.id, price: s.price, paymentStatus: status === "completed" ? "paid" : "held",
      address: ["Yunusobod, 11-kvartal", "Chilonzor, 9-mavze", "Mirzo Ulugʻbek, Buyuk Ipak yoʻli 45", "Shayxontohur, Navoiy koʻch."][i % 4],
      description: ["Vannada quvur oqyapti", "Смеситель на кухне капает", "Unitaz bachogi ishlamayapti", "Нужно установить бойлер"][i % 4],
      createdAt: daysAgo(Math.max(0, -offset) + 1, now), reviewed: status === "completed" && i % 2 === 0,
    }));
  }
  return list;
}

export function seedConversations(now = new Date()): { conversations: Conversation[]; messages: Message[] } {
  const conversations: Conversation[] = [
    { id: "c-aziz", providerId: "aziz-karimov", userId: DEMO_USER_ID, bookingId: "USG-482915", updatedAt: daysAgo(0.02, now) },
    { id: "c-malika", providerId: "malika-yusupova", userId: DEMO_USER_ID, bookingId: "USG-481204", updatedAt: daysAgo(4, now) },
    { id: "c-dilshod", providerId: "dilshod-rahimov", userId: DEMO_USER_ID, bookingId: "USG-482777", updatedAt: daysAgo(0.4, now) },
  ];
  const m = (id: string, c: string, sender: "user" | "provider", text: string, ago: number, extra: Partial<Message> = {}): Message =>
    ({ id, conversationId: c, sender, kind: "text", text, at: daysAgo(ago, now), read: sender === "user" || ago > 0.1, ...extra });
  const messages: Message[] = [
    m("m1", "c-aziz", "user", "Assalomu alaykum! Oshxonadagi smesitel oqyapti, ertaga kela olasizmi?", 0.2),
    m("m2", "c-aziz", "provider", "Vaalaykum assalom! Ha, albatta. Buyurtmani tasdiqladim.", 0.19),
    m("m3", "c-aziz", "provider", "", 0.19, { kind: "booking", bookingId: "USG-482915" }),
    m("m4", "c-aziz", "user", "", 0.1, { kind: "location", location: { lat: 41.3645, lng: 69.2869, label: "Yunusobod, 4-mavze, 12-uy" } }),
    m("m5", "c-aziz", "provider", "Rahmat, manzil qabul qilindi. Smesitel rasmini yubora olasizmi?", 0.02),
    m("m6", "c-dilshod", "provider", "Здравствуйте! Какая модель люстры? Нужен ли демонтаж старой?", 0.4),
    m("m7", "c-malika", "user", "Rahmat, hammasi juda toza! 🙏", 4),
    m("m8", "c-malika", "provider", "Sizga ham rahmat! Baho qoldirsangiz xursand boʻlamiz.", 3.9),
  ];
  return { conversations, messages };
}

export function seedNotifications(now = new Date()): AppNotification[] {
  return [
    { id: "n1", audience: "user", kind: "message", params: { name: "Aziz Karimov" }, href: "/dashboard/messages?c=c-aziz", at: daysAgo(0.02, now), read: false },
    { id: "n2", audience: "user", kind: "booking_confirmed", params: { id: "USG-482915" }, href: "/dashboard/bookings", at: daysAgo(0.19, now), read: false },
    { id: "n3", audience: "user", kind: "reminder", params: { time: "14:00" }, href: "/dashboard/bookings", at: daysAgo(0.5, now), read: true },
    { id: "n4", audience: "user", kind: "review_published", params: {}, href: "/dashboard/reviews", at: daysAgo(20, now), read: true },
    { id: "n5", audience: "provider", kind: "new_request", params: { name: "Madina Alieva" }, href: "/provider-dashboard/orders", at: daysAgo(0.05, now), read: false },
    { id: "n6", audience: "provider", kind: "payment", params: { amount: "130 000" }, href: "/provider-dashboard/earnings", at: daysAgo(1, now), read: false },
    { id: "n7", audience: "admin", kind: "verification_submitted", params: { name: "Bobur Ergashev" }, href: "/admin/verification", at: daysAgo(0.3, now), read: false },
  ];
}

export function seedUsers(now = new Date()): AppUser[] {
  const names = ["Javohir Saidov", ...CUSTOMERS, "Anna Kim", "Rustam Aliev", "Gulshan Ergasheva", "Mansur Xoliqov"];
  const cities = ["tashkent", "samarkand", "bukhara", "andijan", "namangan", "fergana", "qarshi"];
  return names.map((n, i) => ({
    id: i === 0 ? DEMO_USER_ID : `u-${i - 1}`, name: n, email: `${n.split(" ")[0].toLowerCase()}@mail.uz`,
    phone: `+998 9${i % 9} ${100 + i * 7} ${10 + i} ${30 + i}`, citySlug: cities[i % cities.length],
    role: "customer" as const, createdAt: daysAgo(10 + i * 13, now), status: i === 11 ? "blocked" as const : "active" as const,
    avatar: `https://randomuser.me/api/portraits/${i % 3 === 1 ? "women" : "men"}/${(i * 9) % 90}.jpg`,
  }));
}

export function seedPayments(bookings: Booking[], now = new Date()): Payment[] {
  const p: Payment[] = bookings.filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "held").map((b, i) => ({
    id: `pay-${b.id}`, bookingId: b.id, providerId: b.providerId, userId: b.userId, amount: b.total, currency: "UZS" as const,
    method: (["click", "payme", "uzum", "card"] as const)[i % 4], status: b.paymentStatus === "paid" ? "succeeded" as const : "pending" as const,
    kind: "booking" as const, at: b.createdAt,
  }));
  ["pro", "premium", "business", "pro", "pro"].forEach((plan, i) => p.push({
    id: `sub-${i}`, subscriptionPlan: plan as Payment["subscriptionPlan"], providerId: PROVIDERS[i + 3].id, amount: { pro: 9, business: 25, premium: 50 }[plan]!,
    currency: "USD", method: "card", status: "succeeded", kind: "subscription", at: daysAgo(i * 6 + 2, now),
  }));
  return p;
}

export const SEED_PROMOS: PromoCode[] = [
  { code: "USTAGO10", percent: 10, active: true, uses: 412, maxUses: 1000, expiresAt: "2026-12-31" },
  { code: "WELCOME15", percent: 15, active: true, uses: 88, maxUses: 500, expiresAt: "2026-11-30" },
  { code: "TOSHKENT5", percent: 5, active: false, uses: 250, maxUses: 250, expiresAt: "2026-09-01" },
];

export function seedApplications(now = new Date()): ProviderApplication[] {
  return [
    { id: "app-1", name: "Bobur Ergashev", phone: "+998 93 441 20 11", citySlug: "tashkent", categoryId: "home", services: "Mebel yigʻish, javon osish", experienceYears: 4, priceFrom: 100000, description: "Mebel yigʻish boʻyicha 4 yillik tajriba.", portfolio: [], hours: { from: "09:00", to: "19:00", days: [1, 2, 3, 4, 5, 6] }, documentName: "passport_bobur.pdf", status: "under_review", submittedAt: daysAgo(0.3, now) },
    { id: "app-2", name: "Shoira Nazarova", phone: "+998 97 102 55 80", citySlug: "samarkand", categoryId: "beauty", services: "Manikyur, pedikyur", experienceYears: 3, priceFrom: 90000, description: "Manikyur ustasi.", portfolio: [], hours: { from: "10:00", to: "20:00", days: [1, 2, 3, 4, 5, 6] }, documentName: "id_card.jpg", status: "under_review", submittedAt: daysAgo(1.2, now) },
    { id: "app-3", name: "Komil Rasulov", phone: "+998 91 777 03 12", citySlug: "andijan", categoryId: "electric", services: "Elektr montaj", experienceYears: 6, priceFrom: 60000, description: "Elektrik.", portfolio: [], hours: { from: "08:00", to: "18:00", days: [1, 2, 3, 4, 5] }, documentName: "diploma.pdf", status: "under_review", submittedAt: daysAgo(2, now) },
  ];
}
