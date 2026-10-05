"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarCheck, Check, CheckCheck, ImagePlus, MapPin, MessageCircle, Paperclip, Search, Send, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { DEMO_PROVIDER_ID, getProviderById, useHydrated, useStore } from "@/lib/store";
import { repo } from "@/lib/supabase/repository";
import { getCity } from "@/lib/data/catalog";
import { Avatar } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { StatusPill } from "@/components/layout/dashboard-shell";
import type { Message } from "@/lib/types";
import { cn, fileToDataUrl } from "@/lib/utils";

const timeOf = (iso: string) => new Date(iso).toTimeString().slice(0, 5);

function BookingCardMsg({ id, mine }: { id: string; mine: boolean }) {
  const { t, tx, price, locale } = useI18n();
  const b = useStore((s) => s.bookings.find((x) => x.id === id));
  if (!b) return null;
  const p = getProviderById(b.providerId);
  const svc = p?.services.find((s) => s.id === b.serviceId);
  return (
    <div className={cn("w-[260px] overflow-hidden rounded-[18px] border bg-white text-foreground", mine && "border-white/20")}>
      <div className="flex items-center gap-2 border-b bg-secondary/60 px-3 py-2 text-xs font-semibold"><CalendarCheck className="h-4 w-4 text-primary" />{t("chat.booking")} {b.id}</div>
      <div className="space-y-1 p-3 text-sm">
        <p className="font-semibold">{tx(svc?.name)}</p>
        <p className="text-muted-foreground">{formatDate(b.date, locale, { day: "numeric", month: "long" })} · {b.time}</p>
        <div className="flex items-center justify-between pt-1"><StatusPill status={b.status} /><span className="font-display font-bold">{price(b.total)}</span></div>
      </div>
    </div>
  );
}

function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  const { t } = useI18n();
  const body = (() => {
    if (m.kind === "booking" && m.bookingId) return <BookingCardMsg id={m.bookingId} mine={mine} />;
    if (m.kind === "image" && m.image) return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.image} alt={t("chat.photo")} className="max-h-64 w-60 rounded-[18px] object-cover" />
    );
    if (m.kind === "location" && m.location) {
      const { lat, lng, label } = m.location;
      return (
        <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`} target="_blank" rel="noreferrer" className="block w-[240px] overflow-hidden rounded-[18px] border bg-white text-foreground">
          <div className="relative h-24 bg-[#e8edf7]">
            <svg viewBox="0 0 240 96" className="absolute inset-0 h-full w-full"><path d="M0 50 Q60 30 120 52 T240 40" stroke="#fff" strokeWidth="10" fill="none" /><path d="M90 0 L100 96" stroke="#fff" strokeWidth="6" /><path d="M170 0 Q160 50 190 96" stroke="#fff" strokeWidth="5" fill="none" /></svg>
            <span className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center"><span className="absolute h-6 w-6 animate-pulse-ring rounded-full bg-primary" /><MapPin className="relative h-7 w-7 fill-primary text-white" /></span>
          </div>
          <div className="flex items-center gap-2 p-3 text-sm"><MapPin className="h-4 w-4 text-primary" /><span className="flex-1 truncate font-medium">{label}</span><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></div>
        </a>
      );
    }
    return <div className={cn("max-w-[78vw] whitespace-pre-wrap rounded-[20px] px-4 py-2.5 text-[15px] leading-snug sm:max-w-md", mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-white text-foreground shadow-sm ring-1 ring-black/5")}>{m.text}</div>;
  })();
  return (
    <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }} className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      {body}
      <span className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">{timeOf(m.at)}{mine && (m.read ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Check className="h-3.5 w-3.5" />)}</span>
    </motion.div>
  );
}

export function Chat({ audience }: { audience: "user" | "provider" }) {
  const { t, tx, locale } = useI18n();
  const hydrated = useHydrated();
  const sp = useSearchParams();
  const router = useRouter();
  const session = useStore((s) => s.session);
  const conversations = useStore((s) => s.conversations);
  const messages = useStore((s) => s.messages);
  const typing = useStore((s) => s.typing);
  const users = useStore((s) => s.users);
  const bookings = useStore((s) => s.bookings);
  const sendMessage = useStore((s) => s.sendMessage);
  const markRead = useStore((s) => s.markConversationRead);
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [attach, setAttach] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const myProviderId = session?.providerId ?? DEMO_PROVIDER_ID;

  const convs = useMemo(() => {
    const list = conversations.filter((c) => (audience === "user" ? c.userId === (session?.userId ?? "u-demo") : c.providerId === myProviderId));
    return list
      .map((c) => {
        const msgs = messages.filter((m) => m.conversationId === c.id);
        const last = msgs[msgs.length - 1];
        const other = audience === "user" ? { name: getProviderById(c.providerId)?.name ?? "—", avatar: getProviderById(c.providerId)?.avatar, sub: tx(getProviderById(c.providerId)?.profession) }
          : { name: users.find((u) => u.id === c.userId)?.name ?? "Customer", avatar: users.find((u) => u.id === c.userId)?.avatar, sub: t("common.customer") };
        return { c, last, other, unread: msgs.filter((m) => !m.read && m.sender !== audience).length };
      })
      .filter((x) => !q || x.other.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (b.last?.at ?? b.c.updatedAt).localeCompare(a.last?.at ?? a.c.updatedAt));
  }, [conversations, messages, audience, session, myProviderId, users, q, tx, t]);

  const activeId = sp.get("c") ?? (typeof window !== "undefined" && window.innerWidth >= 768 ? convs[0]?.c.id : undefined);
  const active = convs.find((x) => x.c.id === activeId);
  const thread = messages.filter((m) => m.conversationId === activeId);

  useEffect(() => { if (activeId) markRead(activeId, audience); }, [activeId, thread.length, markRead, audience]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [thread.length, typing[activeId ?? ""]]);
  // Supabase Realtime subscription (production)
  useEffect(() => {
    if (!repo.enabled || !activeId) return;
    return repo.subscribeToConversation(activeId, (row) => {
      const st = useStore.getState();
      if (st.messages.some((m) => m.id === row.id)) return;
      useStore.setState({ messages: [...st.messages, { id: String(row.id), conversationId: activeId, sender: row.sender_role as "user" | "provider", kind: row.kind as Message["kind"], text: row.body as string, at: String(row.created_at), read: false }] });
    });
  }, [activeId]);

  const send = () => { if (!text.trim() || !activeId) return; sendMessage(activeId, { kind: "text", text: text.trim() }, audience); setText(""); };
  const sendLocation = () => {
    if (!activeId || !active) return;
    setAttach(false);
    const fallback = () => { const p = getProviderById(active.c.providerId); const c = getCity(p?.citySlug ?? "tashkent")!; sendMessage(activeId, { kind: "location", location: { lat: c.lat, lng: c.lng, label: tx(c.name) } }, audience); };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition((pos) => sendMessage(activeId, { kind: "location", location: { lat: pos.coords.latitude, lng: pos.coords.longitude, label: t("chat.location") } }, audience), fallback, { timeout: 4000 });
  };
  const sendPhoto = async (files: FileList | null) => {
    if (!files?.[0] || !activeId) return;
    setAttach(false);
    sendMessage(activeId, { kind: "image", image: await fileToDataUrl(files[0], 900) }, audience);
  };
  const sendBooking = () => {
    if (!activeId || !active) return;
    setAttach(false);
    const b = bookings.find((x) => x.id === active.c.bookingId) ?? bookings.find((x) => x.providerId === active.c.providerId);
    if (b) sendMessage(activeId, { kind: "booking", bookingId: b.id }, audience);
  };
  const base = audience === "user" ? "/dashboard/messages" : "/provider-dashboard/messages";

  if (!hydrated) return <div className="skeleton h-[70vh] w-full rounded-[28px]" />;

  return (
    <div className="grid h-[calc(100dvh-190px)] min-h-[420px] overflow-hidden rounded-[28px] border bg-white shadow-soft md:h-[calc(100vh-150px)] md:min-h-[520px] md:grid-cols-[320px_1fr]">
      {/* list */}
      <div className={cn("flex min-h-0 flex-col border-r", activeId && "hidden md:flex")}>
        <div className="border-b p-4">
          <p className="mb-3 font-display text-lg font-semibold">{t("chat.title")}</p>
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("chat.search")} className="h-10 w-full rounded-full bg-secondary pl-9 pr-3 text-sm outline-none focus:ring-4 focus:ring-primary/10" /></div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {convs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t("chat.empty")}</p>}
          {convs.map(({ c, last, other, unread }) => (
            <li key={c.id}>
              <Link href={`${base}?c=${c.id}`} scroll={false} className={cn("flex items-center gap-3 rounded-2xl p-3 transition", c.id === activeId ? "bg-accent" : "hover:bg-secondary")}>
                <div className="relative"><Avatar src={other.avatar} name={other.name} className="h-12 w-12" /><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-white" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><p className={cn("truncate text-sm", unread ? "font-bold" : "font-semibold")}>{other.name}</p><span className="shrink-0 text-[11px] text-muted-foreground">{last ? timeOf(last.at) : ""}</span></div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-[13px]", unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {last ? (last.kind === "text" ? last.text : last.kind === "image" ? `📷 ${t("chat.photo")}` : last.kind === "location" ? `📍 ${t("chat.location")}` : `📅 ${t("chat.booking")}`) : other.sub}
                    </p>
                    {unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">{unread}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* thread */}
      {active ? (
        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary md:hidden" onClick={() => router.push(base)} aria-label="back"><ArrowLeft className="h-5 w-5" /></button>
            <Avatar src={active.other.avatar} name={active.other.name} className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{active.other.name}</p>
              <p className="text-xs text-success">{typing[active.c.id] ? t("chat.typing") : t("chat.online")}</p>
            </div>
            {audience === "user" && <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href={`/provider/${active.c.providerId}`}>{t("card.viewProfile")}</Link></Button>}
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#f8f9fd,#f3f5fb)] p-4 sm:p-6">
            {thread.map((m, i) => {
              const showDate = i === 0 || thread[i - 1].at.slice(0, 10) !== m.at.slice(0, 10);
              return (
                <div key={m.id}>
                  {showDate && <p className="my-3 text-center text-[11px] font-medium text-muted-foreground"><span className="rounded-full bg-white px-3 py-1 shadow-sm">{formatDate(m.at, locale, { day: "numeric", month: "long" })}</span></p>}
                  <Bubble m={m} mine={m.sender === audience} />
                </div>
              );
            })}
            <AnimatePresence>
              {typing[active.c.id] && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-fit items-center gap-1 rounded-[20px] rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                  {[0, 1, 2].map((i) => <motion.span key={i} className="h-2 w-2 rounded-full bg-muted-foreground/60" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />)}
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
          <div className="relative border-t p-3">
            <AnimatePresence>
              {attach && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-[calc(100%+8px)] left-3 z-10 w-60 rounded-2xl border bg-white p-1.5 shadow-lift">
                  <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-secondary"><ImagePlus className="h-4 w-4 text-primary" />{t("chat.sendPhoto")}</button>
                  <button onClick={sendLocation} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-secondary"><MapPin className="h-4 w-4 text-success" />{t("chat.sendLocation")}</button>
                  <button onClick={sendBooking} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-secondary"><CalendarCheck className="h-4 w-4 text-violet-600" />{t("chat.attachBooking")}</button>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => sendPhoto(e.target.files)} />
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
              <button type="button" onClick={() => setAttach((a) => !a)} className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-secondary", attach && "bg-secondary")} aria-label="attach"><Paperclip className="h-5 w-5 text-muted-foreground" /></button>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} placeholder={t("chat.placeholder")}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[22px] bg-secondary px-4 py-3 text-[15px] outline-none focus:ring-4 focus:ring-primary/10" />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!text.trim()} aria-label="send"><Send /></Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden place-items-center md:grid"><EmptyState icon={<MessageCircle />} title={t("chat.select")} /></div>
      )}
    </div>
  );
}
