# SkyBlock Stats

Hypixel-SkyBlock-Profile ansehen: Skills, Slayer, Dungeons, Mining, Gear, Pets, Networth und
Inventare mit Item-Lore. Werte kommen aus der Hypixel API und werden hier selbst gerechnet.

```bash
npm install
cp .env.example .env.local   # HYPIXEL_API_KEY von developer.hypixel.net
npm run dev
```

`/stats/Teslanator` oder `/stats/Teslanator/Strawberry`. Als JSON: `/api/stats/<name>[/<profil>]`.

Eigene Item-Texturen: PNG als `public/pack/<SKYBLOCK_ID>.png` ablegen.

Hat ein Spieler die Skills- oder Inventar-API aus, sagt die Seite das. Kein Bezug zu Hypixel
oder Mojang.
