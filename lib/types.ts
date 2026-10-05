// Domain types — mirror the PostgreSQL schema in supabase/migrations/0001_init.sql

export type Locale = "uz" | "ru" | "en";
export type LText = Record<Locale, string>;

export type CategoryIcon =
  | "wrench" | "car" | "house" | "sparkles" | "laptop" | "graduation" | "scissors"
  | "camera" | "truck" | "hardhat" | "palette" | "zap";

export interface Category {
  id: string;
  slug: string;
  icon: CategoryIcon;
  name: LText;
  description: LText;
  /** tailwind gradient classes for the icon tile */
  tone: string;
  isActive?: boolean;
}

export interface ServiceType {
  slug: string; // SEO slug: /services/plumber
  categoryId: string;
  name: LText; // "Сантехник"
  query: LText; // human query: "Мне нужен сантехник"
  fromPrice: number;
}

export interface City {
  slug: string;
  name: LText;
  region: LText;
  lat: number;
  lng: number;
  isActive?: boolean;
}

export type Badge = "verified" | "popular" | "fast" | "top";
export type PlanId = "free" | "pro" | "business" | "premium";
export type PriceUnit = "hour" | "job" | "visit" | "lesson" | "sqm";

export interface ProviderService {
  id: string;
  name: LText;
  price: number;
  unit: PriceUnit;
  durationMin: number;
}

export interface PortfolioItem {
  id: string;
  title: LText;
  image: string;
  completedAt: string;
}

/** weekday 0 (Sun) … 6 (Sat) → [startHour, endHour] or null (day off) */
export type WeeklyAvailability = Record<number, [number, number] | null>;

export interface Provider {
  id: string;
  name: string;
  avatar: string;
  gender: "m" | "f";
  profession: LText;
  categoryId: string;
  serviceSlugs: string[];
  citySlug: string;
  district: string;
  lat: number;
  lng: number;
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  priceFrom: number;
  priceUnit: PriceUnit;
  responseMinutes: number;
  experienceYears: number;
  languages: Locale[];
  verified: boolean;
  badges: Badge[];
  about: LText;
  services: ProviderService[];
  portfolio: PortfolioItem[];
  availability: WeeklyAvailability;
  plan: PlanId;
  phone: string;
  joinedYear: number;
  featured?: boolean;
  status?: "active" | "pending" | "blocked";
}

export interface Review {
  id: string;
  providerId: string;
  bookingId: string;
  userId: string;
  author: string;
  avatar?: string;
  rating: number;
  quality: number;
  communication: number;
  price: number;
  punctuality: number;
  text: string;
  date: string; // ISO
  serviceName?: LText;
  status?: "published" | "hidden" | "flagged";
}

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentMethod = "click" | "payme" | "uzum" | "card" | "cash";

export interface Booking {
  id: string; // USG-XXXXXX
  providerId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  description: string;
  photos: string[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address: string;
  citySlug: string;
  price: number;
  fee: number;
  discount: number;
  total: number;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "held" | "paid" | "refunded";
  status: BookingStatus;
  createdAt: string;
  reviewed: boolean;
}

export type MessageKind = "text" | "image" | "location" | "booking";

export interface Message {
  id: string;
  conversationId: string;
  sender: "user" | "provider";
  kind: MessageKind;
  text?: string;
  image?: string;
  location?: { lat: number; lng: number; label: string };
  bookingId?: string;
  at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  providerId: string;
  userId: string;
  bookingId?: string;
  updatedAt: string;
}

export type NotificationKind =
  | "booking_confirmed" | "booking_created" | "message" | "reminder" | "review_published"
  | "booking_completed" | "verification_approved" | "verification_submitted" | "new_request" | "payment";

export interface AppNotification {
  id: string;
  audience: "user" | "provider" | "admin";
  kind: NotificationKind;
  params: Record<string, string>;
  href?: string;
  at: string;
  read: boolean;
}

export interface Payment {
  id: string;
  bookingId?: string;
  subscriptionPlan?: PlanId;
  providerId?: string;
  userId?: string;
  amount: number;
  currency: "UZS" | "USD";
  method: PaymentMethod;
  status: "pending" | "succeeded" | "refunded" | "failed";
  kind: "booking" | "subscription" | "promotion";
  at: string;
}

export interface Plan {
  id: PlanId;
  priceUsd: number;
  features: string[]; // i18n keys
  highlighted?: boolean;
}

export interface PromoCode {
  code: string;
  percent: number;
  active: boolean;
  uses: number;
  maxUses: number;
  expiresAt: string;
}

export interface ProviderApplication {
  id: string;
  name: string;
  phone: string;
  citySlug: string;
  categoryId: string;
  services: string;
  experienceYears: number;
  priceFrom: number;
  description: string;
  photo?: string;
  portfolio: string[];
  hours: { from: string; to: string; days: number[] };
  documentName?: string;
  status: "under_review" | "approved" | "rejected";
  submittedAt: string;
  providerId?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  citySlug: string;
  role: "customer" | "provider" | "admin";
  createdAt: string;
  status: "active" | "blocked";
}
