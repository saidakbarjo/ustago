import { Wrench, Car, House, Sparkles, Laptop, GraduationCap, Scissors, Camera, Truck, HardHat, Palette, Zap, type LucideProps } from "lucide-react";
import type { CategoryIcon as CI } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAP = { wrench: Wrench, car: Car, house: House, sparkles: Sparkles, laptop: Laptop, graduation: GraduationCap, scissors: Scissors, camera: Camera, truck: Truck, hardhat: HardHat, palette: Palette, zap: Zap };
export function CategoryIcon({ icon, ...props }: { icon: CI } & LucideProps) {
  const I = MAP[icon] ?? Wrench;
  return <I {...props} />;
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-[19px] font-bold tracking-tight", light ? "text-white" : "text-ink", className)}>
      <span className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v7a6 6 0 0 0 12 0V5" />
          <circle cx="18" cy="5" r="1.2" fill="white" stroke="none" />
        </svg>
      </span>
      USTA<span className="text-primary">GO</span>
    </span>
  );
}

type SP = { className?: string };
export const Social = {
  Telegram: ({ className }: SP) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.1l-4.8-1.5c-1-.3-1.1-1 .2-1.5L20.5 2.9c.9-.3 1.7.2 1.4 1.4Z" /></svg>,
  Instagram: ({ className }: SP) => <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
  Facebook: ({ className }: SP) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V9c0-.6.4-1 1-1Z" /></svg>,
  YouTube: ({ className }: SP) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.7 3-5.7 3Z" /></svg>,
  LinkedIn: ({ className }: SP) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4V9.5Z" /></svg>,
};
