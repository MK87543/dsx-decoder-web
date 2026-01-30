export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const result = decodeBestellschluessel(code);
  return res.status(200).json(result);
}

function decodeBestellschluessel(code) {
  // Remove all hyphens
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

  if (!codeClean.startsWith('DSX')) {
    return { error: "Code muss mit 'DSX' beginnen" };
  }

  const components = [];
  let idx = 0;

  // Position 1: Typ (DSX)
  const typ = codeClean.substring(idx, idx + 3);
  components.push({
    index: '01',
    name: 'Typ',
    value: typ,
    description: 'Schlitzdurchlass DSX'
  });
  idx += 3;

  // Position 2: Ausführung (1 char: 1-4)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const ausfuehrung = codeClean[idx];
  const ausfuehrungDesc = {
    '1': '1-schlitzig',
    '2': '2-schlitzig',
    '3': '3-schlitzig',
    '4': '4-schlitzig'
  }[ausfuehrung] || ausfuehrung;
  components.push({
    index: '02',
    name: 'Ausführung',
    value: ausfuehrung,
    description: ausfuehrungDesc
  });
  idx += 1;

  // Position 3: Luftführung (1 char: Z/A)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const luftfuehrung = codeClean[idx];
  const luftfuehrungDesc = {
    'Z': 'Zuluft',
    'A': 'Abluft (mit Luftführungselementen)'
  }[luftfuehrung] || luftfuehrung;
  components.push({
    index: '03',
    name: 'Luftführung',
    value: luftfuehrung,
    description: luftfuehrungDesc
  });
  idx += 1;

  // Position 4: Rahmenprofil (2-4 chars: S0, P0, PB, or ELOX)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  let rahmenprofil;
  if (codeClean.substring(idx, idx + 4) === 'ELOX') {
    rahmenprofil = 'ELOX';
    idx += 4;
  } else if (['S0', 'P0', 'PB'].includes(codeClean.substring(idx, idx + 2))) {
    rahmenprofil = codeClean.substring(idx, idx + 2);
    idx += 2;
  } else {
    rahmenprofil = codeClean.substring(idx, idx + 2);
    idx += 2;
  }

  const rahmenprofilDesc = {
    'S0': 'Schmales Profil, unsichtbar (Standard)',
    'P0': 'Rahmenprofil P0, sichtbar',
    'PB': 'Rahmenprofil PB, sichtbar',
    'ELOX': 'Aluminium naturfarben eloxiert'
  }[rahmenprofil] || rahmenprofil;
  components.push({
    index: '04',
    name: 'Rahmenprofil',
    value: rahmenprofil,
    description: rahmenprofilDesc
  });

  // Position 5: Rahmenoberfläche (4 chars: 9005, 9010, ELOX, or RAL code)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  let rahmenoberflaeche;
  if (codeClean.substring(idx, idx + 4) === 'ELOX') {
    rahmenoberflaeche = 'ELOX';
    idx += 4;
  } else if (/^\d{4}$/.test(codeClean.substring(idx, idx + 4))) {
    rahmenoberflaeche = codeClean.substring(idx, idx + 4);
    idx += 4;
  } else {
    rahmenoberflaeche = codeClean.substring(idx, idx + 4);
    idx += 4;
  }

  const rahmenoberflaecheDesc = {
    'ELOX': 'Aluminium naturfarben eloxiert',
    '9005': 'RAL 9005 (schwarz)',
    '9010': 'RAL 9010 (weiß)'
  }[rahmenoberflaeche] || `RAL ${rahmenoberflaeche}`;
  components.push({
    index: '05',
    name: 'Rahmenoberfläche',
    value: rahmenoberflaeche,
    description: rahmenoberflaecheDesc
  });

  // Position 6: Lamellenfarbe (5 chars: L9005, L9010)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const lamellenfarbe = codeClean.substring(idx, idx + 5);
  const lamellenfarbeDesc = {
    'L9005': 'RAL 9005 (schwarz, Standard)',
    'L9010': 'RAL 9010 (weiß)'
  }[lamellenfarbe] || lamellenfarbe;
  components.push({
    index: '06',
    name: 'Lamellenfarbe',
    value: lamellenfarbe,
    description: lamellenfarbeDesc
  });
  idx += 5;

  // Position 7: Lamellenstellung (1 char: V, L, R, B)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const lamellenstellung = codeClean[idx];
  const lamellenstellungDesc = {
    'V': 'Vertikal ausblasend',
    'L': 'Horizontal einseitig links',
    'R': 'Horizontal einseitig rechts',
    'B': 'Horizontal beidseitig (Standard)'
  }[lamellenstellung] || lamellenstellung;
  components.push({
    index: '07',
    name: 'Lamellenstellung',
    value: lamellenstellung,
    description: lamellenstellungDesc
  });
  idx += 1;

  // Position 8: Einzel-/Bandausführung (1 char: N, B)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const ausfuehrungTyp = codeClean[idx];
  const ausfuehrungTypDesc = {
    'N': 'Einzelausführung',
    'B': 'Bandausführung'
  }[ausfuehrungTyp] || ausfuehrungTyp;
  components.push({
    index: '08',
    name: 'Einzel-/Bandausführung',
    value: ausfuehrungTyp,
    description: ausfuehrungTypDesc
  });
  idx += 1;

  // Position 9: Länge (5 chars: 01000, 01500, etc.)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const laenge = codeClean.substring(idx, idx + 5);
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '09',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`
  });
  idx += 5;

  // Position 10: Montage (2 chars: 00, VM, KB)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const montage = codeClean.substring(idx, idx + 2);
  const montageDesc = {
    '00': 'Ohne Verbindung',
    'VM': 'Verdeckte Montage (Standard)',
    'KB': 'Klemmbügel'
  }[montage] || montage;
  components.push({
    index: '10',
    name: 'Montage',
    value: montage,
    description: montageDesc
  });
  idx += 2;

  // Position 11: Endstück (2 chars: E0, ES, EB, EL, ER)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const endstueck = codeClean.substring(idx, idx + 2);
  const endstueckDesc = {
    'E0': 'Ohne Endstück',
    'ES': 'Mit Endstück (Paar)',
    'EB': 'Beidseitig angebaut',
    'EL': 'Links angebaut',
    'ER': 'Rechts angebaut'
  }[endstueck] || endstueck;
  components.push({
    index: '11',
    name: 'Endstück',
    value: endstueck,
    description: endstueckDesc
  });
  idx += 2;

  // Position 12: Befestigungswinkel/Blindstück (2 chars: B0, BW, BS)
  if (idx >= codeClean.length) {
    return { error: 'Unvollständiger Code' };
  }

  const befestigung = codeClean.substring(idx, idx + 2);
  const befestigungDesc = {
    'B0': 'Ohne',
    'BW': 'Mit Befestigungswinkel',
    'BS': 'Mit Blindstück'
  }[befestigung] || befestigung;
  components.push({
    index: '12',
    name: 'Befestigungswinkel/Blindstück',
    value: befestigung,
    description: befestigungDesc
  });
  idx += 2;

  // Additional components (if any)
  let compNum = 13;
  while (idx < codeClean.length) {
    const chunkSize = Math.min(5, codeClean.length - idx);
    const additional = codeClean.substring(idx, idx + chunkSize);
    components.push({
      index: String(compNum).padStart(2, '0'),
      name: 'Zusätzlich',
      value: additional,
      description: additional
    });
    idx += chunkSize;
    compNum += 1;
  }

  // Format code with hyphens
  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components
  };
}
