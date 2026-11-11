// =============================================================================
// tools/fetch-moon-accuracy-fixtures.mjs — Dev-only: download planetocentric positions of the
// 20 major moons from JPL Horizons into tests/fixtures/moon-accuracy.json (for
// tests/accuracy.test.mjs). 80 irregular dates over 1850–2050 (TDB), ecliptic J2000, km.
// These dates are NOT the ones tools/fit-moons.mjs fits to, so the test is independent of the fit.
//   node tools/fetch-moon-accuracy-fixtures.mjs
// =============================================================================
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const IDS = { phobos: [401, 499], deimos: [402, 499], io: [501, 599], europa: [502, 599], ganymede: [503, 599], callisto: [504, 599],
  mimas: [601, 699], enceladus: [602, 699], tethys: [603, 699], dione: [604, 699], rhea: [605, 699], titan: [606, 699], iapetus: [608, 699],
  miranda: [705, 799], ariel: [701, 799], umbriel: [702, 799], titania: [703, 799], oberon: [704, 799], triton: [801, 899], charon: [901, 999] };

async function vectors(id, center, jds) {
  const out = [];
  for (let i = 0; i < jds.length; i += 40) {
    const p = new URLSearchParams({ format: 'json', COMMAND: `'${id}'`, OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'",
      EPHEM_TYPE: "'VECTORS'", CENTER: `'500@${center}'`, REF_PLANE: "'ECLIPTIC'", REF_SYSTEM: "'J2000'",
      VEC_TABLE: "'1'", OUT_UNITS: "'KM-S'", CSV_FORMAT: "'YES'", VEC_LABELS: "'NO'", TLIST: `'${jds.slice(i, i + 40).join("','")}'` });
    let done = false;
    for (let attempt = 0; attempt < 5 && !done; attempt++) {
      try {
        const j = await (await fetch(`${API}?${p}`)).json();
        if (!j.result || !j.result.includes('$$SOE')) throw new Error(String(j.result || j.error).slice(0, 300));
        for (const l of j.result.split('$$SOE')[1].split('$$EOE')[0].trim().split('\n')) {
          const c = l.split(',').map((s) => s.trim());
          out.push({ jd: +c[0], x: +c[2], y: +c[3], z: +c[4] });
        }
        done = true;
      } catch (e) { console.warn(`  retry ${id}: ${e.message.slice(0, 120)}`); await sleep(2000 * (attempt + 1)); }
    }
    if (!done) throw new Error(`Horizons failed for ${id}`);
    await sleep(400);
  }
  return out;
}

const JD0 = 2396758.5, JD1 = 2470171.5, N = 80, jds = [];     // 1850-01-01 … 2050-12-31
let seed = 987654321;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
for (let i = 0; i < N; i++) jds.push(+(JD0 + ((i + rnd()) / N) * (JD1 - JD0)).toFixed(5));

const out = { source: 'JPL Horizons, planetocentric, ecliptic J2000, km', generated: new Date().toISOString().slice(0, 10), moons: {} };
for (const [k, [id, c]] of Object.entries(IDS)) { out.moons[k] = await vectors(id, c, jds); console.log(k, out.moons[k].length); }
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures', 'moon-accuracy.json');
writeFileSync(file, JSON.stringify(out));
console.log('wrote', file);
