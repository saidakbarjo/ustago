# USTAGO — маркетплейс услуг нового поколения для Узбекистана

Найдите проверенного специалиста за несколько минут: ремонт, электрика, сантехника, уборка, авто, IT, строительство, доставка, красота, обучение, фото/видео.

**Стек:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · компоненты в стиле shadcn/ui (Radix) · Framer Motion · Recharts · Leaflet (OSM/CARTO или Mapbox) · Zustand · Supabase (PostgreSQL, Auth, Storage, Realtime).

---

## Быстрый старт (DEMO-режим, без бэкенда)

```bash
npm install
npm run dev        # http://localhost:3000
```

Без переменных Supabase приложение работает в **демо-режиме**: все действия (бронирования, чат, отзывы, регистрация специалиста, админка) реально выполняются и сохраняются в `localStorage` браузера. На странице `/login` есть кнопки быстрого входа: **Клиент / Специалист / Админ**.

Сценарии, которые работают от начала до конца:

| Сценарий | Путь |
|---|---|
| Поиск → Результаты → Профиль → Бронирование → Кабинет | `/` → `/search` → `/provider/[id]` → `/book/[id]` → `/dashboard/bookings` |
| Бронирование → Чат → Завершение → Отзыв | `/dashboard/messages` → `/provider-dashboard/orders` (Принять → Начать → Завершить) → `/dashboard/bookings` → «Оставить отзыв» |
| Регистрация специалиста → Верификация → Кабинет | `/become-a-specialist` → (`/admin/verification` → Одобрить) → `/provider-dashboard` |
| Админ → Пользователи / Специалисты / Заказы / Платежи | `/admin/*` (тарифы, комиссии и промокоды сразу влияют на `/pricing` и на бронирование) |

Промокоды для теста: `USTAGO10`, `WELCOME15`.

---

## Подключение Supabase (production)

1. Создайте проект на supabase.com, скопируйте `.env.example` → `.env.local` и заполните `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. Примените схему и сид:
   ```bash
   supabase db push                 # supabase/migrations/0001_init.sql
   psql "$DATABASE_URL" -f supabase/seed.sql   # или: supabase db reset
   ```
   `seed.sql` генерируется из типизированных данных: `npm run seed:generate`.
3. Назначьте себе роль админа: `update public.users set role = 'admin' where email = 'you@example.com';`

После этого `lib/supabase/repository.ts` автоматически дублирует все действия в PostgreSQL, чат подписывается на Supabase Realtime, а `middleware.ts` обновляет сессию.

### База данных (`supabase/migrations/0001_init.sql`)

Таблицы: `users`, `providers`, `categories`, `services`, `service_types`, `bookings`, `conversations`, `messages`, `reviews`, `payments`, `payment_events`, `favorites`, `notifications`, `provider_documents`, `provider_applications`, `provider_portfolio`, `provider_availability`, `provider_time_off`, `cities`, `promotions`, `promo_codes`, `subscriptions`, `plans`, `platform_settings`, `reports`.

Бизнес-логика на уровне БД (проверено на PostgreSQL 16):

- **RLS** на всех таблицах: клиент видит только свои заказы, специалист — свои, админ — всё; нельзя повысить себе роль.
- **Триггеры**: расчёт сервисного сбора и промокода, уведомления на каждое событие, автосоздание диалога при заказе, защита от двойного бронирования одного слота, машина статусов заказа (кто и куда может перевести), счётчик выполненных заказов.
- **Отзывы** принимаются только по завершённому заказу и только от его клиента; рейтинг специалиста пересчитывается автоматически.
- **RPC**: `review_provider_application` (одобрение специалиста → создание профиля, роль, уведомление), `available_slots`, `search_providers` (гео-поиск с учётом продвижения), `validate_promo`.
- **Storage**: бакеты `avatars`, `portfolio` (публичные), `booking-photos`, `provider-documents`, `chat` (приватные) с политиками.
- **Realtime**: `messages`, `notifications`, `bookings`.

---

## Платежи

Архитектура в `lib/payments/` — единый интерфейс `PaymentGateway` и адаптеры:

| Шлюз | Создание оплаты | Callback |
|---|---|---|
| Click | `my.click.uz/services/pay` | `POST /api/payments/click` (Prepare/Complete, проверка MD5-подписи) |
| Payme | `checkout.paycom.uz` (base64) | `POST /api/payments/payme` (JSON-RPC: Check/Create/Perform/Cancel) |
| Uzum Bank | register order → redirect | `POST /api/payments/uzum` |
| Stripe (международные карты, подписки в USD) | Checkout Session | `POST /api/payments/stripe` (HMAC-подпись) |

`POST /api/payments/checkout` возвращает `redirectUrl`. Все события пишутся в `payment_events` (аудит, идемпотентность) и обновляют `payments`/`bookings`.

---

## Монетизация

Тарифы FREE / PRO $9 / BUSINESS $25 / PREMIUM $50, комиссия с заказа по тарифу (15/10/8/5%), сервисный сбор с клиента (5%), Featured listing, Sponsored placement, Promoted profile, промокоды. Всё редактируется в `/admin/monetization` и `/admin/promotions`.

## Локализация

`lib/i18n/{uz,ru,en}.ts` — полные словари (по умолчанию **узбекский**). Переключатель `UZ | RU | EN` в навбаре сохраняет выбор в cookie, поэтому серверные SEO-страницы и метаданные рендерятся на выбранном языке. Данные (категории, города, услуги) хранятся как `{uz, ru, en}`.

## SEO

- Чистые URL: `/services/plumber`, `/services/electrician`, `/services/cleaning`, `/city/tashkent`, `/city/samarkand`, `/provider/[id]`, `/categories`, `/cities`
- `generateMetadata` на каждой странице, canonical, Open Graph
- JSON-LD: Organization, WebSite + SearchAction, FAQPage, Service + AggregateOffer, LocalBusiness + AggregateRating, BreadcrumbList, ItemList
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, статическая генерация страниц услуг и городов

## Структура

```
app/
  (site)/            главная, /search, /provider/[id], /services/[slug], /city/[slug], /cities, /categories, /pricing, /become-a-specialist
  (auth)/            /login, /signup
  book/[id]/         6-шаговый booking flow
  dashboard/         кабинет клиента (8 разделов)
  provider-dashboard/ кабинет специалиста (11 разделов)
  admin/             админ-панель (13 разделов)
  api/payments/      checkout + webhooks Click / Payme / Uzum / Stripe
components/          UI-кит, лендинг, карточки, чат, карта, графики, формы
lib/                 types, data (каталог + демо-данные), store, i18n, search, analytics, supabase, payments
supabase/            миграция, seed
```

## Деплой

### GitHub Pages (как AutoHelp)

Каждый push в `main` автоматически собирает статическую версию (`npm run build:pages` → папка `out/`) и публикует её через GitHub Actions (`.github/workflows/deploy-pages.yml`). Сайт открывается по адресу `https://<логин>.github.io/<репозиторий>/`. В статической версии работает всё, кроме серверных webhook-ов оплаты — для них нужен Vercel.

### Vercel

Vercel: импортируйте репозиторий, добавьте переменные окружения из `.env.example`, `npm run build`. Укажите `NEXT_PUBLIC_SITE_URL` для корректных canonical/sitemap.
