import type { LText, Provider, ProviderService, PortfolioItem, PriceUnit, Badge, Locale, PlanId, WeeklyAvailability } from "@/lib/types";
import { getCity } from "./catalog";

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const CATEGORY_IMAGES: Record<string, string[]> = {
  repair: ["1585704032915-c3400ca199e7", "1504148455328-c376907d081c", "1581244277943-fe4a9c777189", "1621905252507-b35492cc74b4"],
  auto: ["1486262715619-67b85e0b08d3", "1487754180451-c456f719a1fc", "1625047509248-ec889cbff17f", "1619642751034-765dfdf7c58e"],
  home: ["1556909114-f6e7ad7d3136", "1555041469-a586c61ea9bc", "1586023492125-27b2c045efd7", "1600585154340-be6161a56a0c"],
  cleaning: ["1581578731548-c64695cc6952", "1584622650111-993a426fbf0a", "1563453392212-326f5e854473", "1527515637462-cff94eecc1ac"],
  it: ["1517694712202-14dd9538aa97", "1498050108023-c5249f4df085", "1461749280684-dccba630e2f6", "1551650975-87deedd944c3"],
  education: ["1503676260728-1c00da094a0b", "1434030216411-0b793f4b4173", "1513258496099-48168024aec0", "1427504494785-3a9ca7044f45"],
  beauty: ["1560066984-138dadb4c035", "1522337360788-8b13dee7a37e", "1487412947147-5cebf100ffc2", "1604654894610-df63bc536371"],
  photo: ["1502920917128-1aa500764cbd", "1519741497674-611481863552", "1516035069371-29a1b244cc32", "1452587925148-ce544e77e70d"],
  delivery: ["1600880292203-757bb62b4baf", "1566576912321-d58ddd7a6088", "1586528116311-ad8dd3c8310d", "1601584115197-04ecc0da31d7"],
  construction: ["1503387762-592deb58ef4e", "1541888946425-d81bb19240f5", "1504307651254-35680f356dfd", "1581094794329-c8112a89af12"],
  design: ["1618221195710-dd6b41faaea6", "1615874959474-d609969a20ed", "1561070791-2526d30994b5", "1586717791821-3f44a563fa4c"],
  electric: ["1621905251189-08b45d6a269e", "1558002038-1055907df827", "1513828583688-c52646db42da", "1565608087341-404b25492fee"],
};
export const categoryImage = (cat: string, i = 0, w = 900) => img(CATEGORY_IMAGES[cat]?.[i % 4] ?? CATEGORY_IMAGES.repair[0], w);

type Tpl = { name: LText; k: number; unit: PriceUnit; dur: number };
const SERVICE_TEMPLATES: Record<string, Tpl[]> = {
  repair: [
    { name: { uz: "Chaqiruv va diagnostika", ru: "Выезд и диагностика", en: "Call-out & diagnostics" }, k: 1, unit: "visit", dur: 45 },
    { name: { uz: "Smesitel almashtirish", ru: "Замена смесителя", en: "Faucet replacement" }, k: 1.6, unit: "job", dur: 60 },
    { name: { uz: "Quvur oqishini bartaraf etish", ru: "Устранение протечки", en: "Leak repair" }, k: 2.2, unit: "job", dur: 90 },
    { name: { uz: "Unitaz oʻrnatish", ru: "Установка унитаза", en: "Toilet installation" }, k: 3.5, unit: "job", dur: 150 },
  ],
  auto: [
    { name: { uz: "Kompyuter diagnostikasi", ru: "Компьютерная диагностика", en: "Computer diagnostics" }, k: 1, unit: "job", dur: 60 },
    { name: { uz: "Moy almashtirish", ru: "Замена масла", en: "Oil change" }, k: 0.8, unit: "job", dur: 40 },
    { name: { uz: "Tormoz kolodkalari", ru: "Замена тормозных колодок", en: "Brake pads" }, k: 1.8, unit: "job", dur: 90 },
    { name: { uz: "Xodovoy qism taʼmiri", ru: "Ремонт ходовой", en: "Suspension repair" }, k: 4, unit: "job", dur: 240 },
  ],
  home: [
    { name: { uz: "Bir soatlik usta", ru: "Мастер на час", en: "Handyman hour" }, k: 1, unit: "hour", dur: 60 },
    { name: { uz: "Shkaf yigʻish", ru: "Сборка шкафа", en: "Wardrobe assembly" }, k: 2.5, unit: "job", dur: 180 },
    { name: { uz: "Televizor osish", ru: "Повесить телевизор", en: "TV wall mounting" }, k: 1.5, unit: "job", dur: 60 },
    { name: { uz: "Parda karnizi oʻrnatish", ru: "Установка карниза", en: "Curtain rail install" }, k: 1.2, unit: "job", dur: 60 },
  ],
  cleaning: [
    { name: { uz: "Kundalik tozalash", ru: "Поддерживающая уборка", en: "Regular cleaning" }, k: 1, unit: "job", dur: 180 },
    { name: { uz: "Bosh tozalash", ru: "Генеральная уборка", en: "Deep cleaning" }, k: 2.2, unit: "job", dur: 360 },
    { name: { uz: "Taʼmirdan keyin tozalash", ru: "Уборка после ремонта", en: "Post-renovation cleaning" }, k: 3, unit: "job", dur: 480 },
    { name: { uz: "Deraza yuvish", ru: "Мойка окон", en: "Window cleaning" }, k: 0.6, unit: "job", dur: 120 },
  ],
  it: [
    { name: { uz: "Landing sahifa", ru: "Лендинг", en: "Landing page" }, k: 1, unit: "job", dur: 60 },
    { name: { uz: "Korporativ sayt", ru: "Корпоративный сайт", en: "Corporate website" }, k: 2.4, unit: "job", dur: 60 },
    { name: { uz: "Internet-doʻkon", ru: "Интернет-магазин", en: "E-commerce store" }, k: 4, unit: "job", dur: 60 },
    { name: { uz: "Konsultatsiya", ru: "Консультация", en: "Consultation" }, k: 0.08, unit: "hour", dur: 60 },
  ],
  education: [
    { name: { uz: "Individual dars", ru: "Индивидуальный урок", en: "1:1 lesson" }, k: 1, unit: "lesson", dur: 60 },
    { name: { uz: "IELTS tayyorlov", ru: "Подготовка к IELTS", en: "IELTS preparation" }, k: 1.5, unit: "lesson", dur: 90 },
    { name: { uz: "Sinov darsi", ru: "Пробный урок", en: "Trial lesson" }, k: 0.5, unit: "lesson", dur: 45 },
  ],
  beauty: [
    { name: { uz: "Soch turmagi", ru: "Укладка", en: "Hair styling" }, k: 1, unit: "job", dur: 60 },
    { name: { uz: "Kechki makiyaj", ru: "Вечерний макияж", en: "Evening make-up" }, k: 1.5, unit: "job", dur: 75 },
    { name: { uz: "Kelin obrazi", ru: "Образ невесты", en: "Bridal look" }, k: 4, unit: "job", dur: 180 },
  ],
  photo: [
    { name: { uz: "Portret syomka (1 soat)", ru: "Портретная съёмка (1 час)", en: "Portrait shoot (1h)" }, k: 1, unit: "hour", dur: 60 },
    { name: { uz: "Toʻy syomkasi", ru: "Свадебная съёмка", en: "Wedding coverage" }, k: 8, unit: "job", dur: 480 },
    { name: { uz: "Kontent-syomka", ru: "Контент-съёмка", en: "Content shoot" }, k: 2, unit: "job", dur: 180 },
  ],
  delivery: [
    { name: { uz: "Shahar ichida yuk tashish", ru: "Перевозка по городу", en: "In-city moving" }, k: 1, unit: "hour", dur: 60 },
    { name: { uz: "Yuk ortish (2 hammol)", ru: "Грузчики (2 человека)", en: "2 movers" }, k: 1.2, unit: "hour", dur: 60 },
    { name: { uz: "Kvartira koʻchishi", ru: "Квартирный переезд", en: "Apartment move" }, k: 4, unit: "job", dur: 300 },
  ],
  construction: [
    { name: { uz: "Kafel yotqizish", ru: "Укладка плитки", en: "Tile laying" }, k: 1, unit: "sqm", dur: 60 },
    { name: { uz: "Shpaklyovka va boʻyash", ru: "Шпаклёвка и покраска", en: "Plaster & paint" }, k: 0.6, unit: "sqm", dur: 60 },
    { name: { uz: "Hammom taʼmiri", ru: "Ремонт ванной под ключ", en: "Bathroom renovation" }, k: 40, unit: "job", dur: 60 },
  ],
  design: [
    { name: { uz: "Dizayn-loyiha (m²)", ru: "Дизайн-проект (м²)", en: "Design project (m²)" }, k: 0.1, unit: "sqm", dur: 60 },
    { name: { uz: "3D vizualizatsiya", ru: "3D-визуализация", en: "3D visualization" }, k: 0.8, unit: "job", dur: 60 },
    { name: { uz: "Logotip va brendbuk", ru: "Логотип и брендбук", en: "Logo & brand book" }, k: 1, unit: "job", dur: 60 },
  ],
  electric: [
    { name: { uz: "Rozetka/oʻchirgich almashtirish", ru: "Замена розетки/выключателя", en: "Socket/switch replacement" }, k: 1, unit: "job", dur: 30 },
    { name: { uz: "Lyustra oʻrnatish", ru: "Установка люстры", en: "Chandelier install" }, k: 2, unit: "job", dur: 60 },
    { name: { uz: "Elektr simlarini almashtirish", ru: "Замена проводки", en: "Rewiring" }, k: 25, unit: "job", dur: 480 },
    { name: { uz: "Avtomat oʻrnatish", ru: "Установка автоматов", en: "Breaker install" }, k: 1.5, unit: "job", dur: 45 },
  ],
};

const PORTFOLIO_TITLES: Record<string, LText[]> = {
  repair: [{ uz: "Hammom santexnikasi", ru: "Сантехника в ванной", en: "Bathroom plumbing" }, { uz: "Oshxona quvurlari", ru: "Трубы на кухне", en: "Kitchen pipes" }, { uz: "Isitish tizimi", ru: "Система отопления", en: "Heating system" }, { uz: "Smesitel oʻrnatish", ru: "Установка смесителя", en: "Faucet install" }],
  auto: [{ uz: "Dvigatel taʼmiri", ru: "Ремонт двигателя", en: "Engine repair" }, { uz: "Diagnostika", ru: "Диагностика", en: "Diagnostics" }, { uz: "Xodovoy qism", ru: "Ходовая часть", en: "Suspension" }, { uz: "Gʻildirak almashtirish", ru: "Шиномонтаж", en: "Tyre service" }],
  home: [{ uz: "Oshxona mebeli", ru: "Кухонный гарнитур", en: "Kitchen set" }, { uz: "Mehmonxona", ru: "Гостиная", en: "Living room" }, { uz: "Yotoqxona", ru: "Спальня", en: "Bedroom" }, { uz: "Interyer detallari", ru: "Детали интерьера", en: "Interior details" }],
  cleaning: [{ uz: "Bosh tozalash", ru: "Генеральная уборка", en: "Deep clean" }, { uz: "Hammom", ru: "Санузел", en: "Bathroom" }, { uz: "Ofis tozalash", ru: "Уборка офиса", en: "Office clean" }, { uz: "Oshxona", ru: "Кухня", en: "Kitchen" }],
  it: [{ uz: "Fintech dashboard", ru: "Финтех-дашборд", en: "Fintech dashboard" }, { uz: "Korporativ sayt", ru: "Корпоративный сайт", en: "Corporate site" }, { uz: "Mobil ilova", ru: "Мобильное приложение", en: "Mobile app" }, { uz: "CRM tizimi", ru: "CRM-система", en: "CRM system" }],
  education: [{ uz: "IELTS 7.5 natija", ru: "Результат IELTS 7.5", en: "IELTS 7.5 result" }, { uz: "Guruh darslari", ru: "Групповые занятия", en: "Group classes" }, { uz: "Onlayn kurs", ru: "Онлайн-курс", en: "Online course" }, { uz: "Imtihonga tayyorlov", ru: "Подготовка к экзамену", en: "Exam prep" }],
  beauty: [{ uz: "Kelin obrazi", ru: "Образ невесты", en: "Bridal look" }, { uz: "Soch turmagi", ru: "Укладка", en: "Styling" }, { uz: "Kechki makiyaj", ru: "Вечерний макияж", en: "Evening make-up" }, { uz: "Manikyur", ru: "Маникюр", en: "Manicure" }],
  photo: [{ uz: "Studiya syomkasi", ru: "Студийная съёмка", en: "Studio shoot" }, { uz: "Toʻy", ru: "Свадьба", en: "Wedding" }, { uz: "Portret", ru: "Портрет", en: "Portrait" }, { uz: "Mahsulot syomkasi", ru: "Предметная съёмка", en: "Product shoot" }],
  delivery: [{ uz: "Ofis koʻchishi", ru: "Офисный переезд", en: "Office move" }, { uz: "Yuk tashish", ru: "Грузоперевозка", en: "Cargo" }, { uz: "Ombor logistikasi", ru: "Складская логистика", en: "Warehouse" }, { uz: "Ekspress yetkazish", ru: "Экспресс-доставка", en: "Express delivery" }],
  construction: [{ uz: "Xususiy uy", ru: "Частный дом", en: "Private house" }, { uz: "Fasad", ru: "Фасад", en: "Facade" }, { uz: "Pardozlash", ru: "Отделка", en: "Finishing" }, { uz: "Kafel", ru: "Плитка", en: "Tiling" }],
  design: [{ uz: "Zamonaviy mehmonxona", ru: "Современная гостиная", en: "Modern living room" }, { uz: "Yotoqxona loyihasi", ru: "Проект спальни", en: "Bedroom project" }, { uz: "Brending", ru: "Брендинг", en: "Branding" }, { uz: "Kafe interyeri", ru: "Интерьер кафе", en: "Café interior" }],
  electric: [{ uz: "Elektr shchit", ru: "Электрощит", en: "Electrical panel" }, { uz: "Yoritish", ru: "Освещение", en: "Lighting" }, { uz: "Simlarni almashtirish", ru: "Замена проводки", en: "Rewiring" }, { uz: "Aqlli uy", ru: "Умный дом", en: "Smart home" }],
};

interface Def {
  id: string; name: string; g: "m" | "f"; av: number; cat: string; svc: string[]; city: string; district: string;
  prof: LText; rating: number; reviews: number; orders: number; price: number; resp: number; exp: number;
  langs: Locale[]; badges: Badge[]; plan: PlanId; joined: number; featured?: boolean; verified?: boolean;
}

const D: Def[] = [
  { id: "aziz-karimov", name: "Aziz Karimov", g: "m", av: 32, cat: "repair", svc: ["plumber", "appliance-repair"], city: "tashkent", district: "Yunusobod", prof: { uz: "Santexnik", ru: "Сантехник", en: "Plumber" }, rating: 4.9, reviews: 214, orders: 638, price: 80000, resp: 8, exp: 11, langs: ["uz", "ru"], badges: ["verified", "top", "fast"], plan: "premium", joined: 2021, featured: true },
  { id: "dilshod-rahimov", name: "Dilshod Rahimov", g: "m", av: 45, cat: "electric", svc: ["electrician"], city: "tashkent", district: "Chilonzor", prof: { uz: "Elektrik", ru: "Электрик", en: "Electrician" }, rating: 4.95, reviews: 187, orders: 512, price: 70000, resp: 5, exp: 9, langs: ["uz", "ru", "en"], badges: ["verified", "fast", "popular"], plan: "business", joined: 2022, featured: true },
  { id: "malika-yusupova", name: "Malika Yusupova", g: "f", av: 44, cat: "cleaning", svc: ["cleaning", "carpet-cleaning"], city: "tashkent", district: "Mirzo Ulugʻbek", prof: { uz: "Tozalash mutaxassisi", ru: "Специалист по уборке", en: "Cleaning pro" }, rating: 4.92, reviews: 301, orders: 845, price: 250000, resp: 12, exp: 6, langs: ["uz", "ru"], badges: ["verified", "popular", "top"], plan: "premium", joined: 2021, featured: true },
  { id: "jasur-tursunov", name: "Jasur Tursunov", g: "m", av: 12, cat: "auto", svc: ["car-mechanic", "car-diagnostics"], city: "tashkent", district: "Sergeli", prof: { uz: "Avtomexanik", ru: "Автомеханик", en: "Car mechanic" }, rating: 4.88, reviews: 156, orders: 402, price: 100000, resp: 15, exp: 14, langs: ["uz", "ru"], badges: ["verified", "popular"], plan: "pro", joined: 2022 },
  { id: "nodira-saidova", name: "Nodira Saidova", g: "f", av: 65, cat: "education", svc: ["english-tutor"], city: "tashkent", district: "Shayxontohur", prof: { uz: "Ingliz tili oʻqituvchisi", ru: "Преподаватель английского", en: "English teacher" }, rating: 5.0, reviews: 129, orders: 980, price: 120000, resp: 20, exp: 8, langs: ["uz", "ru", "en"], badges: ["verified", "top"], plan: "business", joined: 2020, featured: true },
  { id: "sardor-aliyev", name: "Sardor Aliyev", g: "m", av: 22, cat: "it", svc: ["web-developer", "computer-repair"], city: "tashkent", district: "Mirobod", prof: { uz: "Full-stack dasturchi", ru: "Full-stack разработчик", en: "Full-stack developer" }, rating: 4.97, reviews: 64, orders: 91, price: 2500000, resp: 25, exp: 7, langs: ["uz", "ru", "en"], badges: ["verified", "top"], plan: "pro", joined: 2023 },
  { id: "kamola-ergasheva", name: "Kamola Ergasheva", g: "f", av: 33, cat: "beauty", svc: ["makeup-artist", "hairdresser"], city: "tashkent", district: "Yakkasaroy", prof: { uz: "Vizajist-stilist", ru: "Визажист-стилист", en: "Make-up artist" }, rating: 4.93, reviews: 242, orders: 610, price: 300000, resp: 10, exp: 9, langs: ["uz", "ru"], badges: ["verified", "popular", "fast"], plan: "premium", joined: 2021 },
  { id: "bekzod-nazarov", name: "Bekzod Nazarov", g: "m", av: 51, cat: "photo", svc: ["photographer", "videographer"], city: "tashkent", district: "Olmazor", prof: { uz: "Fotograf va videograf", ru: "Фотограф и видеограф", en: "Photographer & videographer" }, rating: 4.91, reviews: 98, orders: 233, price: 500000, resp: 30, exp: 10, langs: ["uz", "ru", "en"], badges: ["verified", "top"], plan: "business", joined: 2021 },
  { id: "rustam-qodirov", name: "Rustam Qodirov", g: "m", av: 61, cat: "delivery", svc: ["movers", "courier"], city: "tashkent", district: "Bektemir", prof: { uz: "Yuk tashish xizmati", ru: "Грузоперевозки", en: "Moving service" }, rating: 4.82, reviews: 176, orders: 1204, price: 200000, resp: 6, exp: 12, langs: ["uz", "ru"], badges: ["verified", "fast", "popular"], plan: "pro", joined: 2020 },
  { id: "otabek-xolmatov", name: "Otabek Xolmatov", g: "m", av: 75, cat: "construction", svc: ["tiling", "renovation"], city: "tashkent", district: "Uchtepa", prof: { uz: "Taʼmir brigadasi rahbari", ru: "Бригадир по ремонту", en: "Renovation foreman" }, rating: 4.86, reviews: 87, orders: 143, price: 90000, resp: 40, exp: 16, langs: ["uz", "ru"], badges: ["verified", "top"], plan: "business", joined: 2020 },
  { id: "nilufar-azimova", name: "Nilufar Azimova", g: "f", av: 17, cat: "design", svc: ["interior-designer", "graphic-designer"], city: "tashkent", district: "Mirzo Ulugʻbek", prof: { uz: "Interyer dizayneri", ru: "Дизайнер интерьера", en: "Interior designer" }, rating: 4.96, reviews: 52, orders: 77, price: 1000000, resp: 35, exp: 7, langs: ["uz", "ru", "en"], badges: ["verified", "top"], plan: "premium", joined: 2022 },
  { id: "farrux-ismoilov", name: "Farrux Ismoilov", g: "m", av: 8, cat: "repair", svc: ["ac-repair", "appliance-repair"], city: "tashkent", district: "Yashnobod", prof: { uz: "Konditsioner ustasi", ru: "Мастер по кондиционерам", en: "AC technician" }, rating: 4.84, reviews: 133, orders: 377, price: 120000, resp: 9, exp: 8, langs: ["uz", "ru"], badges: ["verified", "fast"], plan: "pro", joined: 2022 },
  { id: "shahzod-mirzayev", name: "Shahzod Mirzayev", g: "m", av: 36, cat: "home", svc: ["handyman", "furniture-assembly"], city: "tashkent", district: "Yunusobod", prof: { uz: "Bir soatlik usta", ru: "Мастер на час", en: "Handyman" }, rating: 4.89, reviews: 205, orders: 690, price: 70000, resp: 7, exp: 6, langs: ["uz", "ru"], badges: ["verified", "fast", "popular"], plan: "pro", joined: 2022 },
  { id: "gulnora-hasanova", name: "Gulnora Hasanova", g: "f", av: 50, cat: "cleaning", svc: ["cleaning"], city: "samarkand", district: "Markaz", prof: { uz: "Tozalash xizmati", ru: "Клининг", en: "Cleaning service" }, rating: 4.87, reviews: 118, orders: 356, price: 200000, resp: 14, exp: 5, langs: ["uz", "ru"], badges: ["verified", "popular"], plan: "pro", joined: 2023 },
  { id: "timur-usmonov", name: "Timur Usmonov", g: "m", av: 41, cat: "electric", svc: ["electrician"], city: "samarkand", district: "Registon", prof: { uz: "Elektrik", ru: "Электрик", en: "Electrician" }, rating: 4.9, reviews: 96, orders: 288, price: 60000, resp: 11, exp: 10, langs: ["uz", "ru"], badges: ["verified", "fast"], plan: "free", joined: 2023 },
  { id: "ulugbek-sobirov", name: "Ulugʻbek Sobirov", g: "m", av: 67, cat: "auto", svc: ["car-mechanic"], city: "bukhara", district: "Markaz", prof: { uz: "Avtoelektrik", ru: "Автоэлектрик", en: "Auto electrician" }, rating: 4.85, reviews: 74, orders: 210, price: 90000, resp: 18, exp: 13, langs: ["uz", "ru"], badges: ["verified"], plan: "pro", joined: 2022 },
  { id: "lola-rahimova", name: "Lola Rahimova", g: "f", av: 26, cat: "education", svc: ["math-tutor"], city: "andijan", district: "Markaz", prof: { uz: "Matematika repetitori", ru: "Репетитор математики", en: "Math tutor" }, rating: 4.98, reviews: 88, orders: 530, price: 100000, resp: 16, exp: 12, langs: ["uz", "ru"], badges: ["verified", "top"], plan: "pro", joined: 2021 },
  { id: "islom-mahmudov", name: "Islom Mahmudov", g: "m", av: 15, cat: "repair", svc: ["plumber"], city: "namangan", district: "Markaz", prof: { uz: "Santexnik", ru: "Сантехник", en: "Plumber" }, rating: 4.8, reviews: 63, orders: 190, price: 70000, resp: 10, exp: 7, langs: ["uz"], badges: ["verified", "fast"], plan: "free", joined: 2024 },
  { id: "sevara-qosimova", name: "Sevara Qosimova", g: "f", av: 12, cat: "beauty", svc: ["hairdresser"], city: "fergana", district: "Markaz", prof: { uz: "Sartarosh-stilist", ru: "Парикмахер-стилист", en: "Hair stylist" }, rating: 4.9, reviews: 140, orders: 420, price: 80000, resp: 13, exp: 8, langs: ["uz", "ru"], badges: ["verified", "popular"], plan: "pro", joined: 2022 },
  { id: "akmal-jurayev", name: "Akmal Joʻrayev", g: "m", av: 85, cat: "repair", svc: ["ac-repair", "plumber"], city: "qarshi", district: "Markaz", prof: { uz: "Universal usta", ru: "Универсальный мастер", en: "All-round technician" }, rating: 4.83, reviews: 57, orders: 165, price: 80000, resp: 12, exp: 9, langs: ["uz", "ru"], badges: ["verified", "fast"], plan: "pro", joined: 2023 },
  { id: "davron-tojiyev", name: "Davron Tojiyev", g: "m", av: 29, cat: "construction", svc: ["renovation", "tiling"], city: "nukus", district: "Markaz", prof: { uz: "Quruvchi", ru: "Строитель", en: "Builder" }, rating: 4.78, reviews: 41, orders: 98, price: 85000, resp: 45, exp: 15, langs: ["uz", "ru"], badges: ["verified"], plan: "free", joined: 2023 },
  { id: "madina-karimova", name: "Madina Karimova", g: "f", av: 57, cat: "photo", svc: ["photographer"], city: "urgench", district: "Markaz", prof: { uz: "Fotograf", ru: "Фотограф", en: "Photographer" }, rating: 4.94, reviews: 69, orders: 182, price: 400000, resp: 22, exp: 6, langs: ["uz", "ru", "en"], badges: ["verified", "popular"], plan: "pro", joined: 2022 },
  { id: "elyor-hamidov", name: "Elyor Hamidov", g: "m", av: 54, cat: "it", svc: ["computer-repair", "web-developer"], city: "jizzakh", district: "Markaz", prof: { uz: "Kompyuter ustasi", ru: "Компьютерный мастер", en: "Computer technician" }, rating: 4.81, reviews: 48, orders: 150, price: 100000, resp: 15, exp: 5, langs: ["uz", "ru"], badges: ["verified"], plan: "free", joined: 2024 },
  { id: "sanjar-normatov", name: "Sanjar Normatov", g: "m", av: 3, cat: "delivery", svc: ["movers"], city: "samarkand", district: "Siyob", prof: { uz: "Yuk tashish", ru: "Грузоперевозки", en: "Movers" }, rating: 4.79, reviews: 82, orders: 460, price: 180000, resp: 9, exp: 8, langs: ["uz", "ru"], badges: ["verified", "fast"], plan: "pro", joined: 2023 },
  { id: "dilnoza-tursunova", name: "Dilnoza Tursunova", g: "f", av: 79, cat: "design", svc: ["graphic-designer"], city: "bukhara", district: "Markaz", prof: { uz: "Grafik dizayner", ru: "Графический дизайнер", en: "Graphic designer" }, rating: 4.92, reviews: 37, orders: 66, price: 400000, resp: 28, exp: 5, langs: ["uz", "ru", "en"], badges: ["verified"], plan: "pro", joined: 2024 },
  { id: "bobur-ergashev", name: "Bobur Ergashev", g: "m", av: 70, cat: "home", svc: ["furniture-assembly", "handyman"], city: "tashkent", district: "Sergeli", prof: { uz: "Mebel ustasi", ru: "Мебельщик", en: "Furniture assembler" }, rating: 4.74, reviews: 61, orders: 205, price: 100000, resp: 20, exp: 4, langs: ["uz"], badges: ["verified"], plan: "free", joined: 2024 },
];

// deterministic pseudo-random
const seeded = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 10000) / 10000; };

const about = (d: Def): LText => ({
  uz: `Salom! Men ${d.name}, ${d.exp} yillik tajribaga ega ${d.prof.uz.toLowerCase()}man. Ishni oʻz vaqtida, toza va kafolat bilan bajaraman. Barcha materiallar va asboblar oʻzimda. Narxlar oldindan kelishiladi — yashirin toʻlovlarsiz.`,
  ru: `Здравствуйте! Меня зовут ${d.name}, я ${d.prof.ru.toLowerCase()} с опытом ${d.exp} лет. Работаю аккуратно, вовремя и с гарантией. Свои инструменты и расходники. Стоимость согласуем заранее — без скрытых доплат.`,
  en: `Hi! I'm ${d.name}, a ${d.prof.en.toLowerCase()} with ${d.exp} years of experience. I work cleanly, on time and with a warranty. I bring my own tools and materials. Prices are agreed upfront — no hidden fees.`,
});

function availability(r: () => number): WeeklyAvailability {
  const start = 8 + Math.floor(r() * 3);
  const end = 18 + Math.floor(r() * 4);
  return { 0: r() > 0.5 ? [10, 16] : null, 1: [start, end], 2: [start, end], 3: [start, end], 4: [start, end], 5: [start, end], 6: [10, end - 2] };
}

/* ---- generated specialists so every city/category has realistic density ---- */
const M_NAMES = ["Behruz", "Doniyor", "Eldor", "Fazliddin", "Gʻayrat", "Hasan", "Ibrohim", "Jamshid", "Kamron", "Laziz", "Mirjalol", "Nodir", "Oybek", "Pulat", "Rashid", "Sarvar", "Toxir", "Umid", "Vohid", "Xurshid", "Yusuf", "Zafar", "Abror", "Bahrom", "Shavkat", "Ravshan", "Alisher", "Ilhom", "Murod", "Sherzod"];
const F_NAMES = ["Aziza", "Barno", "Dilfuza", "Gulchehra", "Hilola", "Iroda", "Jamila", "Kamila", "Lobar", "Muxlisa", "Nigora", "Oydin", "Rayhona", "Sabina", "Umida", "Xadicha", "Yulduz", "Zuhra", "Mohira", "Shahnoza"];
const SURNAMES = ["Abdullayev", "Boboyev", "Davletov", "Eshmatov", "Fayziyev", "Gʻaniyev", "Hamroyev", "Islomov", "Joʻrayev", "Latipov", "Mamatov", "Normurodov", "Olimov", "Poʻlatov", "Rahmonov", "Sultonov", "Toʻxtayev", "Umarov", "Valiyev", "Xasanov", "Yoʻldoshev", "Zokirov"];
const DISTRICTS: Record<string, string[]> = { tashkent: ["Yunusobod", "Chilonzor", "Mirzo Ulugʻbek", "Yakkasaroy", "Shayxontohur", "Olmazor", "Sergeli", "Yashnobod", "Mirobod", "Uchtepa"], default: ["Markaz", "Shimoliy", "Janubiy"] };
const FEMALE_CATS = new Set(["cleaning", "beauty", "education", "design"]);
const CAT_SERVICES: Record<string, { slug: string; prof: LText; price: number }[]> = {
  repair: [{ slug: "plumber", prof: { uz: "Santexnik", ru: "Сантехник", en: "Plumber" }, price: 75000 }, { slug: "ac-repair", prof: { uz: "Konditsioner ustasi", ru: "Мастер по кондиционерам", en: "AC technician" }, price: 110000 }, { slug: "appliance-repair", prof: { uz: "Texnika ustasi", ru: "Мастер по технике", en: "Appliance technician" }, price: 90000 }],
  auto: [{ slug: "car-mechanic", prof: { uz: "Avtomexanik", ru: "Автомеханик", en: "Car mechanic" }, price: 100000 }, { slug: "car-diagnostics", prof: { uz: "Diagnost", ru: "Автодиагност", en: "Diagnostics specialist" }, price: 140000 }],
  home: [{ slug: "handyman", prof: { uz: "Bir soatlik usta", ru: "Мастер на час", en: "Handyman" }, price: 70000 }, { slug: "furniture-assembly", prof: { uz: "Mebel ustasi", ru: "Сборщик мебели", en: "Furniture assembler" }, price: 95000 }],
  cleaning: [{ slug: "cleaning", prof: { uz: "Tozalash mutaxassisi", ru: "Специалист по уборке", en: "Cleaner" }, price: 220000 }, { slug: "carpet-cleaning", prof: { uz: "Gilam yuvish", ru: "Химчистка ковров", en: "Carpet cleaner" }, price: 15000 }],
  it: [{ slug: "computer-repair", prof: { uz: "Kompyuter ustasi", ru: "Компьютерный мастер", en: "Computer technician" }, price: 100000 }, { slug: "web-developer", prof: { uz: "Veb-dasturchi", ru: "Веб-разработчик", en: "Web developer" }, price: 2200000 }],
  education: [{ slug: "english-tutor", prof: { uz: "Ingliz tili repetitori", ru: "Репетитор английского", en: "English tutor" }, price: 110000 }, { slug: "math-tutor", prof: { uz: "Matematika repetitori", ru: "Репетитор математики", en: "Math tutor" }, price: 90000 }],
  beauty: [{ slug: "hairdresser", prof: { uz: "Sartarosh", ru: "Парикмахер", en: "Hairdresser" }, price: 80000 }, { slug: "makeup-artist", prof: { uz: "Vizajist", ru: "Визажист", en: "Make-up artist" }, price: 280000 }],
  photo: [{ slug: "photographer", prof: { uz: "Fotograf", ru: "Фотограф", en: "Photographer" }, price: 450000 }, { slug: "videographer", prof: { uz: "Videograf", ru: "Видеограф", en: "Videographer" }, price: 750000 }],
  delivery: [{ slug: "movers", prof: { uz: "Yuk tashish", ru: "Грузоперевозки", en: "Movers" }, price: 180000 }, { slug: "courier", prof: { uz: "Kuryer", ru: "Курьер", en: "Courier" }, price: 25000 }],
  construction: [{ slug: "tiling", prof: { uz: "Kafelchi", ru: "Плиточник", en: "Tiler" }, price: 85000 }, { slug: "renovation", prof: { uz: "Taʼmirchi usta", ru: "Мастер по ремонту", en: "Renovation pro" }, price: 1400000 }],
  design: [{ slug: "interior-designer", prof: { uz: "Interyer dizayneri", ru: "Дизайнер интерьера", en: "Interior designer" }, price: 900000 }, { slug: "graphic-designer", prof: { uz: "Grafik dizayner", ru: "Графический дизайнер", en: "Graphic designer" }, price: 350000 }],
  electric: [{ slug: "electrician", prof: { uz: "Elektrik", ru: "Электрик", en: "Electrician" }, price: 65000 }],
};
const OTHER_CITIES = ["samarkand", "bukhara", "andijan", "namangan", "fergana", "qarshi", "nukus", "urgench", "jizzakh"];
function generated(): Def[] {
  const out: Def[] = [];
  let k = 0, cityPtr = 0;
  for (const [cat, svcs] of Object.entries(CAT_SERVICES)) {
    svcs.forEach((sv, si) => {
      const perService = cat === "repair" || cat === "cleaning" || cat === "electric" ? 6 : 4;
      for (let j = 0; j < perService; j++) {
        k++;
        const r = seeded(`${cat}-${si}-${j}`);
        const female = FEMALE_CATS.has(cat) ? r() > 0.25 : r() > 0.92;
        const first = female ? F_NAMES[(k * 7) % F_NAMES.length] : M_NAMES[(k * 11) % M_NAMES.length];
        const last = SURNAMES[(k * 5 + j) % SURNAMES.length] + (female ? "a" : "");
        const city = j < Math.ceil(perService / 2) ? "tashkent" : OTHER_CITIES[cityPtr++ % OTHER_CITIES.length];
        const dlist = DISTRICTS[city] ?? DISTRICTS.default;
        const rating = Math.round((4.55 + r() * 0.45) * 100) / 100;
        const reviews = 12 + Math.floor(r() * 160);
        const badges: Badge[] = ["verified"];
        if (rating > 4.9 && reviews > 90) badges.push("top");
        if (reviews > 110) badges.push("popular");
        const resp = 4 + Math.floor(r() * 40);
        if (resp < 12) badges.push("fast");
        out.push({
          id: `${first}-${last}`.toLowerCase().replace(/[ʻʼ']/g, "").replace(/[^a-z0-9]+/g, "-") + `-${k}`,
          name: `${first} ${last}`, g: female ? "f" : "m", av: (k * 13 + j * 7) % 95 + 1, cat, svc: [sv.slug], city, district: dlist[(k + j) % dlist.length],
          prof: sv.prof, rating: Math.min(rating, 5), reviews, orders: reviews * 2 + Math.floor(r() * 300), price: Math.round((sv.price * (0.8 + r() * 0.5)) / 5000) * 5000,
          resp, exp: 2 + Math.floor(r() * 15), langs: r() > 0.6 ? ["uz", "ru", "en"] : r() > 0.2 ? ["uz", "ru"] : ["uz"], badges,
          plan: (["free", "pro", "pro", "business", "free"] as PlanId[])[k % 5], joined: 2020 + Math.floor(r() * 6), verified: r() > 0.06,
        });
      }
    });
  }
  return out;
}

export const PROVIDERS: Provider[] = [...D, ...generated()].map((d) => {
  const r = seeded(d.id);
  const city = getCity(d.city)!;
  const services: ProviderService[] = (SERVICE_TEMPLATES[d.cat] ?? []).map((t, i) => ({
    id: `${d.id}-s${i + 1}`, name: t.name, unit: t.unit, durationMin: t.dur,
    price: Math.round((d.price * t.k) / 5000) * 5000 || 5000,
  }));
  const portfolio: PortfolioItem[] = (PORTFOLIO_TITLES[d.cat] ?? []).map((title, i) => ({
    id: `${d.id}-p${i + 1}`, title, image: categoryImage(d.cat, i + Math.floor(r() * 2)),
    completedAt: new Date(2026, 8 - i * 2, 3 + Math.floor(r() * 20)).toISOString(),
  }));
  return {
    id: d.id, name: d.name, gender: d.g,
    avatar: `https://randomuser.me/api/portraits/${d.g === "m" ? "men" : "women"}/${d.av}.jpg`,
    profession: d.prof, categoryId: d.cat, serviceSlugs: d.svc, citySlug: d.city, district: d.district,
    lat: city.lat + (r() - 0.5) * 0.09, lng: city.lng + (r() - 0.5) * 0.13,
    rating: d.rating, reviewsCount: d.reviews, ordersCount: d.orders, priceFrom: d.price,
    priceUnit: services[0]?.unit ?? "job", responseMinutes: d.resp, experienceYears: d.exp,
    languages: d.langs, verified: d.verified ?? true, badges: d.verified === false ? d.badges.filter((b) => b !== "verified") : d.badges, about: about(d), services, portfolio,
    availability: availability(r), plan: d.plan,
    phone: `+998 ${90 + Math.floor(r() * 9)} ${100 + Math.floor(r() * 899)} ${10 + Math.floor(r() * 89)} ${10 + Math.floor(r() * 89)}`,
    joinedYear: d.joined, featured: d.featured, status: "active",
  };
});

export const getProvider = (id: string) => PROVIDERS.find((p) => p.id === id);
