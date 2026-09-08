# SkyBlock Stats

Zeigt Hypixel-SkyBlock-Profile so an wie [sky.shiiyu.moe](https://sky.shiiyu.moe) oder
[skyprizm.com](https://skyprizm.com), rechnet die Werte aber selbst aus der offiziellen Hypixel API.

## Setup

```bash
npm install
cp .env.example .env.local   # HYPIXEL_API_KEY von https://developer.hypixel.net eintragen
npm run dev
```

Dann `/stats/<Spielername>` aufrufen, mit Profil `/stats/Teslanator/Strawberry`. Lässt du das
Profil weg, nimmt die Seite das im Spiel gewählte. Dieselben Daten als JSON liefert
`/api/stats/<Spielername>[/<Profilname>]`.

## Was drin ist

- **Kopfzeile**: Skin-Render, Rang, SkyBlock Level, Skill Average, Catacombs, Slayer-XP, Networth,
  Coins, dazu ein Profilwechsler, der Ironman, Bingo und Stranded markiert
- **Skills**: Level, Fortschritt und XP bis zum nächsten Level. Die Caps kommen aus dem Profil,
  also Anita-Level fürs Farming und `extra_level_cap` etwa fürs Foraging
- **Slayer**: Level, XP und Boss-Kills pro Tier, alle sechs Bosse
- **Dungeons**: Catacombs-Level, Klassenlevel, pro Floor Runs, Best Score und Fastest S+, normal
  und Master Mode, dazu Secrets
- **Mining**: Heart of the Mountain, Powder aktuell und gesamt, Heart of the Forest, Tempel,
  Glacite Mineshafts, Kristalle
- **Ausrüstung**: Rüstung, Equipment und Waffen mit dem Original-NBT, also Name, Lore, Rarity
  und Sterne
- **Networth**: Gesamtwert, Wert ohne Soulbound, aufgeschlüsselt nach Inventar, Pets, Museum
  und Säcken
- **Pets**: Level bis 200 bei Drachen, Rarity, gehaltenes Item
- **Inhalte**: Crimson Isle und Kuudra, Trophy Fish, Shards, Safari-Critters, Minions,
  größte Säcke
- **Inventare**: Inventar, Enderchest, Backpacks, Loadouts, Taschen und Vault als Item-Grid.
  Beim Hovern kommt der Minecraft-Tooltip mit der echten Lore

## Item-Icons

Jedes Item nimmt die erste Quelle, die etwas liefert:

1. `public/pack/<SKYBLOCK_ID>.png`, dein eigener Texture-Pack-Override (Details in
   `public/pack/README.md`)
2. Kopf-Textur aus dem Item-NBT (`SkullOwner`)
3. `skin`-Feld aus `/resources/skyblock/items`, das deckt rund 2800 Items ab
4. Vanilla-Textur des Materials. Gefärbtes Leder färbt die Seite über `display.color` ein
5. Initialen in der Rarity-Farbe

Schritt 5 gibt es, weil Hotspot Radar, Abiphone und Fischernetze in Vanilla auf `PAPER` laufen.
Ohne Pack siehst du sonst zwanzig identische Papierblätter. Für echte Grafiken legst du einen
Pack in `public/pack/`.

## Technik

- Next.js 16 mit App Router und Server Components, Tailwind CSS 4
- `prismarine-nbt` dekodiert die gzip- und Base64-Item-Blobs aus der API
- `skyhelper-networth` rechnet den Networth, Museum inklusive, soweit die API es hergibt
- Skin-Renders kommen von crafatar, Kopf-Texturen von mc-heads, Item-Texturen aus den
  Vanilla-Assets
- API-Antworten liegen in einem Prozess-Cache: Profile 2 Minuten, Player 5, Museum 10, die
  Item-Ressource 12 Stunden. Der `fetch`-Cache von Next hilft hier nicht, weil Profil-Antworten
  gut gespielter Accounts über dem 2-MB-Limit des Data Caches liegen

## Hinweise

- Hypixel verschiebt Felder im Profil regelmäßig. Aktueller Stand: Skill-XP in
  `player_data.experience.SKILL_*`, HOTM-XP in `skill_tree.experience.mining`, `loadout` statt
  Wardrobe. Der Code prüft zusätzlich die alten Pfade.
- Hat ein Spieler die Skills- oder Inventar-API aus, schreibt die Seite das hin, statt Nullen
  als echte Werte auszugeben.
- Kein Bezug zu Hypixel oder Mojang.
