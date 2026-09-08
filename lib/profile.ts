import "server-only";
import { NetworthManager, ProfileNetworthCalculator, UpdateManager } from "skyhelper-networth";
import {
  ApiError,
  getItemsMeta,
  getMuseum,
  getPlayer,
  getProfiles,
  resolvePlayer,
  type RawMember,
  type RawPlayer,
  type RawProfile,
} from "./hypixel";
import { decodeInventory, decodeMany, type SbItem } from "./nbt";
import { attachIcons } from "./icons";
import {
  CATACOMBS_FLOORS,
  DUNGEON_CLASSES,
  ESSENCE_TYPES,
  GAMEMODE_LABELS,
  KUUDRA_TIERS,
  MASTER_FLOORS,
  SKILL_LEGACY_KEYS,
  SKILL_ORDER,
  SLAYER_ORDER,
  TROPHY_FISH_TIERS,
} from "./constants";
import {
  HOTM_XP_CUMULATIVE,
  SKILL_CAPS,
  SLAYER_XP,
  dungeonLevel,
  levelFromCumulative,
  skillLevel,
  type LevelInfo,
} from "./xp";
import { petLevel, prettyPetName, rarityRank, type PetLevel } from "./pets";

export type ProfileSummary = {
  id: string;
  name: string;
  gameMode: string | null;
  gameModeLabel: string | null;
  selected: boolean;
  skyblockLevel: number;
};

export type SkillEntry = { key: string; name: string; info: LevelInfo };

export type SlayerEntry = {
  key: string;
  name: string;
  shortName: string;
  info: LevelInfo;
  kills: Record<string, number>;
  totalKills: number;
};

export type DungeonFloor = {
  id: string;
  name: string;
  completions: number;
  bestScore: number | null;
  fastestTime: number | null;
  fastestTimeSPlus: number | null;
};

export type PetEntry = {
  type: string;
  name: string;
  tier: string;
  level: PetLevel;
  active: boolean;
  heldItem: string | null;
  skin: string | null;
  candyUsed: number;
};

export type InventorySection = {
  key: string;
  label: string;
  items: SbItem[];
  columns: number;
};

export type NetworthBreakdown = {
  total: number;
  unsoulbound: number;
  purse: number;
  bank: number;
  noInventory: boolean;
  types: { key: string; label: string; total: number }[];
};

export type ProfileStats = {
  player: {
    uuid: string;
    name: string;
    rank: { label: string | null; color: string; plusColor: string };
    firstLogin: number | null;
    lastLogin: number | null;
    online: boolean | null;
  };
  profile: {
    id: string;
    name: string;
    gameMode: string | null;
    gameModeLabel: string | null;
    memberCount: number;
  };
  profiles: ProfileSummary[];
  skyblockLevel: { level: number; progress: number; xp: number };
  currencies: {
    purse: number;
    bank: number;
    personalBank: number;
    motes: number;
    essence: Record<string, number>;
  };
  skills: ReturnType<typeof buildSkills>;
  slayers: { entries: SlayerEntry[]; totalXp: number; totalKills: number };
  dungeons: {
    apiEnabled: boolean;
    catacombs: LevelInfo;
    selectedClass: string | null;
    classes: { key: string; name: string; info: LevelInfo }[];
    classAverage: number;
    floors: DungeonFloor[];
    masterFloors: DungeonFloor[];
    secrets: number | null;
    highestFloorBeaten: string | null;
    totalRuns: number;
  };
  mining: ReturnType<typeof buildMining>;
  extras: ReturnType<typeof buildExtras>;
  combat: {
    kills: number;
    deaths: number;
    highestCritDamage: number;
    bestiaryMilestone: number | null;
    fairySouls: number;
    magicalPower: number;
  };
  pets: PetEntry[];
  gear: {
    armor: SbItem[];
    equipment: SbItem[];
    weapons: SbItem[];
    accessories: SbItem[];
  };
  inventories: InventorySection[];
  collections: { total: number; unlockedTiers: number; top: { id: string; name: string; amount: number }[] };
  networth: NetworthBreakdown | null;
  warnings: string[];
};

// Kein npm-Update-Check im Server-Prozess, Preise 10 Minuten cachen.
UpdateManager.disable();
NetworthManager.setCachePrices(10 * 60 * 1000);

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pick<T>(...values: (T | undefined | null)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function rankOf(player: RawPlayer | null) {
  const fallback = { label: null as string | null, color: "#aaaaaa", plusColor: "#ff5555" };
  if (!player) return fallback;

  const plusColorMap: Record<string, string> = {
    BLACK: "#000000",
    DARK_BLUE: "#0000aa",
    DARK_GREEN: "#00aa00",
    DARK_AQUA: "#00aaaa",
    DARK_RED: "#aa0000",
    DARK_PURPLE: "#aa00aa",
    GOLD: "#ffaa00",
    GRAY: "#aaaaaa",
    DARK_GRAY: "#555555",
    BLUE: "#5555ff",
    GREEN: "#55ff55",
    AQUA: "#55ffff",
    RED: "#ff5555",
    LIGHT_PURPLE: "#ff55ff",
    YELLOW: "#ffff55",
    WHITE: "#ffffff",
  };

  const plusColor = plusColorMap[player.rankPlusColor ?? "RED"] ?? "#ff5555";
  const staff = player.rank && player.rank !== "NORMAL" ? String(player.rank) : null;

  if (staff) {
    const labels: Record<string, { label: string; color: string }> = {
      ADMIN: { label: "ADMIN", color: "#ff5555" },
      GAME_MASTER: { label: "GM", color: "#00aa00" },
      MODERATOR: { label: "MOD", color: "#00aa00" },
      HELPER: { label: "HELPER", color: "#5555ff" },
      YOUTUBER: { label: "YOUTUBE", color: "#ff5555" },
    };
    const entry = labels[staff];
    if (entry) return { label: entry.label, color: entry.color, plusColor: "#ffffff" };
  }

  if (player.monthlyPackageRank === "SUPERSTAR") {
    const monthlyColor = plusColorMap[player.monthlyRankColor ?? "GOLD"] ?? "#ffaa00";
    return { label: "MVP++", color: monthlyColor, plusColor };
  }

  const packageRank: string = pick(player.newPackageRank, player.packageRank) ?? "NONE";
  const map: Record<string, { label: string; color: string }> = {
    VIP: { label: "VIP", color: "#55ff55" },
    VIP_PLUS: { label: "VIP+", color: "#55ff55" },
    MVP: { label: "MVP", color: "#55ffff" },
    MVP_PLUS: { label: "MVP+", color: "#55ffff" },
  };
  const entry = map[packageRank];
  if (entry) return { label: entry.label, color: entry.color, plusColor: packageRank === "VIP_PLUS" ? "#ffaa00" : plusColor };
  return fallback;
}

function skillXpOf(member: RawMember, skillKey: string): number | null {
  const modern = member?.player_data?.experience?.[`SKILL_${skillKey.toUpperCase()}`];
  if (modern !== undefined) return num(modern);
  const legacy = member?.[`experience_skill_${SKILL_LEGACY_KEYS[skillKey] ?? skillKey}`];
  if (legacy !== undefined) return num(legacy);
  return null;
}

/**
 * Level-Cap eines Skills. Farming wird über Anita erhöht, andere Skills
 * über SKILL_<NAME>_extra_level_cap (z.B. Heart of the Forest).
 */
function skillCapOf(member: RawMember, skillKey: string): number {
  const base = SKILL_CAPS[skillKey] ?? 60;
  if (skillKey === "farming") {
    return base + num(member?.jacobs_contest?.perks?.farming_level_cap);
  }
  const extra = member?.player_data?.experience?.[`SKILL_${skillKey.toUpperCase()}_extra_level_cap`];
  return base + num(extra);
}

function buildSkills(member: RawMember) {
  const entries: SkillEntry[] = [];
  let apiEnabled = false;
  let totalXp = 0;

  for (const key of SKILL_ORDER) {
    const xp = skillXpOf(member, key);
    if (xp !== null) apiEnabled = true;
    const info = skillLevel(key, xp ?? 0, skillCapOf(member, key));
    totalXp += xp ?? 0;
    entries.push({ key, name: key.charAt(0).toUpperCase() + key.slice(1), info });
  }

  // Klassischer Skill Average: ohne kosmetische Skills und ohne Hunting,
  // damit der Wert mit anderen Statseiten vergleichbar bleibt.
  const cosmetic = ["carpentry", "runecrafting", "social"];
  const classic = entries.filter((entry) => ![...cosmetic, "hunting"].includes(entry.key));
  const withHunting = entries.filter((entry) => !cosmetic.includes(entry.key));

  const mean = (list: SkillEntry[], key: "level" | "levelWithProgress") =>
    list.reduce((sum, entry) => sum + entry.info[key], 0) / (list.length || 1);

  return {
    entries,
    average: mean(classic, "level"),
    averageWithProgress: mean(classic, "levelWithProgress"),
    averageWithHunting: mean(withHunting, "levelWithProgress"),
    totalXp,
    apiEnabled,
  };
}

function buildSlayers(member: RawMember) {
  const bosses = pick<Record<string, any>>(member?.slayer?.slayer_bosses, member?.slayer_bosses) ?? {};
  const entries: SlayerEntry[] = [];
  let totalXp = 0;
  let totalKills = 0;

  for (const key of SLAYER_ORDER) {
    const boss = bosses[key] ?? {};
    const xp = num(boss.xp);
    const info = levelFromCumulative(xp, SLAYER_XP[key] ?? []);
    const kills: Record<string, number> = {};
    let bossKills = 0;
    for (const [field, value] of Object.entries(boss)) {
      const match = /^boss_kills_tier_(\d+)$/.exec(field);
      if (match) {
        const tier = String(Number(match[1]) + 1);
        kills[tier] = num(value);
        bossKills += num(value);
      }
    }
    totalXp += xp;
    totalKills += bossKills;
    entries.push({
      key,
      name: key,
      shortName: key,
      info,
      kills,
      totalKills: bossKills,
    });
  }

  return { entries, totalXp, totalKills };
}

function floorsFrom(data: Record<string, any> | undefined, list: { id: string; name: string }[]): DungeonFloor[] {
  const completions = data?.tier_completions ?? {};
  const bestScore = data?.best_score ?? {};
  const fastest = data?.fastest_time ?? {};
  const fastestSPlus = data?.fastest_time_s_plus ?? {};

  return list.map((floor) => ({
    id: floor.id,
    name: floor.name,
    completions: num(completions[floor.id]),
    bestScore: bestScore[floor.id] !== undefined ? num(bestScore[floor.id]) : null,
    fastestTime: fastest[floor.id] !== undefined ? num(fastest[floor.id]) : null,
    fastestTimeSPlus: fastestSPlus[floor.id] !== undefined ? num(fastestSPlus[floor.id]) : null,
  }));
}

function buildDungeons(member: RawMember, player: RawPlayer | null) {
  const dungeons = member?.dungeons;
  const catacombsData = dungeons?.dungeon_types?.catacombs;
  const masterData = dungeons?.dungeon_types?.master_catacombs;
  const apiEnabled = Boolean(catacombsData);

  const catacombs = dungeonLevel(num(catacombsData?.experience));
  const classData = dungeons?.player_classes ?? {};
  const classes = DUNGEON_CLASSES.map((key) => ({
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    info: dungeonLevel(num(classData[key]?.experience)),
  }));
  const classAverage = classes.reduce((sum, entry) => sum + entry.info.level, 0) / (classes.length || 1);

  const floors = floorsFrom(catacombsData, CATACOMBS_FLOORS);
  const masterFloors = floorsFrom(masterData, MASTER_FLOORS);

  const highestNormal = [...floors].reverse().find((floor) => floor.completions > 0);
  const highestMaster = [...masterFloors].reverse().find((floor) => floor.completions > 0);
  const highestFloorBeaten = highestMaster?.name ?? highestNormal?.name ?? null;

  const totalRuns =
    floors.reduce((sum, floor) => sum + floor.completions, 0) +
    masterFloors.reduce((sum, floor) => sum + floor.completions, 0);

  const secrets = pick(dungeons?.secrets, player?.achievements?.skyblock_treasure_hunter);

  return {
    apiEnabled,
    catacombs,
    selectedClass: dungeons?.selected_dungeon_class ?? null,
    classes,
    classAverage,
    floors,
    masterFloors,
    secrets: secrets !== undefined ? num(secrets) : null,
    highestFloorBeaten,
    totalRuns,
  };
}

function buildMining(member: RawMember) {
  const core = member?.mining_core ?? {};
  const tree = member?.skill_tree ?? {};

  // Seit dem Skill-Tree-Umbau liegt die HOTM-XP unter skill_tree.experience.mining.
  const hotmXp = num(pick(tree?.experience?.mining, core.experience));
  const hotm = levelFromCumulative(hotmXp, HOTM_XP_CUMULATIVE);

  const crystals = Object.entries(core.crystals ?? {}).map(([name, value]) => {
    const crystal = value as { state?: string; total_placed?: number };
    return {
      name: name.replace(/_crystal$/, "").replace(/_/g, " "),
      state: crystal?.state ?? "NOT_FOUND",
      total: num(crystal?.total_placed),
    };
  });

  return {
    hotm,
    mithrilPowder: num(core.powder_mithril),
    gemstonePowder: num(core.powder_gemstone),
    glacitePowder: num(core.powder_glacite),
    totalMithril: num(pick(core.powder_mithril_total, num(core.powder_mithril) + num(core.powder_spent_mithril))),
    totalGemstone: num(pick(core.powder_gemstone_total, num(core.powder_gemstone) + num(core.powder_spent_gemstone))),
    totalGlacite: num(pick(core.powder_glacite_total, num(core.powder_glacite) + num(core.powder_spent_glacite))),
    selectedAbility: pick<string>(tree?.selected_ability?.mining, core.selected_pickaxe_ability) ?? null,
    tokensSpentMountain: num(tree?.tokens_spent?.mountain),
    forestXp: num(tree?.experience?.foraging),
    tokensSpentForest: Object.entries(tree?.tokens_spent ?? {})
      .filter(([key]) => key.startsWith("forest"))
      .reduce((sum, [, value]) => sum + num(value), 0),
    unlockedTemples: (member?.temples?.unlocked_temples ?? []) as string[],
    crystals,
    fossilsDonated: (member?.glacite_player_data?.fossils_donated ?? []).length,
    corpsesLooted: Object.values(member?.glacite_player_data?.corpses_looted ?? {}).reduce(
      (sum: number, value) => sum + num(value),
      0,
    ),
    mineshaftsEntered: num(member?.glacite_player_data?.mineshafts_entered),
  };
}

function buildPets(member: RawMember): PetEntry[] {
  const raw: any[] = pick<any[]>(member?.pets_data?.pets, member?.pets) ?? [];
  return raw
    .map((pet) => {
      const tier = String(pet?.tier ?? "COMMON").toUpperCase();
      const type = String(pet?.type ?? "");
      return {
        type,
        name: prettyPetName(type),
        tier,
        level: petLevel(num(pet?.exp), tier, type),
        active: Boolean(pet?.active),
        heldItem: pet?.heldItem ?? null,
        skin: pet?.skin ?? null,
        candyUsed: num(pet?.candyUsed),
      };
    })
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (b.level.level !== a.level.level) return b.level.level - a.level.level;
      return rarityRank(b.tier) - rarityRank(a.tier);
    });
}

/**
 * Loadout-Sets (ersetzt die alte Wardrobe): pro Set liegt für jeden Slot
 * ein eigener NBT-Blob, z.B. loadout.armor["1"].CHESTPLATE.data.
 */
async function decodeLoadoutSets(sets: Record<string, any> | undefined): Promise<SbItem[]> {
  if (!sets) return [];
  const entries = Object.entries(sets).sort((a, b) => Number(a[0]) - Number(b[0]));
  const items: SbItem[] = [];

  for (const [, set] of entries) {
    const slots = Object.entries(set ?? {}).filter(([key]) => key === key.toUpperCase() && key !== "ID");
    const decoded = await Promise.all(slots.map(([, blob]) => decodeInventory(blob)));
    // Jedes Set fuellt genau vier Slots, damit die Grids sauber bleiben.
    const flat = decoded.flat();
    for (let index = 0; index < 4; index++) {
      const item = flat[index];
      if (item) items.push({ ...item, slot: items.length });
      else items.push(null as unknown as SbItem);
    }
  }

  return items.filter(Boolean).map((item, index) => ({ ...item, slot: index }));
}

async function buildInventories(member: RawMember) {
  const inv = member?.inventory ?? {};
  const bags = inv.bag_contents ?? {};
  const shared = member?.shared_inventory ?? {};

  const blob = (modern: unknown, legacy: unknown) => pick(modern, legacy);

  const [
    armor,
    equipment,
    inventory,
    enderchest,
    accessories,
    quiver,
    potions,
    fishing,
    vault,
    candy,
    storage,
    loadoutArmor,
    loadoutEquipment,
  ] = await Promise.all([
    decodeInventory(blob(inv.inv_armor, member?.inv_armor)),
    decodeInventory(blob(inv.equipment_contents, member?.equippment_contents)),
    decodeInventory(blob(inv.inv_contents, member?.inv_contents)),
    decodeInventory(blob(inv.ender_chest_contents, member?.ender_chest_contents)),
    decodeInventory(blob(bags.talisman_bag, member?.talisman_bag)),
    decodeInventory(blob(bags.quiver, member?.quiver)),
    decodeInventory(blob(bags.potion_bag, member?.potion_bag)),
    decodeInventory(blob(bags.fishing_bag, member?.fishing_bag)),
    decodeInventory(blob(inv.personal_vault_contents, member?.personal_vault_contents)),
    decodeInventory(shared.candy_inventory_contents),
    decodeMany(Object.values(pick<Record<string, unknown>>(inv.backpack_contents, member?.backpack_contents) ?? {})),
    decodeLoadoutSets(member?.loadout?.armor),
    decodeLoadoutSets(member?.loadout?.equipment),
  ]);

  // Icons zentral auflösen (Pack-Override, Kopf-Texturen, Vanilla-Material).
  await attachIcons([
    armor,
    equipment,
    inventory,
    enderchest,
    accessories,
    quiver,
    potions,
    fishing,
    vault,
    candy,
    storage,
    loadoutArmor,
    loadoutEquipment,
  ]);

  const sections: InventorySection[] = [
    { key: "inventory", label: "Inventar", items: inventory, columns: 9 },
    { key: "enderchest", label: "Enderchest", items: enderchest, columns: 9 },
    { key: "storage", label: "Backpacks", items: storage, columns: 9 },
    { key: "loadout_armor", label: "Loadouts: Rüstung", items: loadoutArmor, columns: 8 },
    { key: "loadout_equipment", label: "Loadouts: Equipment", items: loadoutEquipment, columns: 8 },
    { key: "accessories", label: "Accessory Bag", items: accessories, columns: 9 },
    { key: "quiver", label: "Quiver", items: quiver, columns: 9 },
    { key: "potions", label: "Potion Bag", items: potions, columns: 9 },
    { key: "fishing", label: "Fishing Bag", items: fishing, columns: 9 },
    { key: "vault", label: "Personal Vault", items: vault, columns: 9 },
    { key: "candy", label: "Candy", items: candy, columns: 9 },
  ].filter((section) => section.items.length > 0);

  // Waffen und Werkzeuge aus dem Inventar herausziehen (Hotbar-Logik ist unzuverlässig,
  // daher nach Item-Kategorie in der Lore filtern).
  const weaponWords = ["SWORD", "BOW", "WAND", "LONGSWORD", "GAUNTLET", "FISHING ROD", "PICKAXE", "AXE", "SHOVEL", "HOE", "DRILL"];
  const weapons = inventory.filter((item) =>
    item.loreText.some((line) => weaponWords.some((word) => line.toUpperCase().includes(word))),
  );

  return { armor, equipment, accessories, weapons, sections };
}

function buildCollections(member: RawMember) {
  const collection = (member?.collection ?? {}) as Record<string, number>;
  const unlockedTiers: string[] = member?.player_data?.unlocked_coll_tiers ?? member?.unlocked_coll_tiers ?? [];
  const top = Object.entries(collection)
    .map(([id, amount]) => ({
      id,
      name: id
        .replace(/^[A-Z_]+:/, "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      amount: num(amount),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12);

  return {
    total: Object.values(collection).reduce((sum, value) => sum + num(value), 0),
    unlockedTiers: unlockedTiers.length,
    top,
  };
}

function buildExtras(member: RawMember) {
  const nether = member?.nether_island_player_data ?? {};
  const kuudra = nether.kuudra_completed_tiers ?? {};
  const trophy = member?.trophy_fish ?? {};

  const kuudraTiers = KUUDRA_TIERS.map((tier) => ({
    key: tier.key,
    name: tier.name,
    completions: num(kuudra[tier.key]),
    highestWave: num(kuudra[`highest_wave_${tier.key}`]),
  })).filter((tier) => tier.completions > 0);

  // Trophy-Fish: pro Fischart gibt es Zaehler je Stufe (<name>_bronze usw.).
  const trophyTiers: Record<string, number> = {};
  const trophyFishNames = new Set<string>();
  for (const [key, value] of Object.entries(trophy)) {
    if (key === "total_caught" || key === "last_caught" || key === "rewards") continue;
    const tier = TROPHY_FISH_TIERS.find((candidate) => key.endsWith(`_${candidate}`));
    if (tier) {
      trophyTiers[tier] = (trophyTiers[tier] ?? 0) + num(value);
      trophyFishNames.add(key.replace(`_${tier}`, ""));
    } else {
      trophyFishNames.add(key);
    }
  }

  const sacks = Object.entries(member?.inventory?.sacks_counts ?? {})
    .map(([id, amount]) => ({ id, name: titleCaseId(id), amount: num(amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    crimsonIsle: {
      faction: (nether.selected_faction ?? null) as string | null,
      magesReputation: num(nether.mages_reputation),
      barbariansReputation: num(nether.barbarians_reputation),
      kuudraTiers,
      dojoBest: Object.entries(nether.dojo ?? {})
        .filter(([key]) => key.startsWith("dojo_points"))
        .reduce((sum, [, value]) => sum + num(value), 0),
    },
    trophyFish: {
      totalCaught: num(trophy.total_caught),
      uniqueFish: trophyFishNames.size,
      tiers: trophyTiers,
    },
    shards: {
      owned: Object.keys(member?.shards?.owned ?? {}).length,
      fused: Object.keys(member?.shards?.fused ?? {}).length,
    },
    safari: {
      discovered: (member?.safari?.discovered_critters ?? []).length,
      sparkling: (member?.safari?.discovered_sparkling_critters ?? []).length,
      tickets: num(member?.safari?.tickets),
    },
    minions: (member?.player_data?.crafted_generators ?? []).length,
    riftProgress: {
      unlocked: Object.keys(member?.rift ?? {}).length > 0,
      motes: num(member?.currencies?.motes_purse),
    },
    gardenCopper: num(member?.garden_player_data?.copper),
    sacks,
  };
}

function titleCaseId(id: string): string {
  return id
    .replace(/^[A-Z_]+:/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function buildNetworth(
  member: RawMember,
  bankBalance: number,
  museum: Record<string, any> | null,
  uuid: string,
): Promise<{ networth: NetworthBreakdown | null; warning?: string }> {
  try {
    const museumData = museum?.[uuid] ?? undefined;
    const calculator = new ProfileNetworthCalculator(member, museumData, bankBalance);
    const result = await calculator.getNetworth({ onlyNetworth: true });

    const labels: Record<string, string> = {
      armor: "Rüstung",
      equipment: "Equipment",
      wardrobe: "Wardrobe",
      inventory: "Inventar",
      enderchest: "Enderchest",
      accessories: "Accessories",
      personal_vault: "Personal Vault",
      storage: "Storage",
      museum: "Museum",
      sacks: "Säcke",
      essence: "Essence",
      pets: "Pets",
      quiver: "Quiver",
      fishing_bag: "Fishing Bag",
      potion_bag: "Potion Bag",
      candy_inventory: "Candy",
      carnival_mask_inventory: "Carnival Masks",
      farming_toolkit: "Farming Toolkit",
      hunting_toolkit: "Hunting Toolkit",
      sacks_bag: "Sack-Bag",
    };

    const types = Object.entries(result.types ?? {})
      .map(([key, value]) => ({ key, label: labels[key] ?? key, total: num((value as any)?.total) }))
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      networth: {
        total: num(result.networth),
        unsoulbound: num(result.unsoulboundNetworth),
        purse: num(result.purse),
        bank: num(result.bank),
        noInventory: Boolean(result.noInventory),
        types,
      },
    };
  } catch (error) {
    return { networth: null, warning: `Networth-Berechnung fehlgeschlagen: ${(error as Error).message}` };
  }
}

export function summarize(profiles: RawProfile[], uuid: string): ProfileSummary[] {
  return profiles
    .map((profile) => {
      const member = profile.members?.[uuid] ?? {};
      return {
        id: profile.profile_id,
        name: profile.cute_name ?? profile.profile_id.slice(0, 8),
        gameMode: profile.game_mode ?? null,
        gameModeLabel: profile.game_mode ? GAMEMODE_LABELS[profile.game_mode] ?? profile.game_mode : null,
        selected: Boolean(profile.selected),
        skyblockLevel: Math.floor(num(member?.leveling?.experience) / 100),
      };
    })
    .sort((a, b) => b.skyblockLevel - a.skyblockLevel);
}

export async function loadProfileStats(playerInput: string, profileInput?: string): Promise<ProfileStats> {
  const { uuid, name } = await resolvePlayer(playerInput);
  const [profiles, player] = await Promise.all([getProfiles(uuid), getPlayer(uuid)]);

  const wanted = profileInput?.toLowerCase();
  const profile =
    (wanted
      ? profiles.find(
          (entry) =>
            entry.cute_name?.toLowerCase() === wanted || entry.profile_id.toLowerCase() === wanted,
        )
      : undefined) ??
    profiles.find((entry) => entry.selected) ??
    profiles[0];

  if (!profile) throw new ApiError("Profil nicht gefunden", 404);
  if (wanted && profile.cute_name?.toLowerCase() !== wanted && profile.profile_id.toLowerCase() !== wanted) {
    throw new ApiError(`Profil "${profileInput}" existiert nicht für ${name}`, 404);
  }

  const member: RawMember = profile.members?.[uuid] ?? {};
  const warnings: string[] = [];

  const bankBalance = num(profile.banking?.balance);
  const museum = await getMuseum(profile.profile_id);

  const [inventories, networthResult] = await Promise.all([
    buildInventories(member),
    buildNetworth(member, bankBalance, museum, uuid),
  ]);
  if (networthResult.warning) warnings.push(networthResult.warning);

  const skills = buildSkills(member);
  if (!skills.apiEnabled) warnings.push("Skills-API ist bei diesem Spieler deaktiviert");
  if (inventories.sections.length === 0) warnings.push("Inventar-API ist bei diesem Spieler deaktiviert");

  const essence: Record<string, number> = {};
  for (const type of ESSENCE_TYPES) {
    const modern = member?.currencies?.essence?.[type.toUpperCase()]?.current;
    const legacy = member?.[`essence_${type}`];
    const value = num(pick(modern, legacy));
    if (value > 0) essence[type] = value;
  }

  const skyblockXp = num(member?.leveling?.experience);

  return {
    player: {
      uuid,
      name,
      rank: rankOf(player),
      firstLogin: player?.firstLogin ? num(player.firstLogin) : num(member?.profile?.first_join) || null,
      lastLogin: player?.lastLogin ? num(player.lastLogin) : null,
      online: player ? num(player.lastLogin) > num(player.lastLogout) : null,
    },
    profile: {
      id: profile.profile_id,
      name: profile.cute_name ?? profile.profile_id.slice(0, 8),
      gameMode: profile.game_mode ?? null,
      gameModeLabel: profile.game_mode ? GAMEMODE_LABELS[profile.game_mode] ?? profile.game_mode : null,
      memberCount: Object.keys(profile.members ?? {}).length,
    },
    profiles: summarize(profiles, uuid),
    skyblockLevel: {
      level: Math.floor(skyblockXp / 100),
      progress: (skyblockXp % 100) / 100,
      xp: skyblockXp,
    },
    currencies: {
      purse: num(pick(member?.currencies?.coin_purse, member?.coin_purse)),
      bank: bankBalance,
      personalBank: num(member?.profile?.bank_account),
      motes: num(member?.currencies?.motes_purse),
      essence,
    },
    skills,
    slayers: buildSlayers(member),
    dungeons: buildDungeons(member, player),
    mining: buildMining(member),
    extras: buildExtras(member),
    combat: {
      kills: num(pick(member?.player_stats?.kills?.total, member?.stats?.kills)),
      deaths: num(pick(member?.player_stats?.deaths?.total, member?.player_data?.death_count)),
      highestCritDamage: num(member?.player_stats?.highest_critical_damage),
      bestiaryMilestone: member?.bestiary?.milestone?.last_claimed_milestone ?? null,
      fairySouls: num(pick(member?.fairy_soul?.total_collected, member?.fairy_souls_collected)),
      magicalPower: num(member?.accessory_bag_storage?.highest_magical_power),
    },
    pets: buildPets(member),
    gear: {
      armor: inventories.armor,
      equipment: inventories.equipment,
      weapons: inventories.weapons,
      accessories: inventories.accessories,
    },
    inventories: inventories.sections,
    collections: buildCollections(member),
    networth: networthResult.networth,
    warnings,
  };
}

export { getItemsMeta };
