export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

  // Detect product type
  if (codeClean.startsWith('DSX')) {
    const result = decodeDSX(code);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json({ ...result, productType: 'DSX - Schlitzdurchlass' });
  } else if (codeClean.startsWith('ASK')) {
    const result = decodeASK(code);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json({ ...result, productType: 'ASK - Anschlusskasten' });
  } else if (codeClean.startsWith('EW')) {
    const result = decodeEW(code);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.status(200).json({ ...result, productType: 'EW - Eckwinkel' });
  } else {
    return res.status(400).json({ error: 'Unbekannter Produkttyp. Unterstützt: DSX, ASK, EW' });
  }
}

function decodeDSX(code) {
  let codeClean = code.replace(/-/g, '').trim().toUpperCase();

  if (!codeClean.startsWith('DSX')) {
    return { error: "Code muss mit 'DSX' beginnen" };
  }

  // Standard-Werte für DSX
  const defaults = {
    ausfuehrung: '2',
    luftfuehrung: 'Z',
    rahmenprofil: 'S0',
    rahmenoberflaeche: '9005',
    lamellenfarbe: 'L9005',
    lamellenstellung: 'B',
    ausfuehrungTyp: 'N',
    laenge: '01000',
    montage: 'VM',
    endstueck: 'E0',
    befestigung: 'B0'
  };

  const components = [];
  let idx = 0;
  let hasStandardValues = false;

  // Helper function to check if we need to insert standard value
  const peek = (start, expectedPatterns) => {
    const remaining = codeClean.substring(start);
    for (const pattern of expectedPatterns) {
      if (pattern.test) {
        // RegEx pattern
        if (pattern.test(remaining)) return true;
      } else if (typeof pattern === 'number') {
        // Length check
        if (remaining.length >= pattern) return true;
      } else if (Array.isArray(pattern)) {
        // Array of valid values
        for (const val of pattern) {
          if (remaining.startsWith(val)) return true;
        }
      }
    }
    return false;
  };

  // Position 1: Typ (DSX)
  const typ = codeClean.substring(idx, idx + 3);
  components.push({
    index: '01',
    name: 'Typ',
    value: typ,
    description: 'Schlitzdurchlass DSX',
    isStandard: false
  });
  idx += 3;

  // Position 2: Ausführung (1 char: 1-4)
  let ausfuehrung = defaults.ausfuehrung;
  let isAusfuehrungStandard = false;
  if (idx < codeClean.length && /^[1-4]/.test(codeClean[idx])) {
    ausfuehrung = codeClean[idx];
    idx += 1;
  } else if (idx >= codeClean.length) {
    isAusfuehrungStandard = true;
    hasStandardValues = true;
  } else {
    // Might be missing, insert standard
    isAusfuehrungStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '02',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung,
    isStandard: isAusfuehrungStandard
  });

  // Position 3: Luftführung (1 char: Z or A)
  let luftfuehrung = defaults.luftfuehrung;
  let isLuftfuehrungStandard = false;
  if (idx < codeClean.length && /^[ZA]/.test(codeClean[idx])) {
    luftfuehrung = codeClean[idx];
    idx += 1;
  } else if (idx >= codeClean.length) {
    isLuftfuehrungStandard = true;
    hasStandardValues = true;
  } else {
    isLuftfuehrungStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '03',
    name: 'Luftführung',
    value: luftfuehrung,
    description: { 'Z': 'Zuluft', 'A': 'Abluft (mit Luftführungselementen)' }[luftfuehrung] || luftfuehrung,
    isStandard: isLuftfuehrungStandard
  });

  // Position 4: Rahmenprofil (2-4 chars: S0, P0, PB, ELOX)
  let rahmenprofil = defaults.rahmenprofil;
  let isRahmenprofilStandard = false;
  if (idx < codeClean.length) {
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      rahmenprofil = 'ELOX';
      idx += 4;
    } else if (['S0', 'P0', 'PB'].some(p => codeClean.substring(idx, idx + 2) === p)) {
      rahmenprofil = codeClean.substring(idx, idx + 2);
      idx += 2;
    } else {
      // Doesn't match expected pattern, use standard
      isRahmenprofilStandard = true;
      hasStandardValues = true;
    }
  } else {
    isRahmenprofilStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '04',
    name: 'Rahmenprofil',
    value: rahmenprofil,
    description: {
      'S0': 'Schmales Profil, unsichtbar (Standard)',
      'P0': 'Rahmenprofil P0, sichtbar',
      'PB': 'Rahmenprofil PB, sichtbar',
      'ELOX': 'Aluminium naturfarben eloxiert'
    }[rahmenprofil] || rahmenprofil,
    isStandard: isRahmenprofilStandard
  });

  // Position 5: Rahmenoberfläche (4 chars: ELOX or RAL number like 9005, 9010)
  let rahmenoberflaeche = defaults.rahmenoberflaeche;
  let isRahmenoberflaecheStandard = false;
  if (idx < codeClean.length) {
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      rahmenoberflaeche = 'ELOX';
      idx += 4;
    } else if (idx + 4 <= codeClean.length && /^\d{4}$/.test(codeClean.substring(idx, idx + 4))) {
      rahmenoberflaeche = codeClean.substring(idx, idx + 4);
      idx += 4;
    } else {
      // Doesn't match, use standard
      isRahmenoberflaecheStandard = true;
      hasStandardValues = true;
    }
  } else {
    isRahmenoberflaecheStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '05',
    name: 'Rahmenoberfläche',
    value: rahmenoberflaeche,
    description: {
      'ELOX': 'Aluminium naturfarben eloxiert',
      '9005': 'RAL 9005 (schwarz, Standard)',
      '9010': 'RAL 9010 (weiß)'
    }[rahmenoberflaeche] || `RAL ${rahmenoberflaeche}`,
    isStandard: isRahmenoberflaecheStandard
  });

  // Position 6: Lamellenfarbe (5 chars: L9005, L9010, or L + 4 digit RAL)
  let lamellenfarbe = defaults.lamellenfarbe;
  let isLamellenfarbeStandard = false;
  if (idx < codeClean.length) {
    // Check if next char is 'L' followed by 4 digits
    if (codeClean[idx] === 'L' && idx + 5 <= codeClean.length && /^\d{4}$/.test(codeClean.substring(idx + 1, idx + 5))) {
      lamellenfarbe = codeClean.substring(idx, idx + 5);
      idx += 5;
    } else {
      // Doesn't match expected pattern, use standard
      isLamellenfarbeStandard = true;
      hasStandardValues = true;
    }
  } else {
    isLamellenfarbeStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '06',
    name: 'Lamellenfarbe',
    value: lamellenfarbe,
    description: {
      'L9005': 'RAL 9005 (schwarz, Standard)',
      'L9010': 'RAL 9010 (weiß)'
    }[lamellenfarbe] || lamellenfarbe,
    isStandard: isLamellenfarbeStandard
  });

  // Position 7: Lamellenstellung (1 char: V, L, R, B)
  let lamellenstellung = defaults.lamellenstellung;
  let isLamellenstellungStandard = false;
  if (idx < codeClean.length && /^[VLRB]/.test(codeClean[idx])) {
    lamellenstellung = codeClean[idx];
    idx += 1;
  } else if (idx >= codeClean.length) {
    isLamellenstellungStandard = true;
    hasStandardValues = true;
  } else {
    isLamellenstellungStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '07',
    name: 'Lamellenstellung',
    value: lamellenstellung,
    description: {
      'V': 'Vertikal ausblasend',
      'L': 'Horizontal einseitig links',
      'R': 'Horizontal einseitig rechts',
      'B': 'Horizontal beidseitig (Standard)'
    }[lamellenstellung] || lamellenstellung,
    isStandard: isLamellenstellungStandard
  });

  // Position 8: Einzel-/Bandausführung (1 char: N or B)
  let ausfuehrungTyp = defaults.ausfuehrungTyp;
  let isAusfuehrungTypStandard = false;
  if (idx < codeClean.length && /^[NB]/.test(codeClean[idx])) {
    ausfuehrungTyp = codeClean[idx];
    idx += 1;
  } else if (idx >= codeClean.length) {
    isAusfuehrungTypStandard = true;
    hasStandardValues = true;
  } else {
    isAusfuehrungTypStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '08',
    name: 'Einzel-/Bandausführung',
    value: ausfuehrungTyp,
    description: { 'N': 'Einzelausführung (Standard)', 'B': 'Bandausführung' }[ausfuehrungTyp] || ausfuehrungTyp,
    isStandard: isAusfuehrungTypStandard
  });

  // Position 9: Länge (5 digits)
  let laenge = defaults.laenge;
  let isLaengeStandard = false;
  if (idx < codeClean.length && idx + 5 <= codeClean.length && /^\d{5}$/.test(codeClean.substring(idx, idx + 5))) {
    laenge = codeClean.substring(idx, idx + 5);
    idx += 5;
  } else if (idx >= codeClean.length) {
    isLaengeStandard = true;
    hasStandardValues = true;
  } else {
    isLaengeStandard = true;
    hasStandardValues = true;
  }
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '09',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`,
    isStandard: isLaengeStandard
  });

  // Position 10: Montage (2 chars: 00, VM, KB)
  let montage = defaults.montage;
  let isMontageStandard = false;
  if (idx < codeClean.length) {
    const montageCheck = codeClean.substring(idx, idx + 2);
    if (['00', 'VM', 'KB'].includes(montageCheck)) {
      montage = montageCheck;
      idx += 2;
    } else {
      isMontageStandard = true;
      hasStandardValues = true;
    }
  } else {
    isMontageStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '10',
    name: 'Montage',
    value: montage,
    description: {
      '00': 'Ohne Verbindung',
      'VM': 'Verdeckte Montage (Standard)',
      'KB': 'Klemmbügel'
    }[montage] || montage,
    isStandard: isMontageStandard
  });

  // Position 11: Endstück (2 chars: E0, ES, EB, EL, ER)
  let endstueck = defaults.endstueck;
  let isEndstueckStandard = false;
  if (idx < codeClean.length) {
    const endstueckCheck = codeClean.substring(idx, idx + 2);
    if (['E0', 'ES', 'EB', 'EL', 'ER'].includes(endstueckCheck)) {
      endstueck = endstueckCheck;
      idx += 2;
    } else {
      isEndstueckStandard = true;
      hasStandardValues = true;
    }
  } else {
    isEndstueckStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '11',
    name: 'Endstück',
    value: endstueck,
    description: {
      'E0': 'Ohne Endstück (Standard)',
      'ES': 'Mit Endstück (Paar)',
      'EB': 'Beidseitig angebaut',
      'EL': 'Links angebaut',
      'ER': 'Rechts angebaut'
    }[endstueck] || endstueck,
    isStandard: isEndstueckStandard
  });

  // Position 12: Befestigungswinkel/Blindstück (2 chars: B0, BW, BS)
  let befestigung = defaults.befestigung;
  let isBefestigungStandard = false;
  if (idx < codeClean.length) {
    const befestigungCheck = codeClean.substring(idx, idx + 2);
    if (['B0', 'BW', 'BS'].includes(befestigungCheck)) {
      befestigung = befestigungCheck;
      idx += 2;
    } else {
      isBefestigungStandard = true;
      hasStandardValues = true;
    }
  } else {
    isBefestigungStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '12',
    name: 'Befestigungswinkel/Blindstück',
    value: befestigung,
    description: {
      'B0': 'Ohne (Standard)',
      'BW': 'Mit Befestigungswinkel',
      'BS': 'Mit Blindstück'
    }[befestigung] || befestigung,
    isStandard: isBefestigungStandard
  });

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components,
    hasStandardValues: hasStandardValues
  };
}

function decodeASK(code) {
  let codeClean = code.replace(/-/g, '').trim().toUpperCase();

  if (!codeClean.startsWith('ASK')) {
    return { error: "Code muss mit 'ASK' beginnen" };
  }

  // Standard-Werte für ASK
  const defaults = {
    durchlass: '21',
    ausfuehrung: '2',
    einzelBand: 'N',
    laenge: '01000',
    kastenmontage: 'VM',
    material: 'SV',
    drosselklappe: 'DK0',
    gummilippendichtung: 'GD0',
    isolierung: 'I0',
    kastenhoehe: 'KHS',
    kastenhals: 'KVS',
    stutzenlage: 'S1',
    stutzendurchmesser: 'SDS',
    abhaengung: 'E0'
  };

  const components = [];
  let idx = 0;
  let hasStandardValues = false;

  // Position 1: Typ (ASK)
  const typ = codeClean.substring(idx, idx + 3);
  components.push({
    index: '01',
    name: 'Typ',
    value: typ,
    description: 'Anschlusskasten für Schlitzdurchlass',
    isStandard: false
  });
  idx += 3;

  // Position 2: Durchlass (2 digits)
  let durchlass = defaults.durchlass;
  let isDurchlassStandard = false;
  if (idx < codeClean.length && idx + 2 <= codeClean.length && /^\d{2}$/.test(codeClean.substring(idx, idx + 2))) {
    durchlass = codeClean.substring(idx, idx + 2);
    idx += 2;
  } else if (idx >= codeClean.length) {
    isDurchlassStandard = true;
    hasStandardValues = true;
  } else {
    isDurchlassStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '02',
    name: 'Durchlass',
    value: durchlass,
    description: durchlass === '21' ? 'für DSX (Standard)' : durchlass,
    isStandard: isDurchlassStandard
  });

  // Position 3: Ausführung (1 char: 1-4)
  let ausfuehrung = defaults.ausfuehrung;
  let isAusfuehrungStandard = false;
  if (idx < codeClean.length && /^[1-4]/.test(codeClean[idx])) {
    ausfuehrung = codeClean[idx];
    idx += 1;
  } else if (idx >= codeClean.length) {
    isAusfuehrungStandard = true;
    hasStandardValues = true;
  } else {
    isAusfuehrungStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '03',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung,
    isStandard: isAusfuehrungStandard
  });

  // Position 4: Einzel-/Bandausführung (1 char: N or B)
  let einzelBand = defaults.einzelBand;
  let isEinzelBandStandard = false;
  if (idx < codeClean.length && /^[NB]/.test(codeClean[idx])) {
    einzelBand = codeClean[idx];
    idx += 1;
  } else if (idx >= codeClean.length) {
    isEinzelBandStandard = true;
    hasStandardValues = true;
  } else {
    isEinzelBandStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '04',
    name: 'Einzel-/Bandausführung',
    value: einzelBand,
    description: { 'N': 'Einzelausführung (Standard)', 'B': 'Bandausführung' }[einzelBand] || einzelBand,
    isStandard: isEinzelBandStandard
  });

  // Continue with similar pattern for remaining positions...
  // For brevity, I'll add the rest with the same validation pattern

  // Position 5: Länge (5 digits)
  let laenge = defaults.laenge;
  let isLaengeStandard = false;
  if (idx < codeClean.length && idx + 5 <= codeClean.length && /^\d{5}$/.test(codeClean.substring(idx, idx + 5))) {
    laenge = codeClean.substring(idx, idx + 5);
    idx += 5;
  } else {
    isLaengeStandard = true;
    hasStandardValues = true;
  }
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '05',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`,
    isStandard: isLaengeStandard
  });

  // Positions 6-15: Similar validation pattern
  const remaining = [
    { name: 'Kastenmontage', len: 2, def: 'kastenmontage', valid: ['00', 'VM'], desc: { '00': 'Ohne Verbindung', 'VM': 'Verdeckte Montage (Standard)' } },
    { name: 'Material', len: 2, def: 'material', valid: ['SV'], desc: { 'SV': 'Stahlblech verzinkt (Standard)' } },
    { name: 'Drosselklappe', len: 3, def: 'drosselklappe', valid: ['DK0', 'DK2'], desc: { 'DK0': 'Ohne Drosselklappe (Standard)', 'DK2': 'Mit Drosselklappe und Seilzugverstellung' } },
    { name: 'Gummilippendichtung', len: 3, def: 'gummilippendichtung', valid: ['GD0', 'GD1'], desc: { 'GD0': 'Ohne Gummilippendichtung (Standard)', 'GD1': 'Mit Gummilippendichtung' } },
    { name: 'Isolierung', len: 2, def: 'isolierung', valid: ['I0', 'Ii', 'Ia'], desc: { 'I0': 'Ohne Isolierung (Standard)', 'Ii': 'Mit Isolierung innen', 'Ia': 'Mit Isolierung außen' } },
    { name: 'Kastenhöhe', len: 3, def: 'kastenhoehe', valid: ['KHS'], desc: { 'KHS': 'Kastenhöhe Standard' } },
    { name: 'Kastenhals', len: 3, def: 'kastenhals', valid: ['KVS'], desc: { 'KVS': 'Kastenhals Standard (45 mm)' } },
    { name: 'Stutzenlage', len: 2, def: 'stutzenlage', valid: ['S0', 'S1', 'S2'], desc: { 'S0': 'Stutzen von oben', 'S1': 'Stutzen seitlich (Standard)', 'S2': 'Stutzen seitlich gegenüberliegend' } },
    { name: 'Stutzendurchmesser', len: 3, def: 'stutzendurchmesser', valid: ['SDS'], desc: { 'SDS': 'Stutzendurchmesser Standard' } },
    { name: 'Abhängung', len: 2, def: 'abhaengung', valid: ['E0', 'EM'], desc: { 'E0': 'Ohne Einnietmutter (Standard)', 'EM': 'Mit Einnietmutter' } }
  ];

  let compIdx = 6;
  for (const spec of remaining) {
    let value = defaults[spec.def];
    let isStandard = false;
    
    if (idx < codeClean.length) {
      const check = codeClean.substring(idx, idx + spec.len);
      if (spec.valid.includes(check)) {
        value = check;
        idx += spec.len;
      } else {
        isStandard = true;
        hasStandardValues = true;
      }
    } else {
      isStandard = true;
      hasStandardValues = true;
    }

    components.push({
      index: compIdx.toString().padStart(2, '0'),
      name: spec.name,
      value: value,
      description: spec.desc[value] || value,
      isStandard: isStandard
    });
    compIdx++;
  }

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components,
    hasStandardValues: hasStandardValues
  };
}

function decodeEW(code) {
  let codeClean = code.replace(/-/g, '').trim().toUpperCase();

  if (!codeClean.startsWith('EW')) {
    return { error: "Code muss mit 'EW' beginnen" };
  }

  // Standard-Werte für EW
  const defaults = {
    durchlass: '21',
    ausfuehrung: '2',
    rahmenprofil: 'S0',
    rahmenoberflaeche: 'ELOX',
    blindprofil: 'B9005',
    winkel: '090',
    schenkelLinks: '000',
    schenkelRechts: '000'
  };

  const components = [];
  let idx = 0;
  let hasStandardValues = false;

  // Position 1: Typ (EW)
  const typ = codeClean.substring(idx, idx + 2);
  components.push({
    index: '01',
    name: 'Typ',
    value: typ,
    description: 'Eckwinkel für Schlitzdurchlass',
    isStandard: false
  });
  idx += 2;

  // Position 2: Durchlass (2 digits)
  let durchlass = defaults.durchlass;
  let isDurchlassStandard = false;
  if (idx < codeClean.length && idx + 2 <= codeClean.length && /^\d{2}$/.test(codeClean.substring(idx, idx + 2))) {
    durchlass = codeClean.substring(idx, idx + 2);
    idx += 2;
  } else {
    isDurchlassStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '02',
    name: 'Durchlass',
    value: durchlass,
    description: durchlass === '21' ? 'für DSX (Standard)' : durchlass,
    isStandard: isDurchlassStandard
  });

  // Position 3: Ausführung (1 char: 1-4)
  let ausfuehrung = defaults.ausfuehrung;
  let isAusfuehrungStandard = false;
  if (idx < codeClean.length && /^[1-4]/.test(codeClean[idx])) {
    ausfuehrung = codeClean[idx];
    idx += 1;
  } else {
    isAusfuehrungStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '03',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung,
    isStandard: isAusfuehrungStandard
  });

  // Position 4: Rahmenprofil (2 or 4 chars)
  let rahmenprofil = defaults.rahmenprofil;
  let isRahmenprofilStandard = false;
  if (idx < codeClean.length) {
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      rahmenprofil = 'ELOX';
      idx += 4;
    } else if (['S0', 'P0', 'PB'].some(p => codeClean.substring(idx, idx + 2) === p)) {
      rahmenprofil = codeClean.substring(idx, idx + 2);
      idx += 2;
    } else {
      isRahmenprofilStandard = true;
      hasStandardValues = true;
    }
  } else {
    isRahmenprofilStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '04',
    name: 'Rahmenprofil',
    value: rahmenprofil,
    description: {
      'S0': 'Schmales Rahmenprofil (Standard)',
      'P0': 'Rahmenprofil P0',
      'PB': 'Rahmenprofil PB',
      'ELOX': 'Aluminium naturfarben eloxiert'
    }[rahmenprofil] || rahmenprofil,
    isStandard: isRahmenprofilStandard
  });

  // Position 5: Rahmenoberfläche (4 chars)
  let rahmenoberflaeche = defaults.rahmenoberflaeche;
  let isRahmenoberflaecheStandard = false;
  if (idx < codeClean.length) {
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      rahmenoberflaeche = 'ELOX';
      idx += 4;
    } else if (idx + 4 <= codeClean.length && /^\d{4}$/.test(codeClean.substring(idx, idx + 4))) {
      rahmenoberflaeche = codeClean.substring(idx, idx + 4);
      idx += 4;
    } else {
      isRahmenoberflaecheStandard = true;
      hasStandardValues = true;
    }
  } else {
    isRahmenoberflaecheStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '05',
    name: 'Rahmenoberfläche',
    value: rahmenoberflaeche,
    description: {
      'ELOX': 'Aluminium naturfarben eloxiert (Standard)',
      '9005': 'RAL 9005 (schwarz)',
      '9010': 'RAL 9010 (weiß)'
    }[rahmenoberflaeche] || `RAL ${rahmenoberflaeche}`,
    isStandard: isRahmenoberflaecheStandard
  });

  // Position 6: Blindprofil (5 chars: B + 4 digit RAL)
  let blindprofil = defaults.blindprofil;
  let isBlindprofilStandard = false;
  if (idx < codeClean.length) {
    if (codeClean[idx] === 'B' && idx + 5 <= codeClean.length && /^\d{4}$/.test(codeClean.substring(idx + 1, idx + 5))) {
      blindprofil = codeClean.substring(idx, idx + 5);
      idx += 5;
    } else {
      isBlindprofilStandard = true;
      hasStandardValues = true;
    }
  } else {
    isBlindprofilStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '06',
    name: 'Farbe Blindprofil/Luftführungselemente',
    value: blindprofil,
    description: {
      'B9005': 'RAL 9005 schwarz (Standard)',
      'B9010': 'RAL 9010 weiß'
    }[blindprofil] || `RAL ${blindprofil.substring(1)}`,
    isStandard: isBlindprofilStandard
  });

  // Position 7: Winkel (3 digits)
  let winkel = defaults.winkel;
  let isWinkelStandard = false;
  if (idx < codeClean.length && idx + 3 <= codeClean.length && /^\d{3}$/.test(codeClean.substring(idx, idx + 3))) {
    winkel = codeClean.substring(idx, idx + 3);
    idx += 3;
  } else {
    isWinkelStandard = true;
    hasStandardValues = true;
  }
  const winkelGrad = parseInt(winkel) || 90;
  components.push({
    index: '07',
    name: 'Winkel zwischen den Schenkeln',
    value: winkel,
    description: `${winkelGrad}°${winkel === '090' ? ' (Standard)' : ''}`,
    isStandard: isWinkelStandard
  });

  // Position 8: Schenkel links (3 digits)
  let schenkelLinks = defaults.schenkelLinks;
  let isSchenkelLinksStandard = false;
  if (idx < codeClean.length && idx + 3 <= codeClean.length && /^\d{3}$/.test(codeClean.substring(idx, idx + 3))) {
    schenkelLinks = codeClean.substring(idx, idx + 3);
    idx += 3;
  } else {
    isSchenkelLinksStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '08',
    name: 'Schenkellaenge links (a)',
    value: schenkelLinks,
    description: schenkelLinks === '000' ? 'Standardlänge 250 mm' : `${parseInt(schenkelLinks)} mm`,
    isStandard: isSchenkelLinksStandard
  });

  // Position 9: Schenkel rechts (3 digits)
  let schenkelRechts = defaults.schenkelRechts;
  let isSchenkelRechtsStandard = false;
  if (idx < codeClean.length && idx + 3 <= codeClean.length && /^\d{3}$/.test(codeClean.substring(idx, idx + 3))) {
    schenkelRechts = codeClean.substring(idx, idx + 3);
    idx += 3;
  } else {
    isSchenkelRechtsStandard = true;
    hasStandardValues = true;
  }
  components.push({
    index: '09',
    name: 'Schenkellaenge rechts (b)',
    value: schenkelRechts,
    description: schenkelRechts === '000' ? 'Standardlänge 250 mm' : `${parseInt(schenkelRechts)} mm`,
    isStandard: isSchenkelRechtsStandard
  });

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components,
    hasStandardValues: hasStandardValues
  };
}
