# SCHAKO Bestellschlüssel Decoder

🛠️ Ein Web-Tool zum Dekodieren von SCHAKO-Bestellschlüsseln für DSX, ASK und EW Produkte.

## Features

- **Dekodierung von 3 Produkttypen**:
  - **DSX** - Schlitzdurchlass (12 Komponenten)
  - **ASK** - Anschlusskasten (15 Komponenten)
  - **EW** - Eckwinkel (9 Komponenten)
- **Code-Vergleich**: Vergleichen Sie zwei Codes (mit/ohne Bindestriche) um zu prüfen, ob sie identisch sind
- Dekodierung mit oder ohne Bindestriche
- Detaillierte Aufschlüsselung aller Komponenten
- Moderne, responsive Benutzeroberfläche
- Sofortige Validierung und Fehlerbehandlung

## Unterstützte Codes

### DSX - Schlitzdurchlass
```
DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0
oder
DSX2ZS09010L9005BN01000VMESB0
```

### ASK - Anschlusskasten
```
ASK-21-2-N-01000-VM-SV-DK2-GD1-I0-KHS-KVS-S1-SDS-E0
oder
ASK212N01000VMSVDK2GD1I0KHSKVSS1SDSE0
```

### EW - Eckwinkel
```
EW-21-2-S0-ELOX-B9005-090-000-000
oder
EW212S0ELOXB9005090000000
```

## Deployment auf Vercel

### Option 1: Deployment über GitHub (Empfohlen)

1. Gehe zu [Vercel](https://vercel.com)
2. Klicke auf "Add New..." → "Project"
3. Importiere dieses Repository: `MK87543/dsx-decoder-web`
4. Vercel erkennt automatisch Next.js
5. Klicke auf "Deploy"

### Option 2: Vercel CLI

```bash
# Installiere Vercel CLI global
npm install -g vercel

# Klone das Repository
git clone https://github.com/MK87543/dsx-decoder-web.git
cd dsx-decoder-web

# Installiere Dependencies
npm install

# Deploye zu Vercel
vercel
```

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## API Endpoints

### POST `/api/decode`

Dekodiert einen einzelnen Bestellschlüssel.

**Request Body:**
```json
{
  "code": "DSX2ZS09010L9005BN01000VMESB0"
}
```

**Response:**
```json
{
  "productType": "DSX - Schlitzdurchlass",
  "formatted_code": "DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0",
  "components": [
    {
      "index": "01",
      "name": "Typ",
      "value": "DSX",
      "description": "Schlitzdurchlass DSX"
    },
    ...
  ]
}
```

### POST `/api/compare`

Vergleicht zwei Bestellschlüssel.

**Request Body:**
```json
{
  "code1": "DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0",
  "code2": "DSX2ZS09010L9005BN01000VMESB0"
}
```

**Response (identisch):**
```json
{
  "identical": true,
  "formatted_code": "DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0"
}
```

**Response (unterschiedlich):**
```json
{
  "identical": false,
  "formatted_code1": "DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0",
  "formatted_code2": "DSX-2-Z-S0-9005-L9010-B-N-01000-VM-ES-B0",
  "differences": [
    "Position 12: '1' vs '5'",
    "Position 18: '5' vs '1'"
  ]
}
```

## Technologie-Stack

- **Frontend**: React mit Next.js
- **Backend**: Next.js API Routes (Serverless Functions)
- **Hosting**: Vercel
- **Styling**: CSS-in-JS mit styled-jsx

## Code-Struktur

```
dsx-decoder-web/
├── pages/
│   ├── index.js          # Hauptseite mit UI
│   └── api/
│       ├── decode.js     # API Endpoint für Dekodierung (DSX, ASK, EW)
│       └── compare.js    # API Endpoint für Code-Vergleich
├── package.json          # Dependencies
├── .gitignore
└── README.md
```

## Changelog

### v2.0.0 (2026-01-30)
- ✨ Unterstützung für ASK (Anschlusskasten) - 15 Komponenten
- ✨ Unterstützung für EW (Eckwinkel) - 9 Komponenten
- ✨ Code-Vergleichsfunktion hinzugefügt
- 🐛 Verbesserte Fehlerbehandlung
- 📝 Erweiterte Dokumentation

### v1.0.0 (Initial)
- ✅ DSX (Schlitzdurchlass) Dekodierung - 12 Komponenten
- ✅ Responsive UI
- ✅ Vercel-Deployment ready

## License

MIT

## Credits

Basierend auf der technischen Dokumentation von SCHAKO KG.
