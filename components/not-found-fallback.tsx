"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Navbar, MobileTabBar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProfileClient } from "@/components/provider/profile-client";
import { BookingFlow } from "@/components/booking/booking-flow";

/**
 * Specialists approved at runtime (demo registrations) have no prerendered page on static hosting.
 * GitHub Pages serves 404.html for them — we resolve /provider/<id> and /book/<id> on the client.
 */
export function NotFoundFallback() {
  const [route, setRoute] = useState<{ kind: "provider" | "book"; id: string } | null | undefined>(undefined);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const path = window.location.pathname.replace(base, "");
    const m = path.match(/^\/(provider|book)\/([^/]+)\/?$/);
    setRoute(m ? { kind: m[1] as "provider" | "book", id: decodeURIComponent(m[2]) } : null);
  }, []);
  if (route === undefined) return <div className="min-h-screen" />;
  if (route?.kind === "provider")
    return (<><Navbar /><main className="min-h-screen pt-[68px]"><ProfileClient id={route.id} /></main><Footer /><MobileTabBar /></>);
  if (route?.kind === "book") return <Suspense><BookingFlow id={route.id} /></Suspense>;
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,#eef2ff,#fff_60%)] p-6 text-center">
      <div><Logo className="mx-auto" /><p className="mt-10 font-display text-8xl font-extrabold tracking-tight text-gradient">404</p><p className="mt-4 text-lg text-muted-foreground">Sahifa topilmadi · Страница не найдена · Page not found</p><Button asChild className="mt-8" size="lg"><Link href="/">USTAGO</Link></Button></div>
    </div>
  );
}
