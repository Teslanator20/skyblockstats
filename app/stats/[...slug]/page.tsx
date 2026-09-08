import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { InventoryPanels } from "@/components/InventoryPanels";
import {
  DungeonsCard,
  GearCard,
  MiningCard,
  MiscCard,
  NetworthCard,
  PetsCard,
  PlayerHeader,
  SkillsCard,
  SlayersCard,
  WorldsCard,
} from "@/components/stats";
import { ApiError } from "@/lib/hypixel";
import { loadProfileStats } from "@/lib/profile";

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const [player, profile] = slug;
  if (!player) return { title: "SkyBlock Stats" };
  return {
    title: profile ? `${player} · ${profile} | SkyBlock Stats` : `${player} | SkyBlock Stats`,
    description: `Hypixel SkyBlock Statistiken von ${player}.`,
  };
}

function ErrorView({ message, status, query }: { message: string; status: number; query: string }) {
  return (
    <div className="mx-auto max-w-[620px] px-5 py-24">
      <div className="card p-6">
        <div className="text-[11px] uppercase tracking-[0.1em] text-ink-faint">Fehler {status}</div>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight">Keine Daten geladen</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">{message}</p>
        <div className="mt-5">
          <SearchForm initial={query} size="sm" />
        </div>
        <Link href="/" className="mt-4 inline-block text-[12.5px] text-ink-faint hover:text-accent">
          ← zur Startseite
        </Link>
      </div>
    </div>
  );
}

export default async function StatsPage({ params }: Props) {
  const { slug = [] } = await params;
  const player = slug[0] ? decodeURIComponent(slug[0]) : "";
  const profileName = slug[1] ? decodeURIComponent(slug[1]) : undefined;

  if (!player) {
    return <ErrorView message="Kein Spielername in der URL." status={400} query="" />;
  }

  let stats;
  try {
    stats = await loadProfileStats(player, profileName);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return <ErrorView message={(error as Error).message} status={status} query={player} />;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-6">
      <div className="mb-5 max-w-[420px]">
        <SearchForm initial={stats.player.name} size="sm" />
      </div>

      <PlayerHeader stats={stats} />

      {stats.warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-gold/25 bg-gold/8 px-4 py-2.5 text-[12.5px] text-gold">
          {stats.warnings.join(" · ")}
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <SkillsCard stats={stats} />
          <MiningCard stats={stats} />
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SlayersCard stats={stats} />
            <GearCard stats={stats} />
          </div>
          <DungeonsCard stats={stats} />
          <NetworthCard stats={stats} />
          <div className="grid gap-4 lg:grid-cols-2">
            <PetsCard stats={stats} />
            <MiscCard stats={stats} />
          </div>
          <WorldsCard stats={stats} />
          {stats.inventories.length > 0 && <InventoryPanels sections={stats.inventories} />}
        </div>
      </div>
    </div>
  );
}
