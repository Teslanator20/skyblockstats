"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SearchForm({ initial = "", size = "lg" }: { initial?: string; size?: "sm" | "lg" }) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name) return;
    startTransition(() => router.push(`/stats/${encodeURIComponent(name)}`));
  };

  const big = size === "lg";

  return (
    <form onSubmit={submit} className="flex gap-2 w-full">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Minecraft-Name oder UUID"
        spellCheck={false}
        autoComplete="off"
        className={`flex-1 min-w-0 rounded-xl border border-line bg-surface-2/70 outline-none transition-colors
          placeholder:text-ink-faint focus:border-accent/70 focus:bg-surface-2
          ${big ? "px-4 py-3 text-[15px]" : "px-3 py-2 text-[13px]"}`}
      />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-xl border border-accent/40 bg-accent/15 font-medium text-accent
          transition-colors hover:bg-accent/25 disabled:opacity-50
          ${big ? "px-5 py-3 text-[15px]" : "px-3.5 py-2 text-[13px]"}`}
      >
        {pending ? "Lade…" : "Suchen"}
      </button>
    </form>
  );
}
