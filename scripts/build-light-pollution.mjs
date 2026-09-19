// Dev-time preprocessing script: builds a coarse world grid of *estimated*
// Bortle light-pollution classes, bundled at src/data/lightPollution.json.
//
// There is no free, keyless, redistributable satellite light-pollution
// raster small enough to ship in a client bundle (the real World Atlas 2015
// data is a multi-GB GeoTIFF). Instead this derives a heuristic estimate
// from a public city/population database: for every grid cell, nearby
// cities contribute light pollution proportional to population and inverse
// square distance (a simple, well-known approximation of sky-glow falloff).
// This is NOT measured sky-brightness data - treat it as a rough estimate,
// not a survey-grade reading.
//
// Source: GeoNames cities15000 dump (CC BY 4.0), https://www.geonames.org/
//
// Run with: node scripts/build-light-pollution.mjs

import { inflateRawSync } from 'node:zlib';
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'raw');
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

const CITIES_ZIP_URL = 'https://download.geonames.org/export/dump/cities15000.zip';
const CITIES_ZIP_FILE = path.join(RAW_DIR, 'cities15000.zip');
const CITIES_ENTRY_NAME = 'cities15000.txt';

const CELL_SIZE_DEG = 0.5; // ~55km cells at the equator
const SEARCH_RADIUS_KM = 300; // cities beyond this contribute negligibly
const MIN_DISTANCE_KM = 2; // floor to avoid singularities for cells inside a city
const BUCKET_SIZE_DEG = 1; // spatial index bucket size for nearby-city lookup

async function ensureDownloaded() {
  try {
    await access(CITIES_ZIP_FILE);
    return;
  } catch {
    // fall through to download
  }
  console.log(`indiriliyor: ${CITIES_ZIP_URL}`);
  const res = await fetch(CITIES_ZIP_URL);
  if (!res.ok) throw new Error(`indirme basarisiz (${res.status}): ${CITIES_ZIP_URL}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(RAW_DIR, { recursive: true });
  await writeFile(CITIES_ZIP_FILE, buf);
}

/** Minimal ZIP reader: extracts one entry by name via the central directory (no external dependency). */
function readZipEntry(zipBuf, entryName) {
  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= 0; i--) {
    if (zipBuf.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('zip: end-of-central-directory bulunamadi');

  const cdEntryCount = zipBuf.readUInt16LE(eocdOffset + 10);
  const cdOffset = zipBuf.readUInt32LE(eocdOffset + 16);

  let offset = cdOffset;
  for (let i = 0; i < cdEntryCount; i++) {
    const sig = zipBuf.readUInt32LE(offset);
    if (sig !== 0x02014b50) throw new Error('zip: central directory kaydi bozuk');
    const method = zipBuf.readUInt16LE(offset + 10);
    const compressedSize = zipBuf.readUInt32LE(offset + 20);
    const nameLen = zipBuf.readUInt16LE(offset + 28);
    const extraLen = zipBuf.readUInt16LE(offset + 30);
    const commentLen = zipBuf.readUInt16LE(offset + 32);
    const localHeaderOffset = zipBuf.readUInt32LE(offset + 42);
    const name = zipBuf.toString('utf8', offset + 46, offset + 46 + nameLen);

    if (name === entryName) {
      const lh = localHeaderOffset;
      const lhNameLen = zipBuf.readUInt16LE(lh + 26);
      const lhExtraLen = zipBuf.readUInt16LE(lh + 28);
      const dataStart = lh + 30 + lhNameLen + lhExtraLen;
      const compressed = zipBuf.subarray(dataStart, dataStart + compressedSize);
      return method === 0 ? compressed : inflateRawSync(compressed);
    }

    offset += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`zip: '${entryName}' bulunamadi`);
}

async function loadCities() {
  const zipBuf = await readFile(CITIES_ZIP_FILE);
  const txt = readZipEntry(zipBuf, CITIES_ENTRY_NAME).toString('utf8');

  const cities = [];
  for (const line of txt.split('\n')) {
    if (!line.trim()) continue;
    const fields = line.split('\t');
    const lat = parseFloat(fields[4]);
    const lon = parseFloat(fields[5]);
    const population = parseInt(fields[14], 10);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(population) || population <= 0) continue;
    cities.push({ lat, lon, population });
  }
  return cities;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function bortleFromLpi(lpi) {
  // Calibrated against sample cells so log10(lpi)~0 (no nearby cities) ->
  // Bortle 1 and log10(lpi)~5.5 (a huge metro area, e.g. Tokyo) -> Bortle 9.
  const score = Math.log10(lpi + 1);
  const bortle = Math.round(1 + score * 1.45);
  return Math.min(9, Math.max(1, bortle));
}

function buildSpatialIndex(cities) {
  const buckets = new Map();
  for (const c of cities) {
    const key = `${Math.floor(c.lat / BUCKET_SIZE_DEG)}:${Math.floor(c.lon / BUCKET_SIZE_DEG)}`;
    const arr = buckets.get(key);
    if (arr) arr.push(c);
    else buckets.set(key, [c]);
  }
  return buckets;
}

function nearbyCities(buckets, lat, lon) {
  const latSpanDeg = SEARCH_RADIUS_KM / 111;
  const lonSpanDeg = Math.min(180, SEARCH_RADIUS_KM / (111 * Math.max(0.05, Math.cos((lat * Math.PI) / 180))));
  const bucketRadiusLat = Math.ceil(latSpanDeg / BUCKET_SIZE_DEG);
  const bucketRadiusLon = Math.ceil(lonSpanDeg / BUCKET_SIZE_DEG);
  const centerLatBucket = Math.floor(lat / BUCKET_SIZE_DEG);
  const centerLonBucket = Math.floor(lon / BUCKET_SIZE_DEG);

  const result = [];
  for (let dLat = -bucketRadiusLat; dLat <= bucketRadiusLat; dLat++) {
    for (let dLon = -bucketRadiusLon; dLon <= bucketRadiusLon; dLon++) {
      const key = `${centerLatBucket + dLat}:${centerLonBucket + dLon}`;
      const arr = buckets.get(key);
      if (arr) result.push(...arr);
    }
  }
  return result;
}

function buildGrid(cities) {
  const cols = Math.round(360 / CELL_SIZE_DEG);
  const rows = Math.round(180 / CELL_SIZE_DEG);
  const buckets = buildSpatialIndex(cities);
  const bortle = new Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    const cellLat = 90 - (row + 0.5) * CELL_SIZE_DEG;
    for (let col = 0; col < cols; col++) {
      const cellLon = -180 + (col + 0.5) * CELL_SIZE_DEG;
      const candidates = nearbyCities(buckets, cellLat, cellLon);

      let lpi = 0;
      for (const c of candidates) {
        const d = haversineKm(cellLat, cellLon, c.lat, c.lon);
        if (d > SEARCH_RADIUS_KM) continue;
        // A city's light source isn't a point: its glow stays roughly flat
        // out to about the radius of its built-up area before falling off,
        // so the inverse-square floor scales with population instead of
        // being fixed - otherwise a 0.5 deg grid cell almost never lands
        // close enough to a city's exact coordinate to reflect how bright
        // its core actually is.
        const floorKm = Math.max(MIN_DISTANCE_KM, Math.sqrt(c.population) / 100);
        lpi += c.population / Math.max(d, floorKm) ** 2;
      }
      bortle[row * cols + col] = bortleFromLpi(lpi);
    }
    if (row % 60 === 0) console.log(`grid: satir ${row}/${rows}`);
  }

  return { cols, rows, cellSizeDeg: CELL_SIZE_DEG, bortle };
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });
  await ensureDownloaded();
  console.log('sehirler yukleniyor...');
  const cities = await loadCities();
  console.log(`${cities.length} sehir yuklendi, grid hesaplaniyor...`);
  const grid = buildGrid(cities);
  await writeFile(path.join(DATA_DIR, 'lightPollution.json'), JSON.stringify(grid));
  console.log(`lightPollution.json yazildi: ${grid.cols}x${grid.rows} hucre`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
