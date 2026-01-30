# DSX Bestellschlüssel Decoder

🛠️ Ein Web-Tool zum Dekodieren von DSX-Bestellschlüsseln für Schlitzdurchlässe.

## Features

- Dekodierung von DSX-Codes mit oder ohne Bindestriche
- Detaillierte Aufschlüsselung aller Komponenten
- Moderne, responsive Benutzeroberfläche
- Sofortige Validierung und Fehlerbehandlung

## Deployment auf Vercel

### Option 1: Deployment über GitHub (Empfohlen)

1. Gehe zu [Vercel](https://vercel.com)
2. Klicke auf "Add New..." → "Project"
3. Importiere dieses Repository
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

## Beispiel-Code

```
DSX-2-Z-S0-9010-L9005-B-N-01000-VM-ES-B0
```

oder ohne Bindestriche:

```
DSX2ZS09010L9005BN01000VMESB0
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
│       └── decode.js     # API Endpoint für Dekodierung
├── package.json          # Dependencies
├── .gitignore
└── README.md
```

## API Endpoint

### POST `/api/decode`

**Request Body:**
```json
{
  "code": "DSX2ZS09010L9005BN01000VMESB0"
}
```

**Response:**
```json
{
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

## License

MIT
