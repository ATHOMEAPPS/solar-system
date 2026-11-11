// Node test: planets, Pluto and the Moon against JPL Horizons (DE441) at 160 dates spread
// over 1800–2050 (tests/fixtures/accuracy.json, written by tools/fetch-accuracy-fixtures.mjs).
// Run:  node tests/accuracy.test.mjs            (add --report to print without pass/fail limits)
// Three errors per body: direction seen from the Sun, direction seen from Earth (what a
// sky view shows), and the 3-D position error in km. Limits are about twice the measured worst case.
import { readFileSync } from 'node:fs';
import { computeSystemState, moonGeoKm } from '../js/ephemeris.js';
import { moonPlanetocentricKm } from '../js/moons.js';

const fx = JSON.parse(readFileSync(new URL('./fixtures/accuracy.json', import.meta.url)));
const reportOnly = process.argv.includes('--report');
let fails = 0;
const check = (name, ok, detail) => { console.log(`${ok || reportOnly ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); if (!ok && !reportOnly) fails++; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const arcsec = (a, b) => {
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return Math.atan2(Math.hypot(...c), a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) * 206264.806;
};

// [heliocentric ″, geocentric ″, km]
export const LIMITS = {
  mercury: [1, 1, 200], venus: [1, 1.5, 400], earth: [1, 0, 600], mars: [1, 1.5, 1000],
  jupiter: [1.2, 1.2, 4500], saturn: [1.5, 1.5, 10000], uranus: [4, 4, 50000], neptune: [5, 5, 100000], pluto: [0.1, 0.1, 1200],
};
const MOON_LIMIT = [25, 45];   // geocentric ″, km
// Major moons, degrees as seen from the planet (measured worst: 0.32° Mimas and Enceladus, 0.48° Triton).
const MOON_LIMITS_DEG = { default: 0.5, triton: 0.8 };

const n = fx.planets.earth.length;
const states = fx.planets.earth.map((r) => computeSystemState(r.jd, {}));
for (const [k, rows] of Object.entries(fx.planets)) {
  let h = 0, g = 0, d = 0, hs = 0;
  rows.forEach((r, i) => {
    const ref = [r.x, r.y, r.z], p = states[i][k];
    const eh = arcsec(p, ref);
    h = Math.max(h, eh); hs += eh * eh;
    d = Math.max(d, Math.hypot(...sub(p, ref)));
    if (k !== 'earth') {
      const e = fx.planets.earth[i];
      g = Math.max(g, arcsec(sub(p, states[i].earth), sub(ref, [e.x, e.y, e.z])));
    }
  });
  const L = LIMITS[k];
  check(`${k} vs Horizons, ${n} dates 1800–2050`, h < L[0] && g <= L[1] && d < L[2],
    `from the Sun worst ${h.toFixed(2)}″ (rms ${Math.sqrt(hs / n).toFixed(2)}″)${k === 'earth' ? '' : `, from Earth worst ${g.toFixed(2)}″`}, position worst ${d.toFixed(0)} km`);
}
{
  let a = 0, d = 0, as = 0;
  for (const r of fx.moon) {
    const m = moonGeoKm(r.jd), ref = [r.x, r.y, r.z], e = arcsec(m, ref);
    a = Math.max(a, e); as += e * e; d = Math.max(d, Math.hypot(...sub(m, ref)));
  }
  check(`moon (geocentric) vs Horizons, ${fx.moon.length} dates 1800–2050`, a < MOON_LIMIT[0] && d < MOON_LIMIT[1],
    `worst ${a.toFixed(2)}″ (rms ${Math.sqrt(as / fx.moon.length).toFixed(2)}″), position worst ${d.toFixed(1)} km`);
}
// Major moons: direction seen from the planet's centre (degrees along the orbit) at 80 dates over
// 1850–2050 that the fit in tools/fit-moons.mjs did not use.
{
  const mfx = JSON.parse(readFileSync(new URL('./fixtures/moon-accuracy.json', import.meta.url)));
  for (const [k, rows] of Object.entries(mfx.moons)) {
    let w = 0, ss = 0, d = 0;
    for (const r of rows) {
      const p = moonPlanetocentricKm(k, r.jd), ref = [r.x, r.y, r.z], e = arcsec(p, ref) / 3600;
      w = Math.max(w, e); ss += e * e; d = Math.max(d, Math.hypot(...sub(p, ref)));
    }
    const lim = MOON_LIMITS_DEG[k] ?? MOON_LIMITS_DEG.default;
    check(`${k} (from its planet) vs Horizons, ${rows.length} dates 1850–2050`, w < lim,
      `worst ${w.toFixed(3)}° (rms ${Math.sqrt(ss / rows.length).toFixed(3)}°), position worst ${d.toFixed(0)} km; limit ${lim}°`);
  }
}
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
process.exit(fails ? 1 : 0);
