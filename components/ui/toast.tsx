"use client";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

type Toast = { id: number; title: string; tone: "success" | "error" | "info" };
const useToasts = create<{ list: Toast[]; push: (t: Omit<Toast, "id">) => void; remove: (id: number) => void }>((set) => ({
  list: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ list: [...s.list, { ...t, id }] }));
    setTimeout(() => set((s) => ({ list: s.list.filter((x) => x.id !== id) })), 3600);
  },
  remove: (id) => set((s) => ({ list: s.list.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string) => useToasts.getState().push({ title, tone: "success" }),
  error: (title: string) => useToasts.getState().push({ title, tone: "error" }),
  info: (title: string) => useToasts.getState().push({ title, tone: "info" }),
};

export function Toaster() {
  const list = useToasts((s) => s.list);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[200] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lift">
            {t.tone === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : t.tone === "error" ? <XCircle className="h-5 w-5 text-red-400" /> : <Info className="h-5 w-5 text-brand-300" />}
            {t.title}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
