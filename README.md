# SkyBlock Stats

Statistik-Viewer für Hypixel SkyBlock — in der Machart von [sky.shiiyu.moe](https://sky.shiiyu.moe)
und [skyprizm.com](https://skyprizm.com), aber mit eigener Berechnung direkt aus der offiziellen
Hypixel API.

## Setup

```bash
npm install
cp .env.example .env.local   # HYPIXEL_API_KEY von https://developer.hypixel.net eintragen
npm run dev
```

Aufrufen: `http://localhost:3000/stats/<Spielername>` oder `.../stats/<Spielername>/<Profilname>`
(z. B. `/stats/Teslanator/Strawberry`). Ohne Profilnamen wird das aktuell gewählte Profil genutzt.

JSON gibt es unter `/api/stats/<Spielername>[/<Profilname>]`.

## Was angezeigt wird

- **Kopfzeile** — Skin-Render, Hypixel-Rang, SkyBlock Level, Skill Average, Catacombs, Slayer-XP,
  Networth, Coins, plus Profilwechsler (inkl. Ironman/Bingo/Stranded-Markierung)
- **Skills** — alle Skills mit Level, Fortschritt und XP bis zum nächsten Level; Level-Caps werden
  dynamisch bestimmt (Anita-Level für Farming, `extra_level_cap` z. B. für Foraging)
- **Slayer** — Level, XP, Boss-Kills pro Tier für alle sechs Bosse
- **Dungeons** — Catacombs-Level, Klassenlevel, Runs/Best Score/Fastest S+ je Floor (normal und
  Master Mode), Secrets
- **Mining** — Heart of the Mountain, Powder (aktuell/gesamt), Heart of the Forest, Tempel,
  Glacite Mineshafts, Kristalle
- **Ausrüstung** — Rüstung, Equipment, Waffen mit Original-Item-NBT (Name, Lore, Rarity, Sterne)
- **Networth** — Gesamt, ohne Soulbound und aufgeschlüsselt nach Inventar, Pets, Museum, Säcken …
- **Pets** — Level (inkl. 200er-Drachen), Rarity, gehaltenes Item
- **Inhalte** — Crimson Isle/Kuudra, Trophy Fish, Shards, Safari-Critters, Minions, größte Säcke
- **Inventare** — Inventar, Enderchest, Backpacks, Loadouts, Taschen und Vault als Item-Grid mit
  Minecraft-Tooltip beim Hovern

## Item-Icons

Die Icon-Quelle wird pro Item in dieser Reihenfolge bestimmt:

1. `public/pack/<SKYBLOCK_ID>.png` — eigener Texture-Pack-Override (siehe `public/pack/README.md`)
2. Kopf-Textur aus dem Item-NBT (`SkullOwner`)
3. `skin`-Feld aus `/resources/skyblock/items` — deckt rund 2800 Items ab
4. Vanilla-Textur des Materials; gefärbtes Leder wird mit `display.color` eingefärbt
5. Initialen in Rarity-Farbe

Grund für Schritt 5: Items wie Hotspot Radar, Abiphone oder Fischernetze sind in Vanilla schlicht
`PAPER`. Ohne Texture-Pack sähen sie alle identisch aus — Initialen unterscheiden sie wenigstens.
Für echte Grafiken einen Pack in `public/pack/` legen.

## Technik

- Next.js 16 (App Router, Server Components) + Tailwind CSS 4
- `prismarine-nbt` dekodiert die gzip/Base64-Item-Blobs der API
- `skyhelper-networth` berechnet den Networth (inkl. Museum, sofern die API es hergibt)
- Skin-Renders von crafatar, Kopf-Texturen von mc-heads, Item-Texturen aus den Vanilla-Assets
- Antworten werden über `fetch`-Revalidierung gecacht (Profile 120 s, Ressourcen länger)

## Hinweise

- Die Hypixel-Profilstruktur ändert sich häufig. Aktuell gilt: Skill-XP unter
  `player_data.experience.SKILL_*`, HOTM-XP unter `skill_tree.experience.mining`, Wardrobe wurde
  durch `loadout` ersetzt. Beim Auslesen wird jeweils auch der alte Pfad als Fallback geprüft.
- Wenn ein Spieler die Skills- oder Inventar-API deaktiviert hat, zeigt die Seite das als Hinweis
  an, statt Nullwerte als echte Daten zu verkaufen.
- Nicht mit Hypixel oder Mojang verbunden.
