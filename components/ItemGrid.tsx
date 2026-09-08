"use client";

import { useEffect, useRef, useState } from "react";
import type { SbItem, StyledPart } from "@/lib/types";

/**
 * Genau ein Tooltip global, gerendert von <ItemTooltipLayer /> im Layout.
 *
 * Warum ein Store und kein State pro Slot:
 *  - bleibt der Cursor beim Scrollen oder Fensterwechsel auf einem Slot stehen,
 *    kommt kein pointerleave - mit Pro-Slot-State stapeln sich dann Tooltips
 *  - der Layer rendert bei Mausbewegung neu, die (bis zu mehreren hundert)
 *    Slots nicht
 */
type TooltipState = { item: SbItem; x: number; y: number } | null;

let current: TooltipState = null;
const subscribers = new Set<() => void>();

function emit() {
  for (const notify of subscribers) notify();
}

function showTooltip(item: SbItem, x: number, y: number) {
  current = { item, x, y };
  emit();
}

function hideTooltip(item?: SbItem) {
  if (item && current?.item !== item) return;
  if (!current) return;
  current = null;
  emit();
}

function StyledText({ parts }: { parts: StyledPart[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          style={{
            color: part.color,
            fontWeight: part.bold ? 700 : 400,
            fontStyle: part.italic ? "italic" : "normal",
            textDecoration: part.strike ? "line-through" : "none",
          }}
        >
          {part.text}
        </span>
      ))}
    </>
  );
}

/** Gehört ins Root-Layout: rendert den einen Tooltip über allem. */
export function ItemTooltipLayer() {
  const [state, setState] = useState<TooltipState>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });

  useEffect(() => {
    const notify = () => setState(current);
    subscribers.add(notify);

    const clear = () => hideTooltip();
    window.addEventListener("scroll", clear, { passive: true, capture: true });
    window.addEventListener("blur", clear);
    window.addEventListener("resize", clear);
    document.addEventListener("visibilitychange", clear);

    return () => {
      subscribers.delete(notify);
      window.removeEventListener("scroll", clear, { capture: true });
      window.removeEventListener("blur", clear);
      window.removeEventListener("resize", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);

  // Am Rand umklappen, damit der Tooltip immer komplett im Viewport liegt.
  useEffect(() => {
    if (!state) return;
    const box = ref.current?.getBoundingClientRect();
    const width = box?.width ?? 300;
    const height = box?.height ?? 180;
    const margin = 10;
    const offset = 14;

    let left = state.x + offset;
    let top = state.y + offset;
    if (left + width + margin > window.innerWidth) left = Math.max(margin, state.x - width - offset);
    if (top + height + margin > window.innerHeight) top = Math.max(margin, state.y - height - offset);
    setPos({ left, top });
  }, [state]);

  if (!state) return null;
  const { item } = state;

  return (
    <div className="mc-tooltip fixed z-[9999] pointer-events-none" ref={ref} style={{ left: pos.left, top: pos.top }}>
      <StyledText parts={item.nameParts.length ? item.nameParts : [{ text: item.name, color: "#ffffff" }]} />
      {item.lore.map((line, index) => (
        <div key={index}>{line.length === 0 ? " " : <StyledText parts={line} />}</div>
      ))}
      {item.skyblockId && (
        <div className="mt-1.5 border-t border-white/10 pt-1 text-[10px]" style={{ color: "#5d6a7d" }}>
          {item.skyblockId}
        </div>
      )}
    </div>
  );
}

function ItemIcon({ item }: { item: SbItem }) {
  const [broken, setBroken] = useState(false);
  const url = item.icon?.url ?? null;
  const tint = item.icon?.tint ?? null;

  if (!url || broken) {
    return (
      <span
        className="font-mono text-[11px] font-bold leading-none tracking-tight"
        style={{ color: item.rarityColor }}
        aria-hidden
      >
        {item.icon?.letters ?? "?"}
      </span>
    );
  }

  // Gefärbtes Leder: Textur als Maske, Farbe als Hintergrund.
  if (tint) {
    return (
      <span
        className="size-[76%]"
        style={{
          backgroundColor: tint,
          maskImage: `url(${url})`,
          WebkitMaskImage: `url(${url})`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={item.name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="size-[76%] object-contain"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function ItemSlot({ item }: { item: SbItem | null }) {
  if (!item) return <div className="slot slot-empty" />;

  return (
    <div
      className="slot"
      // Hover-Rahmen läuft über CSS (--rarity), damit kein Re-Render nötig ist.
      style={{ "--rarity": item.rarityColor } as React.CSSProperties}
      onPointerEnter={(event) => showTooltip(item, event.clientX, event.clientY)}
      onPointerMove={(event) => showTooltip(item, event.clientX, event.clientY)}
      onPointerLeave={() => hideTooltip(item)}
      onPointerCancel={() => hideTooltip(item)}
    >
      <ItemIcon item={item} />

      {item.count > 1 && (
        <span
          className="absolute bottom-0 right-[3px] font-mono text-[11px] font-bold"
          style={{ color: "#fff", textShadow: "1px 1px 0 #000" }}
        >
          {item.count}
        </span>
      )}
    </div>
  );
}

export function ItemGrid({
  items,
  columns = 9,
  slots,
}: {
  items: SbItem[];
  columns?: number;
  /** Feste Slot-Anzahl (leere Slots werden aufgefüllt) */
  slots?: number;
}) {
  const total = slots ?? items.length;
  const bySlot = new Map<number, SbItem>();
  items.forEach((item, index) => bySlot.set(slots ? item.slot : index, item));

  const cells = Array.from({ length: total }, (_, index) => bySlot.get(index) ?? null);

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {cells.map((item, index) => (
        <ItemSlot key={index} item={item} />
      ))}
    </div>
  );
}

export { StyledText };
