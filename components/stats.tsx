import Link from "next/link";
import { Bar, Card, Empty, Pill, Row, StatTile } from "@/components/ui";
import { ItemGrid, ItemSlot } from "@/components/ItemGrid";
import { RARITY_COLORS, SKILL_NAMES, SLAYER_NAMES, SLAYER_SHORT } from "@/lib/constants";
import { abbreviate, decimal, duration, full, levelColor, relative, timestamp, titleCase } from "@/lib/format";
import { skinBodyUrl } from "@/lib/materials";
import type { ProfileStats } from "@/lib/profile";

export function PlayerHeader({ stats }: { stats: ProfileStats }) {
  const { player, profile, profiles, skyblockLevel, skills, dungeons, slayers, networth, currencies } = stats;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-5">
          <div className="relative shrink-0 rounded-xl border border-line bg-surface-2/60 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={skinBodyUrl(player.uuid)}
              alt={player.name}
              className="h-[132px] w-auto"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {player.rank.label && (
                <Pill color={player.rank.color}>
                  {player.rank.label.replace(/\+/g, "")}
                  {player.rank.label.includes("+") && (
                    <span style={{ color: player.rank.plusColor }}>
                      {"+".repeat((player.rank.label.match(/\+/g) ?? []).length)}
                    </span>
                  )}
                </Pill>
              )}
              <h1 className="text-[26px] font-semibold leading-none tracking-tight">{player.name}</h1>
              {player.online && (
                <span className="flex items-center gap-1.5 text-[11px] text-accent">
                  <span className="size-1.5 rounded-full bg-accent" /> online
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-dim">
              <span className="text-ink">{profile.name}</span>
              {profile.gameModeLabel && <Pill color="#ffc857">{profile.gameModeLabel}</Pill>}
              {profile.memberCount > 1 && <Pill>Coop · {profile.memberCount}</Pill>}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[11.5px] text-ink-faint">
              <span>Erster Login: {timestamp(player.firstLogin)}</span>
              <span>Letzter Login: {relative(player.lastLogin)}</span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          <StatTile
            label="SkyBlock Level"
            value={skyblockLevel.level}
            hint={`${Math.round(skyblockLevel.progress * 100)}% zum nächsten`}
            color="#8ce99a"
          />
          <StatTile
            label="Skill Average"
            value={decimal(skills.averageWithProgress, 2)}
            hint={`${decimal(skills.averageWithHunting, 2)} mit Hunting`}
            color="#74c0fc"
          />
          <StatTile
            label="Catacombs"
            value={dungeons.catacombs.level}
            hint={dungeons.apiEnabled ? `${full(dungeons.totalRuns)} Runs` : "API aus"}
            color="#ff9f43"
          />
          <StatTile
            label="Slayer XP"
            value={abbreviate(slayers.totalXp)}
            hint={`${full(slayers.totalKills)} Bosse`}
            color="#ff6b6b"
          />
          <StatTile
            label="Networth"
            value={networth ? abbreviate(networth.total) : "-"}
            hint={networth?.noInventory ? "Inventar-API aus" : networth ? "inkl. Bank" : undefined}
            color="#ffc857"
          />
          <StatTile
            label="Coins"
            value={abbreviate(currencies.purse + currencies.bank)}
            hint={`Purse ${abbreviate(currencies.purse)}`}
            color="#ffd166"
          />
        </div>
      </div>

      {profiles.length > 1 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line-soft px-5 py-3">
          {profiles.map((entry) => {
            const active = entry.id === profile.id;
            return (
              <Link
                key={entry.id}
                href={`/stats/${player.name}/${entry.name}`}
                className={`rounded-lg border px-2.5 py-1 text-[12px] transition-colors ${
                  active
                    ? "border-accent/50 bg-accent/15 text-accent"
                    : "border-line text-ink-dim hover:border-line hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {entry.name}
                <span className="ml-1.5 text-[10.5px] text-ink-faint tnum">Lv {entry.skyblockLevel}</span>
                {entry.gameModeLabel && (
                  <span className="ml-1 text-[10px] text-gold">{entry.gameModeLabel.charAt(0)}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SkillsCard({ stats }: { stats: ProfileStats }) {
  const { skills } = stats;
  return (
    <Card
      title="Skills"
      subtitle={skills.apiEnabled ? `${abbreviate(skills.totalXp)} XP insgesamt` : "Skills-API deaktiviert"}
      right={`Ø ${decimal(skills.averageWithProgress, 2)}`}
      className="overflow-hidden"
    >
      <div className="space-y-2.5">
        {skills.entries.map((entry) => {
          const color = levelColor(entry.info.level, entry.info.maxLevel);
          return (
            <div key={entry.key}>
              <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                <span className="text-ink-dim">{SKILL_NAMES[entry.key] ?? entry.name}</span>
                <span className="tnum">
                  <span className="font-semibold" style={{ color }}>
                    {entry.info.level}
                  </span>
                  <span className="text-ink-faint">/{entry.info.maxLevel}</span>
                </span>
              </div>
              <div className="mt-1">
                <Bar progress={entry.info.progress} color={color} />
              </div>
              <div className="mt-0.5 flex justify-between text-[10.5px] text-ink-faint tnum">
                <span>{abbreviate(entry.info.xp)} XP</span>
                <span>
                  {entry.info.maxed
                    ? "max"
                    : `${abbreviate(entry.info.xpForNext - entry.info.xpCurrent)} bis Lv ${entry.info.level + 1}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function SlayersCard({ stats }: { stats: ProfileStats }) {
  const { slayers } = stats;
  const active = slayers.entries.filter((entry) => entry.info.xp > 0);

  return (
    <Card title="Slayer" subtitle={`${abbreviate(slayers.totalXp)} XP`} right={`${full(slayers.totalKills)} Kills`}>
      {active.length === 0 ? (
        <Empty>Keine Slayer-Daten.</Empty>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {active.map((entry) => {
            const color = levelColor(entry.info.level, entry.info.maxLevel);
            return (
              <div key={entry.key} className="rounded-xl border border-line bg-surface-2/50 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] font-medium">{SLAYER_SHORT[entry.key]}</span>
                  <span className="text-[13px] font-semibold tnum" style={{ color }}>
                    {entry.info.level}
                    <span className="text-[11px] text-ink-faint">/{entry.info.maxLevel}</span>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar progress={entry.info.progress} color={color} />
                </div>
                <div className="mt-1 flex justify-between text-[10.5px] text-ink-faint tnum">
                  <span>{abbreviate(entry.info.xp)} XP</span>
                  <span>{full(entry.totalKills)} Kills</span>
                </div>
                <div className="mt-2 flex gap-1.5 text-[10px] text-ink-faint tnum">
                  {Object.entries(entry.kills)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([tier, count]) => (
                      <span key={tier} className="rounded border border-line px-1.5 py-0.5">
                        T{tier} <span className="text-ink-dim">{abbreviate(count, 1)}</span>
                      </span>
                    ))}
                </div>
                <div className="mt-1.5 text-[10px] text-ink-faint truncate">{SLAYER_NAMES[entry.key]}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function FloorTable({ title, floors }: { title: string; floors: ProfileStats["dungeons"]["floors"] }) {
  const rows = floors.filter((floor) => floor.completions > 0);
  if (rows.length === 0) return null;

  return (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] tnum">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
              <th className="pb-1 font-medium">Floor</th>
              <th className="pb-1 text-right font-medium">Runs</th>
              <th className="pb-1 text-right font-medium">Best Score</th>
              <th className="pb-1 text-right font-medium">Fastest S+</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((floor) => (
              <tr key={floor.id} className="border-t border-line-soft/70">
                <td className="py-1.5 text-ink-dim">{floor.name}</td>
                <td className="py-1.5 text-right">{full(floor.completions)}</td>
                <td className="py-1.5 text-right">{floor.bestScore ?? "-"}</td>
                <td className="py-1.5 text-right">{duration(floor.fastestTimeSPlus ?? floor.fastestTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DungeonsCard({ stats }: { stats: ProfileStats }) {
  const { dungeons } = stats;

  if (!dungeons.apiEnabled) {
    return (
      <Card title="Dungeons">
        <Empty>Keine Dungeon-Daten für dieses Profil.</Empty>
      </Card>
    );
  }

  const cataColor = levelColor(dungeons.catacombs.level, 50);

  return (
    <Card
      title="Dungeons"
      subtitle={dungeons.highestFloorBeaten ? `Höchster Floor: ${dungeons.highestFloorBeaten}` : undefined}
      right={dungeons.secrets !== null ? `${full(dungeons.secrets)} Secrets` : undefined}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Catacombs</div>
                <div className="text-[28px] font-semibold leading-none tnum" style={{ color: cataColor }}>
                  {dungeons.catacombs.level}
                </div>
              </div>
              <div className="text-right text-[11px] text-ink-faint tnum">
                <div>{abbreviate(dungeons.catacombs.xp)} XP</div>
                <div>{full(dungeons.totalRuns)} Runs</div>
              </div>
            </div>
            <div className="mt-2.5">
              <Bar progress={dungeons.catacombs.progress} color={cataColor} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              <span>Klassen</span>
              <span className="tnum normal-case tracking-normal">Ø {decimal(dungeons.classAverage, 1)}</span>
            </div>
            {dungeons.classes.map((entry) => {
              const color = levelColor(entry.info.level, 50);
              const selected = dungeons.selectedClass === entry.key;
              return (
                <div key={entry.key}>
                  <div className="flex items-baseline justify-between text-[12.5px]">
                    <span className={selected ? "text-ink" : "text-ink-dim"}>
                      {entry.name}
                      {selected && <span className="ml-1.5 text-[10px] text-accent">aktiv</span>}
                    </span>
                    <span className="tnum font-semibold" style={{ color }}>
                      {entry.info.level}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Bar progress={entry.info.progress} color={color} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <FloorTable title="Catacombs" floors={dungeons.floors} />
          <FloorTable title="Master Mode" floors={dungeons.masterFloors} />
        </div>
      </div>
    </Card>
  );
}

export function MiningCard({ stats }: { stats: ProfileStats }) {
  const { mining } = stats;
  const color = levelColor(mining.hotm.level, mining.hotm.maxLevel);
  const crystals = mining.crystals.filter((crystal) => crystal.state !== "NOT_FOUND");

  return (
    <Card title="Mining" subtitle={mining.selectedAbility ? titleCase(mining.selectedAbility) : undefined}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
          <div className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Heart of the Mountain</div>
          <div className="text-[24px] font-semibold leading-none tnum" style={{ color }}>
            {mining.hotm.level}
            <span className="text-[13px] text-ink-faint">/{mining.hotm.maxLevel}</span>
          </div>
          <div className="mt-2">
            <Bar progress={mining.hotm.progress} color={color} />
          </div>
          <div className="mt-1 text-[10.5px] text-ink-faint tnum">{full(mining.hotm.xp)} XP</div>
        </div>

        <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
          <Row
            label="Mithril Powder"
            value={
              <>
                {abbreviate(mining.mithrilPowder)}
                <span className="text-ink-faint"> / {abbreviate(mining.totalMithril)}</span>
              </>
            }
          />
          <Row
            label="Gemstone Powder"
            value={
              <>
                {abbreviate(mining.gemstonePowder)}
                <span className="text-ink-faint"> / {abbreviate(mining.totalGemstone)}</span>
              </>
            }
          />
          <Row
            label="Glacite Powder"
            value={
              <>
                {abbreviate(mining.glacitePowder)}
                <span className="text-ink-faint"> / {abbreviate(mining.totalGlacite)}</span>
              </>
            }
          />
          <Row label="Tokens (Mountain)" value={full(mining.tokensSpentMountain)} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Heart of the Forest</div>
          <Row label="Baum-XP" value={abbreviate(mining.forestXp)} />
          <Row label="Tokens (Forest)" value={full(mining.tokensSpentForest)} />
          <Row
            label="Tempel"
            value={mining.unlockedTemples.length ? mining.unlockedTemples.map(titleCase).join(", ") : "-"}
          />
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
          <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Glacite Mineshafts</div>
          <Row label="Mineshafts betreten" value={full(mining.mineshaftsEntered)} />
          <Row label="Corpses gelootet" value={full(mining.corpsesLooted)} />
          <Row label="Fossilien gespendet" value={full(mining.fossilsDonated)} />
        </div>
      </div>

      {crystals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {crystals.map((crystal) => (
            <Pill key={crystal.name} color={crystal.state === "FOUND" ? "#8ce99a" : "#96a3b6"}>
              {titleCase(crystal.name)}
              {crystal.total > 0 && <span className="text-ink-faint tnum">×{crystal.total}</span>}
            </Pill>
          ))}
        </div>
      )}
    </Card>
  );
}

export function GearCard({ stats }: { stats: ProfileStats }) {
  const { gear } = stats;
  const hasGear = gear.armor.length + gear.equipment.length + gear.weapons.length > 0;

  return (
    <Card title="Ausrüstung" subtitle={hasGear ? undefined : "Inventar-API deaktiviert"}>
      {!hasGear ? (
        <Empty>Keine Ausrüstung sichtbar.</Empty>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Rüstung</div>
              <div className="grid grid-cols-4 gap-1.5">
                {[3, 2, 1, 0].map((slot) => (
                  <ItemSlot key={slot} item={gear.armor.find((item) => item.slot === slot) ?? null} />
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Equipment</div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((slot) => (
                  <ItemSlot key={slot} item={gear.equipment.find((item) => item.slot === slot) ?? null} />
                ))}
              </div>
            </div>
          </div>

          {gear.armor.length > 0 && (
            <div className="space-y-1">
              {gear.armor
                .slice()
                .sort((a, b) => b.slot - a.slot)
                .map((item) => (
                  <div key={item.slot} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="truncate" style={{ color: item.rarityColor }}>
                      {item.name}
                    </span>
                    {item.rarity && (
                      <span className="shrink-0 text-[10px]" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {item.rarity}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}

          {gear.weapons.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                Waffen & Werkzeuge
              </div>
              <ItemGrid items={gear.weapons.slice(0, 18)} columns={9} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function PetsCard({ stats }: { stats: ProfileStats }) {
  const pets = stats.pets;
  if (pets.length === 0) {
    return (
      <Card title="Pets">
        <Empty>Keine Pets gefunden.</Empty>
      </Card>
    );
  }

  return (
    <Card title="Pets" right={`${pets.length} gesammelt`}>
      <div className="grid gap-2 sm:grid-cols-2">
        {pets.slice(0, 24).map((pet, index) => {
          const color = RARITY_COLORS[pet.tier] ?? "#ffffff";
          return (
            <div
              key={`${pet.type}-${index}`}
              className={`rounded-xl border bg-surface-2/50 p-2.5 ${
                pet.active ? "border-accent/40" : "border-line"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium" style={{ color }}>
                  {pet.name}
                </span>
                <span className="shrink-0 text-[11.5px] tnum text-ink-dim">
                  Lv {pet.level.level}
                  <span className="text-ink-faint">/{pet.level.maxLevel}</span>
                </span>
              </div>
              <div className="mt-1.5">
                <Bar progress={pet.level.progress} color={color} />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-ink-faint">
                <span className="truncate">
                  {pet.heldItem ? titleCase(pet.heldItem.replace(/^PET_ITEM_/, "")) : "kein Item"}
                </span>
                {pet.active && <span className="text-accent">aktiv</span>}
              </div>
            </div>
          );
        })}
      </div>
      {pets.length > 24 && (
        <p className="mt-2.5 text-[11.5px] text-ink-faint">
          + {pets.length - 24} weitere Pets (nach Level und Rarity sortiert)
        </p>
      )}
    </Card>
  );
}

export function NetworthCard({ stats }: { stats: ProfileStats }) {
  const { networth, currencies } = stats;

  if (!networth) {
    return (
      <Card title="Networth">
        <Empty>Networth konnte nicht berechnet werden.</Empty>
      </Card>
    );
  }

  const max = Math.max(1, ...networth.types.map((type) => type.total));

  return (
    <Card
      title="Networth"
      subtitle={networth.noInventory ? "Inventar-API aus - nur Coins zählbar" : undefined}
      right={`${full(networth.total)} Coins`}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="Gesamt" value={abbreviate(networth.total)} color="#ffc857" />
        <StatTile label="Ohne Soulbound" value={abbreviate(networth.unsoulbound)} />
        <StatTile label="Purse" value={abbreviate(currencies.purse)} />
        <StatTile label="Bank" value={abbreviate(currencies.bank + currencies.personalBank)} />
      </div>

      {networth.types.length > 0 && (
        <div className="mt-4 space-y-2">
          {networth.types.map((type) => (
            <div key={type.key}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="text-ink-dim">{type.label}</span>
                <span className="tnum">{abbreviate(type.total)}</span>
              </div>
              <div className="mt-1">
                <Bar progress={type.total / max} color="#ffc857" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function WorldsCard({ stats }: { stats: ProfileStats }) {
  const { crimsonIsle, trophyFish, shards, safari, minions, gardenCopper, sacks } = stats.extras;
  const factionColor = crimsonIsle.faction === "mages" ? "#74c0fc" : "#ff8787";
  const reputation =
    crimsonIsle.faction === "mages" ? crimsonIsle.magesReputation : crimsonIsle.barbariansReputation;

  return (
    <Card title="Inhalte" subtitle="Crimson Isle, Fishing, Hunting">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Crimson Isle</span>
            {crimsonIsle.faction && <Pill color={factionColor}>{titleCase(crimsonIsle.faction)}</Pill>}
          </div>
          <Row label="Reputation" value={full(reputation)} />
          {crimsonIsle.kuudraTiers.length > 0 ? (
            crimsonIsle.kuudraTiers.map((tier) => (
              <Row
                key={tier.key}
                label={`Kuudra ${tier.name}`}
                value={
                  <>
                    {full(tier.completions)}
                    {tier.highestWave > 0 && (
                      <span className="text-ink-faint"> · Welle {tier.highestWave}</span>
                    )}
                  </>
                }
              />
            ))
          ) : (
            <Empty>Kein Kuudra-Fortschritt.</Empty>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Trophy Fish</div>
            <Row label="Gefangen" value={full(trophyFish.totalCaught)} />
            <Row label="Arten" value={full(trophyFish.uniqueFish)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(trophyFish.tiers).map(([tier, count]) => (
                <Pill
                  key={tier}
                  color={
                    tier === "diamond" ? "#55ffff" : tier === "gold" ? "#ffc857" : tier === "silver" ? "#dfe6ee" : "#c98a5b"
                  }
                >
                  {titleCase(tier)} <span className="tnum">{full(count)}</span>
                </Pill>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <StatTile label="Shards" value={full(shards.owned)} hint={`${full(shards.fused)} fused`} />
            <StatTile label="Critters" value={full(safari.discovered)} hint={`${full(safari.sparkling)} sparkling`} />
            <StatTile label="Minions" value={full(minions)} />
            <StatTile label="Garden Copper" value={abbreviate(gardenCopper)} />
          </div>
        </div>
      </div>

      {sacks.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Größte Säcke</div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {sacks.map((sack) => (
              <Row key={sack.id} label={sack.name} value={abbreviate(sack.amount)} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function MiscCard({ stats }: { stats: ProfileStats }) {
  const { combat, currencies, collections } = stats;
  const essence = Object.entries(currencies.essence);

  return (
    <Card title="Sonstiges">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile label="Fairy Souls" value={full(combat.fairySouls)} />
        <StatTile label="Magical Power" value={full(combat.magicalPower)} color="#d0bfff" />
        <StatTile label="Kills" value={abbreviate(combat.kills)} />
        <StatTile label="Deaths" value={full(combat.deaths)} color="#ff8787" />
      </div>

      {combat.highestCritDamage > 0 && (
        <div className="mt-3">
          <Row label="Höchster Crit-Schaden" value={full(combat.highestCritDamage)} />
          <Row label="Collections freigeschaltet" value={`${full(collections.unlockedTiers)} Tiers`} />
        </div>
      )}

      {essence.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Essence</div>
          <div className="flex flex-wrap gap-1.5">
            {essence.map(([type, amount]) => (
              <Pill key={type}>
                {titleCase(type)} <span className="text-ink tnum">{abbreviate(amount, 1)}</span>
              </Pill>
            ))}
          </div>
        </div>
      )}

      {collections.top.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-faint">Top Collections</div>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {collections.top.map((entry) => (
              <Row key={entry.id} label={entry.name} value={abbreviate(entry.amount)} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
