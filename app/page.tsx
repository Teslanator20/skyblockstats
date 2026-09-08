import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { hasApiKey } from "@/lib/hypixel";

const EXAMPLES = ["Teslanator", "Refraction", "Technoblade"];

export default function Home() {
  const keyMissing = !hasApiKey();

  return (
    <div className="mx-auto max-w-[820px] px-5 py-20">
      <h1 className="text-[38px] font-semibold leading-[1.1] tracking-tight sm:text-[46px]">
        SkyBlock Profile,
        <br />
        <span className="text-ink-faint">bis aufs letzte Item.</span>
      </h1>
      <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-ink-dim">
        Skills, Slayer, Dungeons, Heart of the Mountain, Pets, Gear und Networth — direkt aus der offiziellen
        Hypixel API, pro Profil aufgeschlüsselt.
      </p>

      <div className="mt-8">
        <SearchForm />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-faint">
        <span>Beispiele:</span>
        {EXAMPLES.map((name) => (
          <Link
            key={name}
            href={`/stats/${name}`}
            className="rounded-lg border border-line px-2 py-0.5 transition-colors hover:border-accent/40 hover:text-accent"
          >
            {name}
          </Link>
        ))}
      </div>

      {keyMissing && (
        <div className="mt-10 rounded-xl border border-gold/30 bg-gold/8 p-4 text-[13px] leading-relaxed">
          <strong className="text-gold">Setup fehlt:</strong> Es ist kein{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px]">HYPIXEL_API_KEY</code>{" "}
          gesetzt. Key auf{" "}
          <a
            href="https://developer.hypixel.net"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline decoration-accent/40"
          >
            developer.hypixel.net
          </a>{" "}
          erstellen und in <code className="font-mono text-[12px]">.env.local</code> eintragen:
          <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-base p-3 font-mono text-[12px]">
            HYPIXEL_API_KEY=dein-key
          </pre>
        </div>
      )}

      <div className="mt-16 grid gap-3 sm:grid-cols-3">
        {[
          { title: "Alle Profile", text: "Jedes Profil einzeln, inklusive Ironman, Stranded und Bingo." },
          { title: "Echtes Item-NBT", text: "Gear, Enderchest und Backpacks mit Original-Lore und Rarity." },
          { title: "Networth", text: "Inventar, Pets, Essence, Säcke und Museum in Coins." },
        ].map((feature) => (
          <div key={feature.title} className="card p-4">
            <h3 className="text-[13px] font-semibold">{feature.title}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
