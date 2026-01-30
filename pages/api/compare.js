export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code1, code2 } = req.body;

  if (!code1 || !code2) {
    return res.status(400).json({ error: 'Beide Codes sind erforderlich' });
  }

  // Remove all dashes and normalize
  const clean1 = code1.replace(/-/g, '').trim().toUpperCase();
  const clean2 = code2.replace(/-/g, '').trim().toUpperCase();

  // Check if they're identical
  const identical = clean1 === clean2;

  if (identical) {
    // Decode to get formatted version
    const decoded = decodeCode(clean1);
    return res.status(200).json({
      identical: true,
      formatted_code: decoded.formatted_code || clean1
    });
  } else {
    // Find differences
    const decoded1 = decodeCode(clean1);
    const decoded2 = decodeCode(clean2);
    
    const differences = [];
    
    // Compare product types
    const type1 = clean1.substring(0, 3);
    const type2 = clean2.substring(0, 3);
    
    if (type1 !== type2) {
      differences.push(`Unterschiedliche Produkttypen: ${type1} vs ${type2}`);
    }
    
    // Compare lengths
    if (clean1.length !== clean2.length) {
      differences.push(`Unterschiedliche Längen: ${clean1.length} vs ${clean2.length} Zeichen`);
    }
    
    // Character-by-character comparison
    const maxLen = Math.max(clean1.length, clean2.length);
    for (let i = 0; i < maxLen; i++) {
      if (clean1[i] !== clean2[i]) {
        differences.push(`Position ${i + 1}: '${clean1[i] || '(fehlt)'}' vs '${clean2[i] || '(fehlt)'}'`);
      }
    }
    
    return res.status(200).json({
      identical: false,
      formatted_code1: decoded1.formatted_code,
      formatted_code2: decoded2.formatted_code,
      differences: differences.slice(0, 10) // Limit to first 10 differences
    });
  }
}

function decodeCode(code) {
  // Import decode logic - simplified for comparison
  const codeClean = code.replace(/-/g, '').trim().toUpperCase();
  
  if (codeClean.startsWith('DSX')) {
    return decodeDSX(codeClean);
  } else if (codeClean.startsWith('ASK')) {
    return decodeASK(codeClean);
  } else if (codeClean.startsWith('EW')) {
    return decodeEW(codeClean);
  }
  
  return { formatted_code: codeClean };
}

function decodeDSX(codeClean) {
  try {
    const parts = [];
    let idx = 0;
    
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // DSX
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Ausfuehrung
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Luftfuehrung
    
    // Rahmenprofil
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      parts.push('ELOX'); idx += 4;
    } else {
      parts.push(codeClean.substring(idx, idx + 2)); idx += 2;
    }
    
    // Rahmenoberflaeche
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      parts.push('ELOX'); idx += 4;
    } else {
      parts.push(codeClean.substring(idx, idx + 4)); idx += 4;
    }
    
    parts.push(codeClean.substring(idx, idx + 5)); idx += 5; // Lamellenfarbe
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Lamellenstellung
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Einzel/Band
    parts.push(codeClean.substring(idx, idx + 5)); idx += 5; // Laenge
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Montage
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Endstueck
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Befestigung
    
    return { formatted_code: parts.join('-') };
  } catch (e) {
    return { formatted_code: codeClean };
  }
}

function decodeASK(codeClean) {
  try {
    const parts = [];
    let idx = 0;
    
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // ASK
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Durchlass
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Ausfuehrung
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Einzel/Band
    parts.push(codeClean.substring(idx, idx + 5)); idx += 5; // Laenge
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Kastenmontage
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Material
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Drosselklappe
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Gummilippendichtung
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Isolierung
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Kastenhoehe
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Kastenhals
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Stutzenlage
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Stutzendurchmesser
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Abhaengung
    
    return { formatted_code: parts.join('-') };
  } catch (e) {
    return { formatted_code: codeClean };
  }
}

function decodeEW(codeClean) {
  try {
    const parts = [];
    let idx = 0;
    
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // EW
    parts.push(codeClean.substring(idx, idx + 2)); idx += 2; // Durchlass
    parts.push(codeClean.substring(idx, idx + 1)); idx += 1; // Ausfuehrung
    
    // Rahmenprofil
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      parts.push('ELOX'); idx += 4;
    } else {
      parts.push(codeClean.substring(idx, idx + 2)); idx += 2;
    }
    
    // Rahmenoberflaeche
    if (codeClean.substring(idx, idx + 4) === 'ELOX') {
      parts.push('ELOX'); idx += 4;
    } else {
      parts.push(codeClean.substring(idx, idx + 4)); idx += 4;
    }
    
    parts.push(codeClean.substring(idx, idx + 5)); idx += 5; // Blindprofil
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Winkel
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Schenkel links
    parts.push(codeClean.substring(idx, idx + 3)); idx += 3; // Schenkel rechts
    
    return { formatted_code: parts.join('-') };
  } catch (e) {
    return { formatted_code: codeClean };
  }
}
