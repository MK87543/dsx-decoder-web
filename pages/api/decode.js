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
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

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

  // Position 2: Ausführung
  let ausfuehrung;
  if (idx >= codeClean.length) {
    ausfuehrung = defaults.ausfuehrung;
    hasStandardValues = true;
  } else {
    ausfuehrung = codeClean[idx];
    idx += 1;
  }
  const isAusfuehrungStandard = !codeClean[3];
  components.push({
    index: '02',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung,
    isStandard: isAusfuehrungStandard
  });

  // Position 3: Luftführung
  let luftfuehrung;
  if (idx >= codeClean.length) {
    luftfuehrung = defaults.luftfuehrung;
    hasStandardValues = true;
  } else {
    luftfuehrung = codeClean[idx];
    idx += 1;
  }
  const isLuftfuehrungStandard = !codeClean[4];
  components.push({
    index: '03',
    name: 'Luftführung',
    value: luftfuehrung,
    description: { 'Z': 'Zuluft', 'A': 'Abluft (mit Luftführungselementen)' }[luftfuehrung] || luftfuehrung,
    isStandard: isLuftfuehrungStandard
  });

  // Position 4: Rahmenprofil
  let rahmenprofil;
  let isRahmenprofilStandard = false;
  if (idx >= codeClean.length) {
    rahmenprofil = defaults.rahmenprofil;
    hasStandardValues = true;
    isRahmenprofilStandard = true;
  } else if (codeClean.substring(idx, idx + 4) === 'ELOX') {
    rahmenprofil = 'ELOX';
    idx += 4;
  } else if (['S0', 'P0', 'PB'].includes(codeClean.substring(idx, idx + 2))) {
    rahmenprofil = codeClean.substring(idx, idx + 2);
    idx += 2;
  } else {
    rahmenprofil = codeClean.substring(idx, idx + 2);
    idx += 2;
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

  // Position 5: Rahmenoberfläche
  let rahmenoberflaeche;
  let isRahmenoberflaecheStandard = false;
  if (idx >= codeClean.length) {
    rahmenoberflaeche = defaults.rahmenoberflaeche;
    hasStandardValues = true;
    isRahmenoberflaecheStandard = true;
  } else if (codeClean.substring(idx, idx + 4) === 'ELOX') {
    rahmenoberflaeche = 'ELOX';
    idx += 4;
  } else {
    rahmenoberflaeche = codeClean.substring(idx, idx + 4);
    idx += 4;
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

  // Position 6: Lamellenfarbe
  let lamellenfarbe;
  let isLamellenfarbeStandard = false;
  if (idx >= codeClean.length) {
    lamellenfarbe = defaults.lamellenfarbe;
    hasStandardValues = true;
    isLamellenfarbeStandard = true;
  } else {
    lamellenfarbe = codeClean.substring(idx, idx + 5);
    idx += 5;
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

  // Position 7: Lamellenstellung
  let lamellenstellung;
  let isLamellenstellungStandard = false;
  if (idx >= codeClean.length) {
    lamellenstellung = defaults.lamellenstellung;
    hasStandardValues = true;
    isLamellenstellungStandard = true;
  } else {
    lamellenstellung = codeClean[idx];
    idx += 1;
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

  // Position 8: Einzel-/Bandausführung
  let ausfuehrungTyp;
  let isAusfuehrungTypStandard = false;
  if (idx >= codeClean.length) {
    ausfuehrungTyp = defaults.ausfuehrungTyp;
    hasStandardValues = true;
    isAusfuehrungTypStandard = true;
  } else {
    ausfuehrungTyp = codeClean[idx];
    idx += 1;
  }
  components.push({
    index: '08',
    name: 'Einzel-/Bandausführung',
    value: ausfuehrungTyp,
    description: { 'N': 'Einzelausführung (Standard)', 'B': 'Bandausführung' }[ausfuehrungTyp] || ausfuehrungTyp,
    isStandard: isAusfuehrungTypStandard
  });

  // Position 9: Länge
  let laenge;
  let isLaengeStandard = false;
  if (idx >= codeClean.length) {
    laenge = defaults.laenge;
    hasStandardValues = true;
    isLaengeStandard = true;
  } else {
    laenge = codeClean.substring(idx, idx + 5);
    idx += 5;
  }
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '09',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`,
    isStandard: isLaengeStandard
  });

  // Position 10: Montage
  let montage;
  let isMontageStandard = false;
  if (idx >= codeClean.length) {
    montage = defaults.montage;
    hasStandardValues = true;
    isMontageStandard = true;
  } else {
    montage = codeClean.substring(idx, idx + 2);
    idx += 2;
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

  // Position 11: Endstück
  let endstueck;
  let isEndstueckStandard = false;
  if (idx >= codeClean.length) {
    endstueck = defaults.endstueck;
    hasStandardValues = true;
    isEndstueckStandard = true;
  } else {
    endstueck = codeClean.substring(idx, idx + 2);
    idx += 2;
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

  // Position 12: Befestigungswinkel/Blindstück
  let befestigung;
  let isBefestigungStandard = false;
  if (idx >= codeClean.length) {
    befestigung = defaults.befestigung;
    hasStandardValues = true;
    isBefestigungStandard = true;
  } else {
    befestigung = codeClean.substring(idx, idx + 2);
    idx += 2;
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
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

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

  // Position 2: Durchlass (21)
  let durchlass;
  let isDurchlassStandard = false;
  if (idx >= codeClean.length) {
    durchlass = defaults.durchlass;
    hasStandardValues = true;
    isDurchlassStandard = true;
  } else {
    durchlass = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '02',
    name: 'Durchlass',
    value: durchlass,
    description: durchlass === '21' ? 'für DSX (Standard)' : durchlass,
    isStandard: isDurchlassStandard
  });

  // Position 3: Ausführung
  let ausfuehrung;
  let isAusfuehrungStandard = false;
  if (idx >= codeClean.length) {
    ausfuehrung = defaults.ausfuehrung;
    hasStandardValues = true;
    isAusfuehrungStandard = true;
  } else {
    ausfuehrung = codeClean[idx];
    idx += 1;
  }
  components.push({
    index: '03',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung,
    isStandard: isAusfuehrungStandard
  });

  // Position 4: Einzel-/Bandausführung
  let einzelBand;
  let isEinzelBandStandard = false;
  if (idx >= codeClean.length) {
    einzelBand = defaults.einzelBand;
    hasStandardValues = true;
    isEinzelBandStandard = true;
  } else {
    einzelBand = codeClean[idx];
    idx += 1;
  }
  components.push({
    index: '04',
    name: 'Einzel-/Bandausführung',
    value: einzelBand,
    description: { 'N': 'Einzelausführung (Standard)', 'B': 'Bandausführung' }[einzelBand] || einzelBand,
    isStandard: isEinzelBandStandard
  });

  // Position 5: Länge (5 digits)
  let laenge;
  let isLaengeStandard = false;
  if (idx >= codeClean.length) {
    laenge = defaults.laenge;
    hasStandardValues = true;
    isLaengeStandard = true;
  } else {
    laenge = codeClean.substring(idx, idx + 5);
    idx += 5;
  }
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '05',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`,
    isStandard: isLaengeStandard
  });

  // Position 6: Kastenmontage (2 chars)
  let kastenmontage;
  let isKastenmontageStandard = false;
  if (idx >= codeClean.length) {
    kastenmontage = defaults.kastenmontage;
    hasStandardValues = true;
    isKastenmontageStandard = true;
  } else {
    kastenmontage = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '06',
    name: 'Kastenmontage',
    value: kastenmontage,
    description: {
      '00': 'Ohne Verbindung',
      'VM': 'Verdeckte Montage (Standard)'
    }[kastenmontage] || kastenmontage,
    isStandard: isKastenmontageStandard
  });

  // Position 7: Material (2 chars)
  let material;
  let isMaterialStandard = false;
  if (idx >= codeClean.length) {
    material = defaults.material;
    hasStandardValues = true;
    isMaterialStandard = true;
  } else {
    material = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '07',
    name: 'Material',
    value: material,
    description: material === 'SV' ? 'Stahlblech verzinkt (Standard)' : material,
    isStandard: isMaterialStandard
  });

  // Position 8: Drosselklappe (3 chars)
  let drosselklappe;
  let isDrosselklappeStandard = false;
  if (idx >= codeClean.length) {
    drosselklappe = defaults.drosselklappe;
    hasStandardValues = true;
    isDrosselklappeStandard = true;
  } else {
    drosselklappe = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  components.push({
    index: '08',
    name: 'Drosselklappe',
    value: drosselklappe,
    description: {
      'DK0': 'Ohne Drosselklappe (Standard)',
      'DK2': 'Mit Drosselklappe und Seilzugverstellung'
    }[drosselklappe] || drosselklappe,
    isStandard: isDrosselklappeStandard
  });

  // Position 9: Gummilippendichtung (3 chars)
  let gummilippendichtung;
  let isGummilippendichtungStandard = false;
  if (idx >= codeClean.length) {
    gummilippendichtung = defaults.gummilippendichtung;
    hasStandardValues = true;
    isGummilippendichtungStandard = true;
  } else {
    gummilippendichtung = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  components.push({
    index: '09',
    name: 'Gummilippendichtung',
    value: gummilippendichtung,
    description: {
      'GD0': 'Ohne Gummilippendichtung (Standard)',
      'GD1': 'Mit Gummilippendichtung'
    }[gummilippendichtung] || gummilippendichtung,
    isStandard: isGummilippendichtungStandard
  });

  // Position 10: Isolierung (2 chars)
  let isolierung;
  let isIsolierungStandard = false;
  if (idx >= codeClean.length) {
    isolierung = defaults.isolierung;
    hasStandardValues = true;
    isIsolierungStandard = true;
  } else {
    isolierung = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '10',
    name: 'Isolierung',
    value: isolierung,
    description: {
      'I0': 'Ohne Isolierung (Standard)',
      'Ii': 'Mit Isolierung innen',
      'Ia': 'Mit Isolierung außen'
    }[isolierung] || isolierung,
    isStandard: isIsolierungStandard
  });

  // Position 11: Kastenhöhe (3 chars)
  let kastenhoehe;
  let isKastenhoeheStandard = false;
  if (idx >= codeClean.length) {
    kastenhoehe = defaults.kastenhoehe;
    hasStandardValues = true;
    isKastenhoeheStandard = true;
  } else {
    kastenhoehe = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  components.push({
    index: '11',
    name: 'Kastenhöhe',
    value: kastenhoehe,
    description: kastenhoehe === 'KHS' ? 'Kastenhöhe Standard' : `${kastenhoehe} mm`,
    isStandard: isKastenhoeheStandard
  });

  // Position 12: Kastenhals (3 chars)
  let kastenhals;
  let isKastenhalsStandard = false;
  if (idx >= codeClean.length) {
    kastenhals = defaults.kastenhals;
    hasStandardValues = true;
    isKastenhalsStandard = true;
  } else {
    kastenhals = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  components.push({
    index: '12',
    name: 'Kastenhals',
    value: kastenhals,
    description: kastenhals === 'KVS' ? 'Kastenhals Standard (45 mm)' : `Kastenhalsverlängerung ${kastenhals} mm`,
    isStandard: isKastenhalsStandard
  });

  // Position 13: Stutzenlage (2 chars)
  let stutzenlage;
  let isStutzenlageStandard = false;
  if (idx >= codeClean.length) {
    stutzenlage = defaults.stutzenlage;
    hasStandardValues = true;
    isStutzenlageStandard = true;
  } else {
    stutzenlage = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '13',
    name: 'Stutzenlage',
    value: stutzenlage,
    description: {
      'S0': 'Stutzen von oben',
      'S1': 'Stutzen seitlich (Standard)',
      'S2': 'Stutzen seitlich gegenüberliegend'
    }[stutzenlage] || stutzenlage,
    isStandard: isStutzenlageStandard
  });

  // Position 14: Stutzendurchmesser (3 chars)
  let stutzendurchmesser;
  let isStutzendurchmesserStandard = false;
  if (idx >= codeClean.length) {
    stutzendurchmesser = defaults.stutzendurchmesser;
    hasStandardValues = true;
    isStutzendurchmesserStandard = true;
  } else {
    stutzendurchmesser = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  components.push({
    index: '14',
    name: 'Stutzendurchmesser',
    value: stutzendurchmesser,
    description: stutzendurchmesser === 'SDS' ? 'Stutzendurchmesser Standard' : `${stutzendurchmesser} mm`,
    isStandard: isStutzendurchmesserStandard
  });

  // Position 15: Abhängung (2 chars)
  let abhaengung;
  let isAbhaengungStandard = false;
  if (idx >= codeClean.length) {
    abhaengung = defaults.abhaengung;
    hasStandardValues = true;
    isAbhaengungStandard = true;
  } else {
    abhaengung = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '15',
    name: 'Abhängung',
    value: abhaengung,
    description: {
      'E0': 'Ohne Einnietmutter (Standard)',
      'EM': 'Mit Einnietmutter'
    }[abhaengung] || abhaengung,
    isStandard: isAbhaengungStandard
  });

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components,
    hasStandardValues: hasStandardValues
  };
}

function decodeEW(code) {
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

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

  // Position 2: Durchlass (21)
  let durchlass;
  let isDurchlassStandard = false;
  if (idx >= codeClean.length) {
    durchlass = defaults.durchlass;
    hasStandardValues = true;
    isDurchlassStandard = true;
  } else {
    durchlass = codeClean.substring(idx, idx + 2);
    idx += 2;
  }
  components.push({
    index: '02',
    name: 'Durchlass',
    value: durchlass,
    description: durchlass === '21' ? 'für DSX (Standard)' : durchlass,
    isStandard: isDurchlassStandard
  });

  // Position 3: Ausführung
  let ausfuehrung;
  let isAusfuehrungStandard = false;
  if (idx >= codeClean.length) {
    ausfuehrung = defaults.ausfuehrung;
    hasStandardValues = true;
    isAusfuehrungStandard = true;
  } else {
    ausfuehrung = codeClean[idx];
    idx += 1;
  }
  components.push({
    index: '03',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung,
    isStandard: isAusfuehrungStandard
  });

  // Position 4: Rahmenprofil (2 chars or 4 for ELOX)
  let rahmenprofil;
  let isRahmenprofilStandard = false;
  if (idx >= codeClean.length) {
    rahmenprofil = defaults.rahmenprofil;
    hasStandardValues = true;
    isRahmenprofilStandard = true;
  } else if (codeClean.substring(idx, idx + 4) === 'ELOX') {
    rahmenprofil = 'ELOX';
    idx += 4;
  } else {
    rahmenprofil = codeClean.substring(idx, idx + 2);
    idx += 2;
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

  // Position 5: Rahmenoberfläche (4 chars or ELOX)
  let rahmenoberflaeche;
  let isRahmenoberflaecheStandard = false;
  if (idx >= codeClean.length) {
    rahmenoberflaeche = defaults.rahmenoberflaeche;
    hasStandardValues = true;
    isRahmenoberflaecheStandard = true;
  } else if (codeClean.substring(idx, idx + 4) === 'ELOX') {
    rahmenoberflaeche = 'ELOX';
    idx += 4;
  } else {
    rahmenoberflaeche = codeClean.substring(idx, idx + 4);
    idx += 4;
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

  // Position 6: Farbe Blindprofil Luftführungselemente (5 chars)
  let blindprofil;
  let isBlindprofilStandard = false;
  if (idx >= codeClean.length) {
    blindprofil = defaults.blindprofil;
    hasStandardValues = true;
    isBlindprofilStandard = true;
  } else {
    blindprofil = codeClean.substring(idx, idx + 5);
    idx += 5;
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

  // Position 7: Winkel zwischen den Schenkeln (3 chars)
  let winkel;
  let isWinkelStandard = false;
  if (idx >= codeClean.length) {
    winkel = defaults.winkel;
    hasStandardValues = true;
    isWinkelStandard = true;
  } else {
    winkel = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  const winkelGrad = parseInt(winkel) || 90;
  components.push({
    index: '07',
    name: 'Winkel zwischen den Schenkeln',
    value: winkel,
    description: `${winkelGrad}°${winkel === '090' ? ' (Standard)' : ''}`,
    isStandard: isWinkelStandard
  });

  // Position 8: Schenkellaenge links a (3 chars)
  let schenkelLinks;
  let isSchenkelLinksStandard = false;
  if (idx >= codeClean.length) {
    schenkelLinks = defaults.schenkelLinks;
    hasStandardValues = true;
    isSchenkelLinksStandard = true;
  } else {
    schenkelLinks = codeClean.substring(idx, idx + 3);
    idx += 3;
  }
  components.push({
    index: '08',
    name: 'Schenkellaenge links (a)',
    value: schenkelLinks,
    description: schenkelLinks === '000' ? 'Standardlänge 250 mm' : `${parseInt(schenkelLinks)} mm`,
    isStandard: isSchenkelLinksStandard
  });

  // Position 9: Schenkellaenge rechts b (3 chars)
  let schenkelRechts;
  let isSchenkelRechtsStandard = false;
  if (idx >= codeClean.length) {
    schenkelRechts = defaults.schenkelRechts;
    hasStandardValues = true;
    isSchenkelRechtsStandard = true;
  } else {
    schenkelRechts = codeClean.substring(idx, idx + 3);
    idx += 3;
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
