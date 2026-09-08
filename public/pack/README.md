# Texture-Pack-Override

Hier können eigene Item-Texturen abgelegt werden. Dateiname = SkyBlock-Item-ID in
Großbuchstaben, Endung `.png`:

```
public/pack/HOTSPOT_RADAR.png
public/pack/ABIPHONE_X_PLUS.png
public/pack/HYPERION.png
```

Diese Dateien haben Vorrang vor allen anderen Icon-Quellen (Kopf-Textur aus dem Item-NBT,
`skin`-Feld der Hypixel-Item-Ressource, Vanilla-Textur). Ideal für Packs wie Hypixel+ oder
FurfSky, die für Items eigene Grafiken mitbringen — die Vanilla-Materialien vieler
SkyBlock-Items sind schlicht `PAPER` oder ein Spielerkopf.

Der Ordnerinhalt wird beim ersten Zugriff eingelesen und gecacht: nach dem Hinzufügen neuer
Dateien den Dev-Server neu starten.
