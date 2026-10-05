"use client";
import { useMemo } from "react";
import { DEMO_PROVIDER_ID, useProvider, useStore } from "@/lib/store";

export function useMyProvider() {
  const pid = useStore((s) => s.session?.providerId ?? DEMO_PROVIDER_ID);
  const provider = useProvider(pid);
  const all = useStore((s) => s.bookings);
  const bookings = useMemo(() => all.filter((b) => b.providerId === pid), [all, pid]);
  return { pid, provider, bookings };
}
