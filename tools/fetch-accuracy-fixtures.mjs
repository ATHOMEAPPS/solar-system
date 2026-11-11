// =============================================================================
// tools/fetch-accuracy-fixtures.mjs — Dev-only: download reference positions from
// JPL Horizons (DE441) into tests/fixtures/accuracy.json for tests/accuracy.test.mjs.
//   node tools/fetch-accuracy-fixtures.mjs
// Planets: heliocentric (Sun centre) ecliptic J2000 vectors of the planet centres
// (Pluto: the Pluto–Charon barycentre, which is what computeSystemState returns).
// Moon: geocentric ecliptic J2000. Epochs: 160 dates spread over 1800–2050 (TDB).
// =============================================================================
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function vectors(cmd, center, jds) {
  const out = [];
  for (let i = 0; i < jds.length; i += 40) {
    const p = new URLSearchParams({ format: 'json', COMMAND: `'${cmd}'`, OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'",
      EPHEM_TYPE: "'VECTORS'", CENTER: `'${center}'`, REF_PLANE: "'ECLIPTIC'", REF_SYSTEM: "'J2000'",
      VEC_TABLE: "'1'", OUT_UNITS: "'KM-S'", CSV_FORMAT: "'YES'", VEC_LABELS: "'NO'", TLIST: `'${jds.slice(i, i + 40).join("','")}'` });
    const j = await (await fetch(`${API}?${p}`)).json();
    if (!j.result || !j.result.includes('$$SOE')) throw new Error(`Horizons ${cmd}: ${String(j.result || j.error).slice(0, 400)}`);
    for (const l of j.result.split('$$SOE')[1].split('$$EOE')[0].trim().split('\n')) {
      const c = l.split(',').map((s) => s.trim());
      out.push({ jd: +c[0], x: +c[2], y: +c[3], z: +c[4] });
    }
    await sleep(500);
  }
  return out;
}

// Deterministic, irregular epochs: 160 dates between 1800-01-01 (JD 2378496.5) and 2050-12-31 (JD 2470171.5).
const JD0 = 2378496.5, JD1 = 2470171.5, N = 160, jds = [];
let seed = 20261111;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < N; i++) jds.push(+(JD0 + ((i + rnd()) / N) * (JD1 - JD0)).toFixed(4));

const out = { source: 'JPL Horizons (DE441), ecliptic J2000, km', generated: new Date().toISOString().slice(0, 10), planets: {}, moon: [] };
const ids = { mercury: '199', venus: '299', earth: '399', mars: '499', jupiter: '599', saturn: '699', uranus: '799', neptune: '899', pluto: '9' };
for (const [k, id] of Object.entries(ids)) { out.planets[k] = await vectors(id, '500@10', jds); console.log(k, out.planets[k].length); }
out.moon = await vectors('301', '500@399', jds); console.log('moon', out.moon.length);
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures', 'accuracy.json');
writeFileSync(file, JSON.stringify(out));
console.log('wrote', file);
