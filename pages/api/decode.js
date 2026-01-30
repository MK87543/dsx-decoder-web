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

  // Position 2: Ausführung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const ausfuehrung = codeClean[idx];
  components.push({
    index: '02',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung
  });
  idx += 1;

  // Position 3: Luftführung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const luftfuehrung = codeClean[idx];
  components.push({
    index: '03',
    name: 'Luftführung',
    value: luftfuehrung,
    description: { 'Z': 'Zuluft', 'A': 'Abluft (mit Luftführungselementen)' }[luftfuehrung] || luftfuehrung
  });
  idx += 1;

  // Position 4: Rahmenprofil
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
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
  components.push({
    index: '04',
    name: 'Rahmenprofil',
    value: rahmenprofil,
    description: {
      'S0': 'Schmales Profil, unsichtbar (Standard)',
      'P0': 'Rahmenprofil P0, sichtbar',
      'PB': 'Rahmenprofil PB, sichtbar',
      'ELOX': 'Aluminium naturfarben eloxiert'
    }[rahmenprofil] || rahmenprofil
  });

  // Position 5: Rahmenoberfläche
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  let rahmenoberflaeche;
  if (codeClean.substring(idx, idx + 4) === 'ELOX') {
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
      '9005': 'RAL 9005 (schwarz)',
      '9010': 'RAL 9010 (weiß)'
    }[rahmenoberflaeche] || `RAL ${rahmenoberflaeche}`
  });

  // Position 6: Lamellenfarbe
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const lamellenfarbe = codeClean.substring(idx, idx + 5);
  components.push({
    index: '06',
    name: 'Lamellenfarbe',
    value: lamellenfarbe,
    description: {
      'L9005': 'RAL 9005 (schwarz, Standard)',
      'L9010': 'RAL 9010 (weiß)'
    }[lamellenfarbe] || lamellenfarbe
  });
  idx += 5;

  // Position 7: Lamellenstellung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const lamellenstellung = codeClean[idx];
  components.push({
    index: '07',
    name: 'Lamellenstellung',
    value: lamellenstellung,
    description: {
      'V': 'Vertikal ausblasend',
      'L': 'Horizontal einseitig links',
      'R': 'Horizontal einseitig rechts',
      'B': 'Horizontal beidseitig (Standard)'
    }[lamellenstellung] || lamellenstellung
  });
  idx += 1;

  // Position 8: Einzel-/Bandausführung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const ausfuehrungTyp = codeClean[idx];
  components.push({
    index: '08',
    name: 'Einzel-/Bandausführung',
    value: ausfuehrungTyp,
    description: { 'N': 'Einzelausführung', 'B': 'Bandausführung' }[ausfuehrungTyp] || ausfuehrungTyp
  });
  idx += 1;

  // Position 9: Länge
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const laenge = codeClean.substring(idx, idx + 5);
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '09',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`
  });
  idx += 5;

  // Position 10: Montage
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const montage = codeClean.substring(idx, idx + 2);
  components.push({
    index: '10',
    name: 'Montage',
    value: montage,
    description: {
      '00': 'Ohne Verbindung',
      'VM': 'Verdeckte Montage (Standard)',
      'KB': 'Klemmbügel'
    }[montage] || montage
  });
  idx += 2;

  // Position 11: Endstück
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const endstueck = codeClean.substring(idx, idx + 2);
  components.push({
    index: '11',
    name: 'Endstück',
    value: endstueck,
    description: {
      'E0': 'Ohne Endstück',
      'ES': 'Mit Endstück (Paar)',
      'EB': 'Beidseitig angebaut',
      'EL': 'Links angebaut',
      'ER': 'Rechts angebaut'
    }[endstueck] || endstueck
  });
  idx += 2;

  // Position 12: Befestigungswinkel/Blindstück
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const befestigung = codeClean.substring(idx, idx + 2);
  components.push({
    index: '12',
    name: 'Befestigungswinkel/Blindstück',
    value: befestigung,
    description: {
      'B0': 'Ohne',
      'BW': 'Mit Befestigungswinkel',
      'BS': 'Mit Blindstück'
    }[befestigung] || befestigung
  });
  idx += 2;

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components
  };
}

function decodeASK(code) {
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

  if (!codeClean.startsWith('ASK')) {
    return { error: "Code muss mit 'ASK' beginnen" };
  }

  const components = [];
  let idx = 0;

  // Position 1: Typ (ASK)
  const typ = codeClean.substring(idx, idx + 3);
  components.push({
    index: '01',
    name: 'Typ',
    value: typ,
    description: 'Anschlusskasten für Schlitzdurchlass'
  });
  idx += 3;

  // Position 2: Durchlass (21)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const durchlass = codeClean.substring(idx, idx + 2);
  components.push({
    index: '02',
    name: 'Durchlass',
    value: durchlass,
    description: durchlass === '21' ? 'für DSX' : durchlass
  });
  idx += 2;

  // Position 3: Ausführung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const ausfuehrung = codeClean[idx];
  components.push({
    index: '03',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung
  });
  idx += 1;

  // Position 4: Einzel-/Bandausführung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const einzelBand = codeClean[idx];
  components.push({
    index: '04',
    name: 'Einzel-/Bandausführung',
    value: einzelBand,
    description: { 'N': 'Einzelausführung', 'B': 'Bandausführung' }[einzelBand] || einzelBand
  });
  idx += 1;

  // Position 5: Länge (5 digits)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const laenge = codeClean.substring(idx, idx + 5);
  const laengeMm = parseInt(laenge) || 0;
  components.push({
    index: '05',
    name: 'Länge',
    value: laenge,
    description: `${laengeMm} mm`
  });
  idx += 5;

  // Position 6: Kastenmontage (2 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const kastenmontage = codeClean.substring(idx, idx + 2);
  components.push({
    index: '06',
    name: 'Kastenmontage',
    value: kastenmontage,
    description: {
      '00': 'Ohne Verbindung',
      'VM': 'Verdeckte Montage (Standard)'
    }[kastenmontage] || kastenmontage
  });
  idx += 2;

  // Position 7: Material (2 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const material = codeClean.substring(idx, idx + 2);
  components.push({
    index: '07',
    name: 'Material',
    value: material,
    description: material === 'SV' ? 'Stahlblech verzinkt (Standard)' : material
  });
  idx += 2;

  // Position 8: Drosselklappe (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const drosselklappe = codeClean.substring(idx, idx + 3);
  components.push({
    index: '08',
    name: 'Drosselklappe',
    value: drosselklappe,
    description: {
      'DK0': 'Ohne Drosselklappe (Standard)',
      'DK2': 'Mit Drosselklappe und Seilzugverstellung'
    }[drosselklappe] || drosselklappe
  });
  idx += 3;

  // Position 9: Gummilippendichtung (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const gummilippendichtung = codeClean.substring(idx, idx + 3);
  components.push({
    index: '09',
    name: 'Gummilippendichtung',
    value: gummilippendichtung,
    description: {
      'GD0': 'Ohne Gummilippendichtung (Standard)',
      'GD1': 'Mit Gummilippendichtung'
    }[gummilippendichtung] || gummilippendichtung
  });
  idx += 3;

  // Position 10: Isolierung (2 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const isolierung = codeClean.substring(idx, idx + 2);
  components.push({
    index: '10',
    name: 'Isolierung',
    value: isolierung,
    description: {
      'I0': 'Ohne Isolierung (Standard)',
      'Ii': 'Mit Isolierung innen',
      'Ia': 'Mit Isolierung außen'
    }[isolierung] || isolierung
  });
  idx += 2;

  // Position 11: Kastenhöhe (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const kastenhoehe = codeClean.substring(idx, idx + 3);
  components.push({
    index: '11',
    name: 'Kastenhöhe',
    value: kastenhoehe,
    description: kastenhoehe === 'KHS' ? 'Kastenhöhe Standard' : `${kastenhoehe} mm`
  });
  idx += 3;

  // Position 12: Kastenhals (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const kastenhals = codeClean.substring(idx, idx + 3);
  components.push({
    index: '12',
    name: 'Kastenhals',
    value: kastenhals,
    description: kastenhals === 'KVS' ? 'Kastenhals Standard (45 mm)' : `Kastenhalsverlängerung ${kastenhals} mm`
  });
  idx += 3;

  // Position 13: Stutzenlage (2 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const stutzenlage = codeClean.substring(idx, idx + 2);
  components.push({
    index: '13',
    name: 'Stutzenlage',
    value: stutzenlage,
    description: {
      'S0': 'Stutzen von oben',
      'S1': 'Stutzen seitlich (Standard)',
      'S2': 'Stutzen seitlich gegenüberliegend'
    }[stutzenlage] || stutzenlage
  });
  idx += 2;

  // Position 14: Stutzendurchmesser (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const stutzendurchmesser = codeClean.substring(idx, idx + 3);
  components.push({
    index: '14',
    name: 'Stutzendurchmesser',
    value: stutzendurchmesser,
    description: stutzendurchmesser === 'SDS' ? 'Stutzendurchmesser Standard' : `${stutzendurchmesser} mm`
  });
  idx += 3;

  // Position 15: Abhängung (2 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const abhaengung = codeClean.substring(idx, idx + 2);
  components.push({
    index: '15',
    name: 'Abhängung',
    value: abhaengung,
    description: {
      'E0': 'Ohne Einnietmutter (Standard)',
      'EM': 'Mit Einnietmutter'
    }[abhaengung] || abhaengung
  });
  idx += 2;

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components
  };
}

function decodeEW(code) {
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();

  if (!codeClean.startsWith('EW')) {
    return { error: "Code muss mit 'EW' beginnen" };
  }

  const components = [];
  let idx = 0;

  // Position 1: Typ (EW)
  const typ = codeClean.substring(idx, idx + 2);
  components.push({
    index: '01',
    name: 'Typ',
    value: typ,
    description: 'Eckwinkel für Schlitzdurchlass'
  });
  idx += 2;

  // Position 2: Durchlass (21)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const durchlass = codeClean.substring(idx, idx + 2);
  components.push({
    index: '02',
    name: 'Durchlass',
    value: durchlass,
    description: durchlass === '21' ? 'für DSX' : durchlass
  });
  idx += 2;

  // Position 3: Ausführung
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const ausfuehrung = codeClean[idx];
  components.push({
    index: '03',
    name: 'Ausführung',
    value: ausfuehrung,
    description: { '1': '1-schlitzig', '2': '2-schlitzig', '3': '3-schlitzig', '4': '4-schlitzig' }[ausfuehrung] || ausfuehrung
  });
  idx += 1;

  // Position 4: Rahmenprofil (2 chars or 4 for ELOX)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  let rahmenprofil;
  if (codeClean.substring(idx, idx + 4) === 'ELOX') {
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
    }[rahmenprofil] || rahmenprofil
  });

  // Position 5: Rahmenoberfläche (4 chars or ELOX)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  let rahmenoberflaeche;
  if (codeClean.substring(idx, idx + 4) === 'ELOX') {
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
      '9005': 'RAL 9005 (schwarz)',
      '9010': 'RAL 9010 (weiß)'
    }[rahmenoberflaeche] || `RAL ${rahmenoberflaeche}`
  });

  // Position 6: Farbe Blindprofil Luftführungselemente (5 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const blindprofil = codeClean.substring(idx, idx + 5);
  components.push({
    index: '06',
    name: 'Farbe Blindprofil/Luftführungselemente',
    value: blindprofil,
    description: {
      'B9005': 'RAL 9005 schwarz (Standard)',
      'B9010': 'RAL 9010 weiß'
    }[blindprofil] || `RAL ${blindprofil.substring(1)}`
  });
  idx += 5;

  // Position 7: Winkel zwischen den Schenkeln (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const winkel = codeClean.substring(idx, idx + 3);
  const winkelGrad = parseInt(winkel) || 90;
  components.push({
    index: '07',
    name: 'Winkel zwischen den Schenkeln',
    value: winkel,
    description: `${winkelGrad}°${winkel === '090' ? ' (Standard)' : ''}`
  });
  idx += 3;

  // Position 8: Schenkellaenge links a (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const schenkelLinks = codeClean.substring(idx, idx + 3);
  components.push({
    index: '08',
    name: 'Schenkellaenge links (a)',
    value: schenkelLinks,
    description: schenkelLinks === '000' ? 'Standardlänge 250 mm' : `${parseInt(schenkelLinks)} mm`
  });
  idx += 3;

  // Position 9: Schenkellaenge rechts b (3 chars)
  if (idx >= codeClean.length) return { error: 'Unvollständiger Code' };
  const schenkelRechts = codeClean.substring(idx, idx + 3);
  components.push({
    index: '09',
    name: 'Schenkellaenge rechts (b)',
    value: schenkelRechts,
    description: schenkelRechts === '000' ? 'Standardlänge 250 mm' : `${parseInt(schenkelRechts)} mm`
  });
  idx += 3;

  const formattedParts = components.map(c => c.value);
  const formattedCode = formattedParts.join('-');

  return {
    formatted_code: formattedCode,
    components: components
  };
}
