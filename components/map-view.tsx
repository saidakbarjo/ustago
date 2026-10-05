"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LMap, Marker } from "leaflet";
import type { Provider } from "@/lib/types";
import { useI18n } from "@/lib/i18n/provider";

const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TILE = MAPBOX
  ? `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${MAPBOX}`
  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ATTR = MAPBOX ? "© Mapbox © OpenStreetMap" : "© OpenStreetMap, © CARTO";

const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(".0", "")}M` : `${Math.round(n / 1000)}K`);

export function MapView({ providers, center, activeId, onSelect, single, className }: {
  providers: Provider[]; center: { lat: number; lng: number }; activeId?: string | null; onSelect?: (id: string) => void; single?: boolean; className?: string;
}) {
  const { tx, t, price } = useI18n();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const markers = useRef<Record<string, Marker>>({});
  const L = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = await import("leaflet");
      if (cancelled || !el.current || map.current) return;
      L.current = leaflet;
      map.current = leaflet.map(el.current, { zoomControl: false, scrollWheelZoom: !single, attributionControl: true }).setView([center.lat, center.lng], single ? 14 : 12);
      leaflet.control.zoom({ position: "bottomright" }).addTo(map.current);
      leaflet.tileLayer(TILE, { attribution: ATTR, maxZoom: 19, subdomains: "abcd" }).addTo(map.current);
      draw();
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; markers.current = {}; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const leaflet = L.current, m = map.current;
    if (!leaflet || !m) return;
    Object.values(markers.current).forEach((mk) => mk.remove());
    markers.current = {};
    providers.forEach((p, i) => {
      const html = single
        ? `<div class="price-marker active" style="padding:10px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`
        : `<div class="price-marker" style="animation: fadeIn .4s ${i * 0.03}s both"><span class="dot"></span>${short(p.priceFrom)}</div>`;
      const icon = leaflet.divIcon({ html, className: "", iconSize: [0, 0] });
      const mk = leaflet.marker([p.lat, p.lng], { icon, riseOnHover: true }).addTo(m);
      if (!single) {
        mk.bindPopup(
          `<a href="${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/provider/${p.id}/" style="display:flex;gap:10px;align-items:center;text-decoration:none;color:#0b1020;min-width:220px">
             <img src="${p.avatar}" onerror="this.style.visibility='hidden'" style="width:44px;height:44px;border-radius:999px;object-fit:cover;background:#eef2ff"/>
             <span style="flex:1"><b style="font-size:14px">${p.name}</b><br/><span style="font-size:12px;color:#64748b">${tx(p.profession)} · ★ ${p.rating}</span><br/>
             <span style="font-size:12px;font-weight:700">${t("common.from")} ${price(p.priceFrom)}</span></span></a>`,
          { closeButton: false, offset: [0, -8] },
        );
        mk.on("click", () => onSelect?.(p.id));
      }
      markers.current[p.id] = mk;
    });
    if (!single && providers.length > 1) {
      const b = leaflet.latLngBounds(providers.map((p) => [p.lat, p.lng] as [number, number]));
      m.flyToBounds(b.pad(0.25), { duration: 0.8, maxZoom: 13 });
    } else m.flyTo([center.lat, center.lng], single ? 14 : 12, { duration: 0.8 });
  }

  useEffect(() => { draw(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [providers, center.lat, center.lng]);

  useEffect(() => {
    Object.entries(markers.current).forEach(([id, mk]) => {
      const node = mk.getElement()?.querySelector(".price-marker");
      if (!node || single) return;
      node.classList.toggle("active", id === activeId);
      if (id === activeId) mk.setZIndexOffset(1000); else mk.setZIndexOffset(0);
    });
  }, [activeId, single]);

  return (
    <>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-30%)}to{opacity:1;transform:translate(-50%,-50%)}}`}</style>
      <div ref={el} className={className} role="region" aria-label="Map" />
    </>
  );
}
