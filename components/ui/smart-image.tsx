"use client";
import { useEffect, useRef, useState } from "react";
import { cn, initials } from "@/lib/utils";

/**
 * <img> with graceful gradient / initials fallback.
 * Checks `complete` after hydration, because load/error events can fire before React attaches handlers on SSR pages.
 */
export function SmartImage({ src, alt, className, fallbackText, tone = "from-brand-100 via-indigo-100 to-violet-100", loading = "lazy" }: { src?: string; alt: string; className?: string; fallbackText?: string; tone?: string; loading?: "lazy" | "eager" }) {
  const [err, setErr] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setErr(!src); setLoaded(false);
    const img = ref.current;
    if (img?.complete) { if (img.naturalWidth > 0) setLoaded(true); else if (src) setErr(true); }
  }, [src]);
  if (err)
    return (
      <div className={cn("grid place-items-center bg-gradient-to-br text-brand-700", tone, className)} aria-label={alt} role="img">
        {fallbackText && <span className="font-display font-semibold">{fallbackText}</span>}
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={src} alt={alt} loading={loading} decoding="async" onError={() => setErr(true)} onLoad={() => setLoaded(true)}
      className={cn("bg-gradient-to-br from-slate-100 to-slate-200 object-cover transition-[opacity,transform] duration-500", loaded ? "opacity-100" : "opacity-90", className)} />
  );
}

export function Avatar({ src, name, className, ring }: { src?: string; name: string; className?: string; ring?: boolean }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-100 to-violet-100", ring && "ring-2 ring-white", className)}>
      <SmartImage src={src} alt={name} fallbackText={initials(name)} className="h-full w-full text-[0.8em]" />
    </div>
  );
}
