export const SKILL_ORDER = [
  "combat",
  "mining",
  "farming",
  "foraging",
  "fishing",
  "hunting",
  "enchanting",
  "alchemy",
  "taming",
  "carpentry",
  "runecrafting",
  "social",
] as const;

export const SKILL_NAMES: Record<string, string> = {
  combat: "Combat",
  mining: "Mining",
  farming: "Farming",
  foraging: "Foraging",
  fishing: "Fishing",
  hunting: "Hunting",
  enchanting: "Enchanting",
  alchemy: "Alchemy",
  taming: "Taming",
  carpentry: "Carpentry",
  runecrafting: "Runecrafting",
  social: "Social",
};

/**
 * Modern: player_data.experience.SKILL_<UPPERCASE>.
 * Legacy (vor dem Profil-Umbau): experience_skill_<legacy>.
 */
export const SKILL_LEGACY_KEYS: Record<string, string> = {
  social: "social2",
};

export const SLAYER_ORDER = ["zombie", "spider", "wolf", "enderman", "blaze", "vampire"] as const;

export const SLAYER_NAMES: Record<string, string> = {
  zombie: "Revenant Horror",
  spider: "Tarantula Broodfather",
  wolf: "Sven Packmaster",
  enderman: "Voidgloom Seraph",
  blaze: "Inferno Demonlord",
  vampire: "Riftstalker Bloodfiend",
};

export const SLAYER_SHORT: Record<string, string> = {
  zombie: "Revenant",
  spider: "Tarantula",
  wolf: "Sven",
  enderman: "Voidgloom",
  blaze: "Inferno",
  vampire: "Bloodfiend",
};

export const DUNGEON_CLASSES = ["healer", "mage", "berserk", "archer", "tank"] as const;

export const CATACOMBS_FLOORS = [
  { id: "0", name: "Entrance" },
  { id: "1", name: "Floor I" },
  { id: "2", name: "Floor II" },
  { id: "3", name: "Floor III" },
  { id: "4", name: "Floor IV" },
  { id: "5", name: "Floor V" },
  { id: "6", name: "Floor VI" },
  { id: "7", name: "Floor VII" },
];

export const MASTER_FLOORS = [
  { id: "1", name: "Master I" },
  { id: "2", name: "Master II" },
  { id: "3", name: "Master III" },
  { id: "4", name: "Master IV" },
  { id: "5", name: "Master V" },
  { id: "6", name: "Master VI" },
  { id: "7", name: "Master VII" },
];

export const RARITY_COLORS: Record<string, string> = {
  COMMON: "#ffffff",
  UNCOMMON: "#55ff55",
  RARE: "#5555ff",
  EPIC: "#aa00aa",
  LEGENDARY: "#ffaa00",
  MYTHIC: "#ff55ff",
  DIVINE: "#55ffff",
  SPECIAL: "#ff5555",
  VERY_SPECIAL: "#ff5555",
  SUPREME: "#ff5555",
  ADMIN: "#aa0000",
};

/** Minecraft Farb-Codes (§0-§f) auf Hex. */
export const MC_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#ffaa00",
  "7": "#aaaaaa",
  "8": "#555555",
  "9": "#5555ff",
  a: "#55ff55",
  b: "#55ffff",
  c: "#ff5555",
  d: "#ff55ff",
  e: "#ffff55",
  f: "#ffffff",
};

export const RANK_COLORS: Record<string, string> = {
  "VIP": "#55ff55",
  "VIP+": "#55ff55",
  "MVP": "#55ffff",
  "MVP+": "#55ffff",
  "MVP++": "#ffaa00",
  "YOUTUBE": "#ff5555",
  "ADMIN": "#ff5555",
  "GAME MASTER": "#00aa00",
  "MOJANG": "#00aaaa",
  "PIG+++": "#ff55ff",
  "INNIT": "#ff55ff",
  "OWNER": "#ff5555",
  "MEMBER": "#aaaaaa",
};

export const GAMEMODE_LABELS: Record<string, string> = {
  ironman: "Ironman",
  island: "Stranded",
  bingo: "Bingo",
};

export const HOTM_PERK_NAMES: Record<string, string> = {
  mining_speed: "Mining Speed",
  mining_fortune: "Mining Fortune",
  mining_speed_boost: "Mining Speed Boost",
  titanium_insanium: "Titanium Insanium",
  daily_powder: "Daily Powder",
  luck_of_the_cave: "Luck of the Cave",
  crystallized: "Crystallized",
  efficient_miner: "Efficient Miner",
  orbiter: "Orbiter",
  front_loaded: "Front Loaded",
  precision_mining: "Precision Mining",
  star_powder: "Star Powder",
  goblin_killer: "Goblin Killer",
  professional: "Professional",
  mole: "Mole",
  fortunate: "Fortunate",
  great_explorer: "Great Explorer",
  maniac_miner: "Maniac Miner",
  vein_seeker: "Vein Seeker",
  pickobulus: "Pickobulus",
  peak_of_the_mountain: "Peak of the Mountain",
};

export const ESSENCE_TYPES = [
  "wither",
  "spider",
  "undead",
  "dragon",
  "gold",
  "diamond",
  "ice",
  "crimson",
  "safari",
] as const;

export const KUUDRA_TIERS = [
  { key: "none", name: "Basic" },
  { key: "hot", name: "Hot" },
  { key: "burning", name: "Burning" },
  { key: "fiery", name: "Fiery" },
  { key: "infernal", name: "Infernal" },
] as const;

export const TROPHY_FISH_TIERS = ["bronze", "silver", "gold", "diamond"] as const;
