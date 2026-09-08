"use client";

import { useState } from "react";
import { ItemGrid } from "@/components/ItemGrid";
import type { SbItem } from "@/lib/types";

export type PanelSection = { key: string; label: string; items: SbItem[]; columns: number };

export function InventoryPanels({ sections }: { sections: PanelSection[] }) {
  const [active, setActive] = useState(sections[0]?.key ?? "");
  const current = sections.find((section) => section.key === active) ?? sections[0];

  if (!current) return null;

  return (
    <section className="card">
      <div className="card-head flex-wrap">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.09em] text-ink-dim">Inventare</h2>
        <div className="flex flex-wrap gap-1.5">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActive(section.key)}
              className={`rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors ${
                section.key === current.key
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-line text-ink-dim hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {section.label}
              <span className="ml-1.5 text-[10px] text-ink-faint tnum">{section.items.length}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <ItemGrid items={current.items} columns={current.columns} />
      </div>
    </section>
  );
}
