-- =====================================================================
-- USTAGO — marketplace of services (Uzbekistan)
-- PostgreSQL / Supabase schema: tables, relations, RLS, triggers, RPC
-- =====================================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- enums ----------
create type public.user_role          as enum ('customer', 'provider', 'admin');
create type public.account_status     as enum ('active', 'blocked');
create type public.provider_status    as enum ('pending', 'active', 'blocked');
create type public.plan_id            as enum ('free', 'pro', 'business', 'premium');
create type public.price_unit         as enum ('hour', 'job', 'visit', 'lesson', 'sqm');
create type public.booking_status     as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type public.payment_method     as enum ('click', 'payme', 'uzum', 'card', 'cash');
create type public.payment_gateway    as enum ('click', 'payme', 'uzum', 'stripe', 'cash');
create type public.payment_status     as enum ('unpaid', 'pending', 'held', 'paid', 'succeeded', 'failed', 'refunded');
create type public.payment_kind       as enum ('booking', 'subscription', 'promotion', 'payout');
create type public.application_status as enum ('under_review', 'approved', 'rejected');
create type public.review_status      as enum ('published', 'hidden', 'flagged');
create type public.message_kind       as enum ('text', 'image', 'location', 'booking');
create type public.promotion_kind     as enum ('featured', 'sponsored', 'promoted');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled');

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =====================================================================
-- Reference data
-- =====================================================================
create table public.cities (
  slug        text primary key,
  name        jsonb not null,               -- {"uz": "...", "ru": "...", "en": "..."}
  region      jsonb not null,
  lat         double precision not null,
  lng         double precision not null,
  is_active   boolean not null default true,
  sort        int not null default 0
);

create table public.categories (
  id          text primary key,
  slug        text not null unique,
  icon        text not null,
  name        jsonb not null,
  description jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  sort        int not null default 0
);

-- SEO catalog: /services/<slug>
create table public.service_types (
  slug        text primary key,
  category_id text not null references public.categories(id) on update cascade,
  name        jsonb not null,
  query       jsonb not null default '{}'::jsonb,
  from_price  numeric(14,2) not null default 0,
  is_active   boolean not null default true
);
create index on public.service_types (category_id);

-- Tariffs (editable from admin panel)
create table public.plans (
  id                 public.plan_id primary key,
  price_usd          numeric(8,2) not null,
  commission_percent numeric(5,2) not null,
  features           jsonb not null default '[]'::jsonb,
  is_highlighted     boolean not null default false
);

create table public.platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- Users & providers
-- =====================================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text,
  phone       text,
  avatar_url  text,
  city_slug   text references public.cities(slug),
  role        public.user_role not null default 'customer',
  locale      text not null default 'uz' check (locale in ('uz','ru','en')),
  status      public.account_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger users_updated before update on public.users for each row execute function public.set_updated_at();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create table public.providers (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.users(id) on delete cascade,
  slug              text not null unique,
  display_name      text not null,
  profession        jsonb not null,
  category_id       text not null references public.categories(id),
  city_slug         text not null references public.cities(slug),
  district          text,
  lat               double precision,
  lng               double precision,
  about             jsonb not null default '{}'::jsonb,
  price_from        numeric(14,2) not null default 0,
  price_unit        public.price_unit not null default 'job',
  response_minutes  int not null default 30,
  experience_years  int not null default 0 check (experience_years >= 0),
  languages         text[] not null default array['uz'],
  phone             text,
  is_verified       boolean not null default false,
  badges            text[] not null default '{}',
  plan              public.plan_id not null default 'free',
  status            public.provider_status not null default 'pending',
  rating            numeric(3,2) not null default 0,
  reviews_count     int not null default 0,
  orders_count      int not null default 0,
  weekly_hours      jsonb not null default '{}'::jsonb, -- denormalised cache of provider_availability
  accepts_online    boolean not null default true,
  instant_booking   boolean not null default false,
  vacation_mode     boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index providers_search_idx on public.providers (category_id, city_slug, status);
create index providers_rating_idx on public.providers (rating desc, reviews_count desc);
create index providers_name_trgm on public.providers using gin (display_name gin_trgm_ops);
create trigger providers_updated before update on public.providers for each row execute function public.set_updated_at();

create or replace function public.my_provider_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from public.providers where user_id = auth.uid();
$$;

create table public.provider_service_types (
  provider_id       uuid references public.providers(id) on delete cascade,
  service_type_slug text references public.service_types(slug) on delete cascade,
  primary key (provider_id, service_type_slug)
);

-- Services offered by a provider (price list)
create table public.services (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  name         jsonb not null,
  price        numeric(14,2) not null check (price >= 0),
  unit         public.price_unit not null default 'job',
  duration_min int not null default 60,
  is_visible   boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.services (provider_id);

create table public.provider_portfolio (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  booking_id   uuid,                                -- optional link to a real completed booking
  title        jsonb not null default '{}'::jsonb,
  image_path   text not null,                       -- storage: portfolio/<provider>/<file>
  completed_at date,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);
create index on public.provider_portfolio (provider_id);

create table public.provider_availability (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time),
  unique (provider_id, weekday, start_time)
);

create table public.provider_time_off (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  starts_on   date not null,
  ends_on     date not null,
  reason      text,
  check (ends_on >= starts_on)
);

-- Registration request ("Become a specialist")
create table public.provider_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references public.users(id) on delete cascade,
  full_name        text not null,
  phone            text not null,
  photo_path       text,
  city_slug        text not null references public.cities(slug),
  category_id      text not null references public.categories(id),
  services_text    text not null,
  experience_years int not null default 0,
  price_from       numeric(14,2) not null default 0,
  description      text not null default '',
  working_hours    jsonb not null default '{}'::jsonb,
  document_name    text,
  status           public.application_status not null default 'under_review',
  reviewed_by      uuid references public.users(id),
  reviewed_at      timestamptz,
  rejection_reason text,
  provider_id      uuid references public.providers(id),
  submitted_at     timestamptz not null default now()
);
create index on public.provider_applications (status, submitted_at desc);

create table public.provider_documents (
  id             uuid primary key default gen_random_uuid(),
  provider_id    uuid references public.providers(id) on delete cascade,
  application_id uuid references public.provider_applications(id) on delete cascade,
  doc_type       text not null default 'id',          -- id | passport | certificate | license
  storage_path   text not null,                        -- private bucket: provider-documents
  status         public.application_status not null default 'under_review',
  reviewed_by    uuid references public.users(id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  check (provider_id is not null or application_id is not null)
);

-- =====================================================================
-- Bookings, chat, reviews
-- =====================================================================
create sequence public.booking_code_seq start 482000;

create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique default ('USG-' || nextval('public.booking_code_seq')),
  customer_id     uuid not null default auth.uid() references public.users(id),
  provider_id     uuid not null references public.providers(id),
  service_id      uuid references public.services(id) on delete set null,
  description     text not null check (char_length(description) between 10 and 500),
  address         text not null,
  city_slug       text references public.cities(slug),
  scheduled_date  date not null,
  scheduled_time  time not null,
  photos          text[] not null default '{}',          -- storage paths: booking-photos/...
  price           numeric(14,2) not null check (price >= 0),
  service_fee     numeric(14,2) not null default 0,
  discount        numeric(14,2) not null default 0,
  total           numeric(14,2) not null,
  promo_code      text,
  payment_method  public.payment_method not null default 'click',
  payment_status  public.payment_status not null default 'unpaid',
  status          public.booking_status not null default 'pending',
  customer_name   text,
  customer_phone  text,
  confirmed_at    timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.bookings (customer_id, scheduled_date desc);
create index on public.bookings (provider_id, scheduled_date, scheduled_time);
-- one active booking per provider slot
create unique index bookings_no_double_booking on public.bookings (provider_id, scheduled_date, scheduled_time) where status <> 'cancelled';
create trigger bookings_updated before update on public.bookings for each row execute function public.set_updated_at();

alter table public.provider_portfolio add constraint provider_portfolio_booking_fk foreign key (booking_id) references public.bookings(id) on delete set null;

create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.users(id) on delete cascade,
  provider_id     uuid not null references public.providers(id) on delete cascade,
  booking_id      uuid references public.bookings(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (customer_id, provider_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null default auth.uid() references public.users(id),
  sender_role     text not null default 'user' check (sender_role in ('user','provider')),
  kind            public.message_kind not null default 'text',
  body            text,
  image_path      text,
  location        jsonb,                              -- {"lat":..,"lng":..,"label":".."}
  booking_code    text references public.bookings(code) on delete set null,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  check ((kind = 'text' and body is not null) or (kind = 'image' and image_path is not null) or (kind = 'location' and location is not null) or (kind = 'booking' and booking_code is not null))
);
create index on public.messages (conversation_id, created_at);

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null unique references public.bookings(id) on delete cascade,
  booking_code   text references public.bookings(code),
  provider_id    uuid not null references public.providers(id) on delete cascade,
  author_id      uuid not null default auth.uid() references public.users(id),
  rating         smallint not null check (rating between 1 and 5),
  quality        smallint not null check (quality between 1 and 5),
  communication  smallint not null check (communication between 1 and 5),
  price          smallint not null check (price between 1 and 5),
  punctuality    smallint not null check (punctuality between 1 and 5),
  body           text not null default '',
  status         public.review_status not null default 'published',
  provider_reply text,
  replied_at     timestamptz,
  created_at     timestamptz not null default now()
);
create index on public.reviews (provider_id, created_at desc);

-- =====================================================================
-- Money
-- =====================================================================
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  provider_id          uuid not null references public.providers(id) on delete cascade,
  plan                 public.plan_id not null,
  status               public.subscription_status not null default 'active',
  gateway              public.payment_gateway,
  external_id          text,
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz not null default now() + interval '1 month',
  created_at           timestamptz not null default now()
);
create index on public.subscriptions (provider_id, status);

create table public.promotions (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  kind        public.promotion_kind not null,
  city_slug   text references public.cities(slug),
  category_id text references public.categories(id),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  amount_usd  numeric(8,2) not null default 0,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index on public.promotions (kind, ends_at);

create table public.promo_codes (
  code       text primary key check (code = upper(code)),
  percent    smallint not null check (percent between 1 and 90),
  max_uses   int not null default 1000,
  uses       int not null default 0,
  is_active  boolean not null default true,
  expires_at date not null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  kind            public.payment_kind not null default 'booking',
  booking_code    text references public.bookings(code) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  promotion_id    uuid references public.promotions(id) on delete set null,
  user_id         uuid references public.users(id),
  provider_id     uuid references public.providers(id),
  gateway         public.payment_gateway not null,
  external_id     text not null,
  amount          numeric(14,2) not null,
  currency        text not null default 'UZS',
  commission      numeric(14,2) not null default 0,
  status          public.payment_status not null default 'pending',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (gateway, external_id)
);
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();

create table public.payment_events (   -- raw webhook log (idempotency / audit)
  id          bigserial primary key,
  gateway     public.payment_gateway not null,
  external_id text not null,
  order_code  text,
  status      public.payment_status not null,
  amount      numeric(14,2),
  payload     jsonb,
  received_at timestamptz not null default now()
);

-- =====================================================================
-- Engagement
-- =====================================================================
create table public.favorites (
  user_id     uuid references public.users(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, provider_id)
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  kind       text not null,                 -- booking_confirmed | message | reminder | review_published | ...
  params     jsonb not null default '{}'::jsonb,
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id),
  booking_id  uuid references public.bookings(id),
  review_id   uuid references public.reviews(id),
  reason      text not null,
  severity    text not null default 'medium' check (severity in ('low','medium','high')),
  resolved_at timestamptz,
  resolved_by uuid references public.users(id),
  created_at  timestamptz not null default now()
);

-- =====================================================================
-- Business logic (triggers)
-- =====================================================================
create or replace function public.notify(p_user uuid, p_kind text, p_params jsonb, p_href text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, params, href) values (p_user, p_kind, p_params, p_href);
$$;

-- new auth user → public.users
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, phone)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', new.phone));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- booking pricing: fee from settings, promo code, total
create or replace function public.bookings_before_insert() returns trigger language plpgsql security definer set search_path = public as $$
declare fee_pct numeric; promo record;
begin
  select (value->>'percent')::numeric into fee_pct from public.platform_settings where key = 'service_fee';
  new.service_fee := round(new.price * coalesce(fee_pct, 5) / 100, -3);
  new.discount := 0;
  if new.promo_code is not null then
    select * into promo from public.promo_codes where code = upper(new.promo_code) and is_active and uses < max_uses and expires_at >= current_date;
    if found then
      new.discount := round((new.price + new.service_fee) * promo.percent / 100, -3);
      update public.promo_codes set uses = uses + 1 where code = promo.code;
    else new.promo_code := null; end if;
  end if;
  new.total := new.price + new.service_fee - new.discount;
  new.payment_status := case when new.payment_method = 'cash' then 'unpaid' else 'pending' end;
  return new;
end $$;
create trigger bookings_pricing before insert on public.bookings for each row execute function public.bookings_before_insert();

create or replace function public.bookings_after_change() returns trigger language plpgsql security definer set search_path = public as $$
declare prov_user uuid;
begin
  select user_id into prov_user from public.providers where id = new.provider_id;
  if tg_op = 'INSERT' then
    perform public.notify(prov_user, 'new_request', jsonb_build_object('name', coalesce(new.customer_name, ''), 'id', new.code), '/provider-dashboard/orders');
    perform public.notify(new.customer_id, 'booking_created', jsonb_build_object('id', new.code), '/dashboard/bookings');
    insert into public.conversations (customer_id, provider_id, booking_id) values (new.customer_id, new.provider_id, new.id)
      on conflict (customer_id, provider_id) do update set booking_id = excluded.booking_id;
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      update public.bookings set confirmed_at = now() where id = new.id;
      perform public.notify(new.customer_id, 'booking_confirmed', jsonb_build_object('id', new.code), '/dashboard/bookings');
    elsif new.status = 'completed' then
      update public.providers set orders_count = orders_count + 1 where id = new.provider_id;
      update public.bookings set completed_at = now(), payment_status = case when payment_status = 'held' then 'paid' else payment_status end where id = new.id;
      perform public.notify(new.customer_id, 'booking_completed', jsonb_build_object('id', new.code), '/dashboard/bookings?review=' || new.code);
    elsif new.status = 'cancelled' then
      update public.bookings set cancelled_at = now(), payment_status = case when payment_status = 'held' then 'refunded' else payment_status end where id = new.id;
    end if;
  end if;
  return null;
end $$;
create trigger bookings_after_insert after insert on public.bookings for each row execute function public.bookings_after_change();
create trigger bookings_after_update after update of status on public.bookings for each row execute function public.bookings_after_change();

-- status machine: who may move a booking where
create or replace function public.bookings_guard_status() returns trigger language plpgsql as $$
begin
  if new.status = old.status or public.is_admin() then return new; end if;
  if auth.uid() = old.customer_id and new.status = 'cancelled' and old.status in ('pending','confirmed') then return new; end if;
  if public.my_provider_id() = old.provider_id and (
       (old.status = 'pending' and new.status in ('confirmed','cancelled')) or
       (old.status = 'confirmed' and new.status in ('in_progress','cancelled')) or
       (old.status = 'in_progress' and new.status = 'completed')) then return new; end if;
  raise exception 'Illegal booking status transition % → %', old.status, new.status using errcode = '42501';
end $$;
create trigger bookings_status_guard before update of status on public.bookings for each row execute function public.bookings_guard_status();

-- messages → conversation timestamp + notification
create or replace function public.messages_after_insert() returns trigger language plpgsql security definer set search_path = public as $$
declare c record; recipient uuid; sender_name text;
begin
  select * into c from public.conversations where id = new.conversation_id;
  update public.conversations set last_message_at = new.created_at where id = c.id;
  select full_name into sender_name from public.users where id = new.sender_id;
  if new.sender_id = c.customer_id then select user_id into recipient from public.providers where id = c.provider_id; else recipient := c.customer_id; end if;
  perform public.notify(recipient, 'message', jsonb_build_object('name', coalesce(sender_name, '')), null);
  return null;
end $$;
create trigger messages_after_insert after insert on public.messages for each row execute function public.messages_after_insert();

-- reviews: only for completed bookings, only by the booking's customer
create or replace function public.reviews_require_completed_booking() returns trigger language plpgsql security definer set search_path = public as $$
declare b record;
begin
  if new.booking_id is null and new.booking_code is not null then select id into new.booking_id from public.bookings where code = new.booking_code; end if;
  select * into b from public.bookings where id = new.booking_id;
  if not found then raise exception 'Booking not found'; end if;
  if b.status <> 'completed' then raise exception 'Reviews are allowed only for completed bookings' using errcode = '23514'; end if;
  if b.customer_id <> new.author_id then raise exception 'Only the customer of this booking can review it' using errcode = '42501'; end if;
  new.provider_id := b.provider_id; new.booking_code := b.code;
  return new;
end $$;
create trigger reviews_validate before insert on public.reviews for each row execute function public.reviews_require_completed_booking();

-- incremental aggregate keeps historical ratings intact (hidden reviews do not count)
create or replace function public.reviews_refresh_rating() returns trigger language plpgsql security definer set search_path = public as $$
declare delta int := 0; val int;
begin
  if tg_op = 'INSERT' and new.status = 'published' then delta := 1; val := new.rating;
  elsif tg_op = 'DELETE' and old.status = 'published' then delta := -1; val := old.rating;
  elsif tg_op = 'UPDATE' and old.status = 'published' and new.status = 'hidden' then delta := -1; val := old.rating;
  elsif tg_op = 'UPDATE' and old.status <> 'published' and new.status = 'published' then delta := 1; val := new.rating;
  end if;
  if delta <> 0 then
    update public.providers p set
      rating = case when p.reviews_count + delta <= 0 then 0 else round((p.rating * p.reviews_count + delta * val) / (p.reviews_count + delta), 2) end,
      reviews_count = greatest(p.reviews_count + delta, 0)
    where p.id = coalesce(new.provider_id, old.provider_id);
  end if;
  if tg_op = 'INSERT' then perform public.notify(new.author_id, 'review_published', '{}'::jsonb, '/dashboard/reviews'); end if;
  return null;
end $$;
create trigger reviews_rating after insert or update of status or delete on public.reviews for each row execute function public.reviews_refresh_rating();

-- =====================================================================
-- RPC
-- =====================================================================
-- Admin approves / rejects a "become a specialist" application → creates provider, upgrades role, notifies
create or replace function public.review_provider_application(application_id uuid, decision text) returns uuid
language plpgsql security definer set search_path = public as $$
declare a record; pid uuid; base_slug text;
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  select * into a from public.provider_applications where id = application_id for update;
  if not found then raise exception 'application not found'; end if;
  if decision = 'rejected' then
    update public.provider_applications set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now() where id = a.id;
    return null;
  end if;
  base_slug := regexp_replace(lower(a.full_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(a.id::text, 1, 4);
  insert into public.providers (user_id, slug, display_name, profession, category_id, city_slug, about, price_from, experience_years, phone, is_verified, badges, status, weekly_hours)
  values (a.user_id, base_slug, a.full_name, jsonb_build_object('uz', a.services_text, 'ru', a.services_text, 'en', a.services_text), a.category_id, a.city_slug,
          jsonb_build_object('uz', a.description, 'ru', a.description, 'en', a.description), a.price_from, a.experience_years, a.phone, true, array['verified'], 'active', a.working_hours)
  on conflict (user_id) do update set is_verified = true, status = 'active'
  returning id into pid;
  update public.users set role = 'provider' where id = a.user_id and role = 'customer';
  update public.provider_applications set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), provider_id = pid where id = a.id;
  update public.provider_documents set provider_id = pid, status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where public.provider_documents.application_id = a.id;
  perform public.notify(a.user_id, 'verification_approved', '{}'::jsonb, '/provider-dashboard');
  return pid;
end $$;

create or replace function public.validate_promo(p_code text) returns smallint language sql stable security definer set search_path = public as $$
  select percent from public.promo_codes where code = upper(p_code) and is_active and uses < max_uses and expires_at >= current_date;
$$;

-- Free time slots for a provider on a given date (used by the booking flow)
create or replace function public.available_slots(p_provider uuid, p_date date, p_step interval default '30 minutes')
returns table (slot time) language sql stable security definer set search_path = public as $$
  select s::time from public.provider_availability a,
    generate_series(p_date + a.start_time, p_date + a.end_time - p_step, p_step) s
  where a.provider_id = p_provider and a.weekday = extract(dow from p_date)
    and not exists (select 1 from public.provider_time_off o where o.provider_id = p_provider and p_date between o.starts_on and o.ends_on)
    and not exists (select 1 from public.bookings b where b.provider_id = p_provider and b.scheduled_date = p_date and b.scheduled_time = s::time and b.status <> 'cancelled')
  order by 1;
$$;

-- Geo search (distance in km) — used by /search
create or replace function public.search_providers(p_category text default null, p_service text default null, p_city text default null,
  p_lat double precision default null, p_lng double precision default null, p_max_km double precision default 50,
  p_min_rating numeric default 0, p_max_price numeric default null, p_verified boolean default false, p_limit int default 50)
returns table (provider_id uuid, distance_km double precision, score numeric) language sql stable as $$
  select p.id,
    case when p_lat is null then null else 6371 * 2 * asin(sqrt(power(sin(radians(p.lat - p_lat) / 2), 2) + cos(radians(p_lat)) * cos(radians(p.lat)) * power(sin(radians(p.lng - p_lng) / 2), 2))) end as distance_km,
    (p.rating * 20 + ln(p.reviews_count + 1) * 8 + case when exists (select 1 from public.promotions pr where pr.provider_id = p.id and now() between pr.starts_at and pr.ends_at) then 25 else 0 end)::numeric as score
  from public.providers p
  where p.status = 'active' and not p.vacation_mode
    and (p_category is null or p.category_id = p_category)
    and (p_service is null or exists (select 1 from public.provider_service_types x where x.provider_id = p.id and x.service_type_slug = p_service))
    and (p_city is null or p.city_slug = p_city)
    and p.rating >= p_min_rating and (p_max_price is null or p.price_from <= p_max_price) and (not p_verified or p.is_verified)
  order by score desc
  limit p_limit;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.cities                enable row level security;
alter table public.categories            enable row level security;
alter table public.service_types         enable row level security;
alter table public.plans                 enable row level security;
alter table public.platform_settings     enable row level security;
alter table public.users                 enable row level security;
alter table public.providers             enable row level security;
alter table public.provider_service_types enable row level security;
alter table public.services              enable row level security;
alter table public.provider_portfolio    enable row level security;
alter table public.provider_availability enable row level security;
alter table public.provider_time_off     enable row level security;
alter table public.provider_applications enable row level security;
alter table public.provider_documents    enable row level security;
alter table public.bookings              enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;
alter table public.reviews               enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.promotions            enable row level security;
alter table public.promo_codes           enable row level security;
alter table public.payments              enable row level security;
alter table public.payment_events        enable row level security;
alter table public.favorites             enable row level security;
alter table public.notifications         enable row level security;
alter table public.reports               enable row level security;

-- public catalogs
create policy "catalog read"  on public.cities         for select using (true);
create policy "catalog admin" on public.cities         for all using (public.is_admin()) with check (public.is_admin());
create policy "catalog read"  on public.categories     for select using (true);
create policy "catalog admin" on public.categories     for all using (public.is_admin()) with check (public.is_admin());
create policy "catalog read"  on public.service_types  for select using (true);
create policy "catalog admin" on public.service_types  for all using (public.is_admin()) with check (public.is_admin());
create policy "plans read"    on public.plans          for select using (true);
create policy "plans admin"   on public.plans          for all using (public.is_admin()) with check (public.is_admin());
create policy "settings read" on public.platform_settings for select using (true);
create policy "settings admin" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

-- users
create policy "users self read"   on public.users for select using (id = auth.uid() or public.is_admin());
create policy "users self update" on public.users for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));
create policy "users admin"       on public.users for all using (public.is_admin()) with check (public.is_admin());

-- providers & their content
create policy "providers public read" on public.providers for select using (status = 'active' or user_id = auth.uid() or public.is_admin());
create policy "providers owner update" on public.providers for update using (user_id = auth.uid()) with check (user_id = auth.uid() and is_verified = (select is_verified from public.providers where user_id = auth.uid()) and plan = (select plan from public.providers where user_id = auth.uid()));
create policy "providers admin" on public.providers for all using (public.is_admin()) with check (public.is_admin());

create policy "pst read"  on public.provider_service_types for select using (true);
create policy "pst owner" on public.provider_service_types for all using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());

create policy "services read"  on public.services for select using (is_visible or provider_id = public.my_provider_id() or public.is_admin());
create policy "services owner" on public.services for all using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());

create policy "portfolio read"  on public.provider_portfolio for select using (true);
create policy "portfolio owner" on public.provider_portfolio for all using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());

create policy "availability read"  on public.provider_availability for select using (true);
create policy "availability owner" on public.provider_availability for all using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());
create policy "timeoff read"  on public.provider_time_off for select using (true);
create policy "timeoff owner" on public.provider_time_off for all using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());

create policy "applications own"   on public.provider_applications for select using (user_id = auth.uid() or public.is_admin());
create policy "applications insert" on public.provider_applications for insert with check (user_id = auth.uid());
create policy "applications admin" on public.provider_applications for update using (public.is_admin());

create policy "documents own read" on public.provider_documents for select using (public.is_admin() or provider_id = public.my_provider_id() or application_id in (select id from public.provider_applications where user_id = auth.uid()));
create policy "documents insert"   on public.provider_documents for insert with check (application_id in (select id from public.provider_applications where user_id = auth.uid()) or provider_id = public.my_provider_id());
create policy "documents admin"    on public.provider_documents for update using (public.is_admin());

-- bookings
create policy "bookings participants read" on public.bookings for select using (customer_id = auth.uid() or provider_id = public.my_provider_id() or public.is_admin());
create policy "bookings customer insert"   on public.bookings for insert with check (customer_id = auth.uid() and exists (select 1 from public.providers p where p.id = provider_id and p.status = 'active' and p.accepts_online));
create policy "bookings participants update" on public.bookings for update using (customer_id = auth.uid() or provider_id = public.my_provider_id() or public.is_admin());

-- chat
create policy "conversations participants" on public.conversations for select using (customer_id = auth.uid() or provider_id = public.my_provider_id() or public.is_admin());
create policy "conversations customer create" on public.conversations for insert with check (customer_id = auth.uid());
create policy "messages participants read" on public.messages for select using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or c.provider_id = public.my_provider_id())));
create policy "messages participants send" on public.messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or c.provider_id = public.my_provider_id())));
create policy "messages mark read" on public.messages for update using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.customer_id = auth.uid() or c.provider_id = public.my_provider_id())));

-- reviews
create policy "reviews public read" on public.reviews for select using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy "reviews author insert" on public.reviews for insert with check (author_id = auth.uid());
create policy "reviews provider reply" on public.reviews for update using (provider_id = public.my_provider_id()) with check (provider_id = public.my_provider_id());
create policy "reviews admin" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- money (writes only through service role / webhooks)
create policy "subscriptions own" on public.subscriptions for select using (provider_id = public.my_provider_id() or public.is_admin());
create policy "subscriptions admin" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());
create policy "promotions read" on public.promotions for select using (true);
create policy "promotions admin" on public.promotions for all using (public.is_admin()) with check (public.is_admin());
create policy "promo admin" on public.promo_codes for all using (public.is_admin()) with check (public.is_admin());
create policy "payments own" on public.payments for select using (user_id = auth.uid() or provider_id = public.my_provider_id() or public.is_admin());
create policy "payment events admin" on public.payment_events for select using (public.is_admin());

-- engagement
create policy "favorites own" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own" on public.notifications for select using (user_id = auth.uid());
create policy "notifications mark read" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reports insert" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports admin" on public.reports for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Realtime (chat, notifications, live booking status)
-- =====================================================================
alter publication supabase_realtime add table public.messages, public.notifications, public.bookings;

-- =====================================================================
-- Storage buckets & policies
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true), ('portfolio', 'portfolio', true),
  ('booking-photos', 'booking-photos', false), ('provider-documents', 'provider-documents', false), ('chat', 'chat', false)
on conflict (id) do nothing;

create policy "public buckets read" on storage.objects for select using (bucket_id in ('avatars', 'portfolio'));
create policy "auth upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'portfolio', 'booking-photos', 'chat', 'provider-documents') and owner = auth.uid());
create policy "owner manage" on storage.objects for update using (owner = auth.uid());
create policy "owner delete" on storage.objects for delete using (owner = auth.uid());
create policy "private read owner or admin" on storage.objects for select
  using (bucket_id in ('booking-photos', 'chat', 'provider-documents') and (owner = auth.uid() or public.is_admin()));
