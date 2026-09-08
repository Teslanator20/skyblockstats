import "server-only";

const HYPIXEL = "https://api.hypixel.net/v2";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export type MojangProfile = {
  uuid: string;
  name: string;
};

function stripDashes(uuid: string) {
  return uuid.replace(/-/g, "");
}

const NAME_RE = /^[a-zA-Z0-9_]{1,16}$/;
const UUID_RE = /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Namen oder UUID zu {uuid, name} aufloesen. */
export async function resolvePlayer(input: string): Promise<MojangProfile> {
  return cached(`mojang:${input.trim().toLowerCase()}`, 10 * 60 * 1000, () => resolvePlayerUncached(input));
}

async function resolvePlayerUncached(input: string): Promise<MojangProfile> {
  const query = input.trim();
  if (!query) throw new ApiError("Kein Spielername angegeben", 400);

  if (!NAME_RE.test(query) && !UUID_RE.test(query)) {
    const reason =
      query.length > 16
        ? "Minecraft-Namen haben maximal 16 Zeichen"
        : "erlaubt sind nur Buchstaben, Zahlen und Unterstriche";
    throw new ApiError(`"${query}" ist kein gültiger Spielername (${reason})`, 400);
  }

  // Ashcon loest Namen und UUIDs auf und liefert den korrekt geschriebenen Namen zurueck.
  const ashcon = await fetch(`https://api.ashcon.app/mojang/v2/user/${encodeURIComponent(query)}`, {
    next: { revalidate: 600 },
  }).catch(() => null);

  if (ashcon?.ok) {
    const data = (await ashcon.json()) as { uuid?: string; username?: string };
    if (data.uuid && data.username) {
      return { uuid: stripDashes(data.uuid), name: data.username };
    }
  }

  if (UUID_RE.test(query)) {
    const res = await fetch(
      `https://sessionserver.mojang.com/session/minecraft/profile/${stripDashes(query)}`,
      { next: { revalidate: 600 } },
    ).catch(() => null);
    if (res?.ok) {
      const data = (await res.json()) as { id?: string; name?: string };
      if (data.id && data.name) return { uuid: stripDashes(data.id), name: data.name };
    }
    throw new ApiError("Spieler zu dieser UUID nicht gefunden", 404);
  }

  const mojang = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(query)}`, {
    next: { revalidate: 600 },
  }).catch(() => null);

  if (mojang?.ok) {
    const data = (await mojang.json()) as { id?: string; name?: string };
    if (data.id && data.name) return { uuid: stripDashes(data.id), name: data.name };
  }

  throw new ApiError(`Spieler "${query}" existiert nicht`, 404);
}

/**
 * Prozess-Cache. Der fetch-Cache von Next hilft hier nicht: Profil-Antworten
 * eines gut gespielten Accounts liegen deutlich über dem 2-MB-Limit des Data
 * Caches und werden deshalb gar nicht gecacht.
 */
const memo = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;

  const value = await load();
  memo.set(key, { at: Date.now(), value });

  // Simple Obergrenze, damit der Cache nicht unbegrenzt waechst.
  if (memo.size > 200) {
    const oldest = [...memo.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 50);
    for (const [staleKey] of oldest) memo.delete(staleKey);
  }

  return value;
}

function apiKey(): string {
  const key = process.env.HYPIXEL_API_KEY;
  if (!key) {
    throw new ApiError(
      "HYPIXEL_API_KEY fehlt. Key auf developer.hypixel.net erstellen und in .env.local eintragen.",
      503,
    );
  }
  return key;
}

async function hypixelGet<T>(path: string): Promise<T> {
  const res = await fetch(`${HYPIXEL}${path}`, {
    headers: { "API-Key": apiKey() },
    cache: "no-store",
  });

  if (res.status === 403) throw new ApiError("Hypixel API-Key ungültig oder abgelaufen", 403);
  if (res.status === 429) throw new ApiError("Hypixel API Rate-Limit erreicht. Kurz warten.", 429);
  if (!res.ok) throw new ApiError(`Hypixel API Fehler (HTTP ${res.status})`, 502);

  const data = (await res.json()) as { success?: boolean; cause?: string } & T;
  if (data.success === false) throw new ApiError(`Hypixel API: ${data.cause ?? "unbekannter Fehler"}`, 502);
  return data;
}

/** Oeffentliche Endpoints ohne Key. */
async function hypixelPublic<T>(path: string, revalidate = 300): Promise<T | null> {
  const res = await fetch(`${HYPIXEL}${path}`, { next: { revalidate } }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()) as T;
}

export type RawProfile = {
  profile_id: string;
  cute_name?: string;
  game_mode?: string;
  selected?: boolean;
  members: Record<string, RawMember>;
  banking?: { balance?: number; transactions?: unknown[] };
  community_upgrades?: unknown;
};

// Die Hypixel-Antwort ist tief verschachtelt und aendert sich oft, daher bewusst locker typisiert.
export type RawMember = Record<string, any>;

export type RawPlayer = Record<string, any>;

const PROFILES_TTL = 120 * 1000;
const PLAYER_TTL = 300 * 1000;
const MUSEUM_TTL = 600 * 1000;

export async function getProfiles(uuid: string): Promise<RawProfile[]> {
  const profiles = await cached(`profiles:${uuid}`, PROFILES_TTL, async () => {
    const data = await hypixelGet<{ profiles: RawProfile[] | null }>(
      `/skyblock/profiles?uuid=${stripDashes(uuid)}`,
    );
    return data.profiles ?? [];
  });

  if (profiles.length === 0) {
    throw new ApiError("Dieser Spieler hat keine SkyBlock-Profile (oder die API ist deaktiviert)", 404);
  }
  return profiles;
}

export async function getPlayer(uuid: string): Promise<RawPlayer | null> {
  return cached(`player:${uuid}`, PLAYER_TTL, async () => {
    try {
      const data = await hypixelGet<{ player: RawPlayer | null }>(`/player?uuid=${stripDashes(uuid)}`);
      return data.player ?? null;
    } catch {
      // Player-Endpoint ist nice-to-have (Rank, Login-Zeiten) - Ausfall darf die Seite nicht killen.
      return null;
    }
  });
}

export type BazaarProduct = {
  quick_status?: { buyPrice?: number; sellPrice?: number };
};

export async function getBazaar(): Promise<Record<string, BazaarProduct>> {
  const data = await hypixelPublic<{ products?: Record<string, BazaarProduct> }>("/skyblock/bazaar", 180);
  return data?.products ?? {};
}

export type SkyBlockItem = {
  id: string;
  name?: string;
  material?: string;
  tier?: string;
  npc_sell_price?: number;
};

// Die Item-Ressource ist mehrere Megabyte gross und damit zu gross fuer den
// fetch-Cache von Next - daher im Prozess halten.
let itemsMetaCache: { at: number; map: Record<string, SkyBlockItem> } | null = null;
const ITEMS_META_TTL = 12 * 60 * 60 * 1000;

export async function getItemsMeta(): Promise<Record<string, SkyBlockItem>> {
  if (itemsMetaCache && Date.now() - itemsMetaCache.at < ITEMS_META_TTL) {
    return itemsMetaCache.map;
  }

  const res = await fetch(`${HYPIXEL}/resources/skyblock/items`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return itemsMetaCache?.map ?? {};

  const data = (await res.json()) as { items?: SkyBlockItem[] };
  const map: Record<string, SkyBlockItem> = {};
  for (const item of data.items ?? []) map[item.id] = item;

  itemsMetaCache = { at: Date.now(), map };
  return map;
}

/** Museum-Daten (eigener Endpoint, braucht Key). */
export async function getMuseum(profileId: string): Promise<RawMember | null> {
  return cached(`museum:${profileId}`, MUSEUM_TTL, async () => {
    try {
      const data = await hypixelGet<{ members?: Record<string, any> }>(
        `/skyblock/museum?profile=${profileId}`,
      );
      return data.members ?? null;
    } catch {
      return null;
    }
  });
}

export function hasApiKey(): boolean {
  return Boolean(process.env.HYPIXEL_API_KEY);
}
