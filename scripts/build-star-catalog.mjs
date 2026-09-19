// Dev-time preprocessing script: downloads (if needed) and compiles the
// open-source HYG star catalog + d3-celestial constellation data into the
// compact JSON files bundled at src/data/*.json. Not shipped to the browser.
//
// Sources:
//   - HYG Database v3.8 (astronexus/HYG-Database), CC BY-SA 2.5
//   - d3-celestial constellation lines/names (ofrohn/d3-celestial), BSD-3-Clause
//
// Run with: node scripts/build-star-catalog.mjs

import { createGunzip } from 'node:zlib';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'raw');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

const MAG_LIMIT = 6.0;

const SOURCES = {
  hygGz: {
    url: 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/v3/hyg_v38.csv.gz',
    file: path.join(RAW_DIR, 'hyg_v38.csv.gz'),
  },
  constellationLines: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json',
    file: path.join(RAW_DIR, 'constellations.lines.json'),
  },
  constellationNames: {
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.json',
    file: path.join(RAW_DIR, 'constellations.json'),
  },
};

async function ensureDownloaded(source) {
  try {
    await access(source.file);
    return;
  } catch {
    // fall through to download
  }
  console.log(`indiriliyor: ${source.url}`);
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`indirme basarisiz (${res.status}): ${source.url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(source.file, buf);
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

async function buildStarCatalog() {
  const stream = createReadStream(SOURCES.hygGz.file).pipe(createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = null;
  let col = {};
  const hip = [];
  const ra = [];
  const dec = [];
  const mag = [];
  const bv = [];
  const con = [];

  for await (const line of rl) {
    if (!line) continue;
    const fields = parseCsvLine(line);
    if (!header) {
      header = fields;
      header.forEach((name, i) => (col[name] = i));
      continue;
    }
    const id = Number(fields[col.id]);
    const magVal = parseFloat(fields[col.mag]);
    if (id === 0) continue; // Sol
    if (!Number.isFinite(magVal) || magVal > MAG_LIMIT) continue;

    const hipVal = fields[col.hip] ? Number(fields[col.hip]) : id;
    const raRad = parseFloat(fields[col.rarad]);
    const decRad = parseFloat(fields[col.decrad]);
    if (!Number.isFinite(raRad) || !Number.isFinite(decRad)) continue;

    const ciVal = parseFloat(fields[col.ci]);

    hip.push(hipVal);
    ra.push((raRad * 180) / Math.PI);
    dec.push((decRad * 180) / Math.PI);
    mag.push(magVal);
    bv.push(Number.isFinite(ciVal) ? Math.round(ciVal * 1000) / 1000 : 0.65);
    con.push(fields[col.con] || '');
  }

  const out = {
    source: 'HYG Database v3.8 (astronexus/HYG-Database), CC BY-SA 2.5',
    epoch: 'J2000',
    magLimit: MAG_LIMIT,
    count: hip.length,
    hip,
    ra,
    dec,
    mag,
    bv,
    con,
  };

  await writeFile(path.join(DATA_DIR, 'stars.json'), JSON.stringify(out));
  console.log(`stars.json yazildi: ${hip.length} yildiz (mag <= ${MAG_LIMIT})`);
}

function normalizeLongitude(deg) {
  // d3-celestial stores RA as a signed longitude in [-180, 180]; convert to
  // standard RA degrees in [0, 360).
  return deg < 0 ? deg + 360 : deg;
}

async function buildConstellations() {
  const linesRaw = JSON.parse(await (await import('node:fs/promises')).readFile(SOURCES.constellationLines.file, 'utf8'));
  const namesRaw = JSON.parse(await (await import('node:fs/promises')).readFile(SOURCES.constellationNames.file, 'utf8'));

  const namesByCode = new Map();
  for (const f of namesRaw.features) {
    namesByCode.set(f.id, {
      nameLatin: f.properties.la || f.properties.name || f.id,
      nameTr: f.properties.tr || f.properties.la || f.id,
    });
  }

  // Some codes (e.g. "Ser" / Serpens) are split into multiple drawing parts
  // (Caput/Cauda) by d3-celestial despite being a single IAU constellation;
  // merge those back into one entry so downstream code (React keys,
  // getVisibleConstellations) sees each constellation exactly once.
  const byCode = new Map();
  for (const f of linesRaw.features) {
    const code = f.id;
    const names = namesByCode.get(code) || { nameLatin: code, nameTr: code };
    const segments = [];
    const multiLine = f.geometry.coordinates; // array of LineStrings
    for (const lineString of multiLine) {
      for (let i = 0; i < lineString.length - 1; i++) {
        const [ra1, dec1] = lineString[i];
        const [ra2, dec2] = lineString[i + 1];
        segments.push([
          [normalizeLongitude(ra1), dec1],
          [normalizeLongitude(ra2), dec2],
        ]);
      }
    }
    const existing = byCode.get(code);
    if (existing) {
      existing.lines.push(...segments);
    } else {
      byCode.set(code, { code, nameLatin: names.nameLatin, nameTr: names.nameTr, lines: segments });
    }
  }
  const constellations = [...byCode.values()];

  await writeFile(path.join(DATA_DIR, 'constellations.json'), JSON.stringify(constellations));
  console.log(`constellations.json yazildi: ${constellations.length} takimyildizi`);
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });
  await ensureDownloaded(SOURCES.hygGz);
  await ensureDownloaded(SOURCES.constellationLines);
  await ensureDownloaded(SOURCES.constellationNames);
  await buildStarCatalog();
  await buildConstellations();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
