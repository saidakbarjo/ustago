"use client";
import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useMyProvider } from "@/components/dashboard/provider-hooks";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { fileToDataUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

export default function PortfolioPage() {
  const { t, tx, locale } = useI18n();
  const { provider: p, pid } = useMyProvider();
  const update = useStore((s) => s.updateProvider);
  const ref = useRef<HTMLInputElement>(null);
  if (!p) return null;
  const add = async (files: FileList | null) => {
    if (!files) return;
    const imgs = await Promise.all(Array.from(files).slice(0, 6).map((f) => fileToDataUrl(f, 900)));
    update(pid, { portfolio: [...imgs.map((image, i) => ({ id: `${pid}-u${Date.now()}${i}`, title: { uz: "Yangi ish", ru: "Новая работа", en: "New work" }, image, completedAt: new Date().toISOString() })), ...p.portfolio] });
    toast.success(t("common.saved"));
  };
  return (
    <div>
      <PageHeader title={t("pdash.portfolio")} subtitle={`${p.portfolio.length}`} action={<><input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} /><Button onClick={() => ref.current?.click()}><ImagePlus />{t("pdash.addPortfolio")}</Button></>} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <button onClick={() => ref.current?.click()} className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed bg-white text-muted-foreground transition hover:border-primary/50 hover:text-primary"><ImagePlus className="h-8 w-8" /><span className="text-sm font-medium">{t("pdash.addPortfolio")}</span></button>
        {p.portfolio.map((it) => (
          <motion.div layout key={it.id} className="group relative aspect-[4/5] overflow-hidden rounded-[24px]">
            <SmartImage src={it.image} alt={tx(it.title)} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="font-semibold">{tx(it.title)}</p><p className="text-xs text-white/70">{formatDate(it.completedAt, locale)}</p></div>
            <button onClick={() => update(pid, { portfolio: p.portfolio.filter((x) => x.id !== it.id) })} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-destructive opacity-0 transition group-hover:opacity-100" aria-label={t("common.delete")}><Trash2 className="h-4 w-4" /></button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
