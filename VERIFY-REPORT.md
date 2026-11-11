# Sol Simulator — self-check report

- Generated 2026-11-11 06:21:45 UTC with Node v24.18.0
- Data: data (downloaded 2026-09-25, full)
- Browser-only rows (GPU solver readback, named-body models) are SKIP here — run ✓ Verify in the app and use "Copy report".
- **Verify:** 34 pass · 0 fail · 2 skipped · 0 pending
- **Test suites:** 8 (8 passed) — 130 PASS lines, 0 FAIL
- ⏱ = depends on today's date or the data download date, so its numbers change from day to day.

## Spec §7 — core accuracy checks
| Status | Check | Result |
|---|---|---|
| ✅ PASS | Total solar eclipse 2024-04-08 18:18 UTC | Moon between Sun & Earth: yes; shadow-axis γ = 0.3439 R⊕ (NASA 0.3431 at greatest eclipse 18:17:16) |
| ✅ PASS | Total lunar eclipse 2025-03-14 06:58 UTC | Moon centre 2221 km from shadow axis (γ 0.3482, NASA 0.3485); umbra radius 4645 km → fully inside umbra (total) |
| ✅ PASS | Earth perihelion 2026 ⏱ | 0.98330 AU on 2026-01-03 17:14 UTC (expect ≈0.983 AU near Jan 3) |
| ✅ PASS | Earth aphelion 2026 ⏱ | 1.01664 AU on 2026-07-06 17:30 UTC (expect ≈1.017 AU near Jul 4) |
| ✅ PASS | Jupiter heliocentric longitude vs JPL Horizons ⏱ | 2026-11-11 06:21 UTC: sim 134.412°, Horizons 134.412°, Δ 0.0001° (limit 0.01°; the embedded table is rounded to 0.001°) |
| ✅ PASS | Mars heliocentric longitude vs JPL Horizons ⏱ | 2026-11-11 06:21 UTC: sim 105.281°, Horizons 105.281°, Δ 0.0003° (limit 0.01°; the embedded table is rounded to 0.001°) |
| ✅ PASS | Io orbital period ⏱ | mean of 50 orbits = 1.76910 d (expect 1.769 d; IAU 1.769138 d) |
| ✅ PASS | Synodic month (Moon) ⏱ | mean of 37 lunations = 29.5293 d (expect 29.5306); individual 29.29–29.81 d; next new moon 2026-12-09 00:52 UTC |

## Spec §8 — additional self-checks
| Status | Check | Result |
|---|---|---|
| ✅ PASS | Halley's Comet perihelion 1986-02-09, ~0.586 AU | Horizons vectors: perihelion 1986-02-09 11:00 UTC at 0.5871 AU |
| ✅ PASS | Hale-Bopp perihelion 1997-04-01, ~0.914 AU | Horizons vectors: perihelion 1997-04-01 03:10 UTC at 0.9142 AU |
| ✅ PASS | ʻOumuamua perihelion 2017-09-09, ~0.256 AU | 'Oumuamua (A/2017 U1): two-body perihelion from current elements 2017-09-09 12:09 UTC at q = 0.2559 AU (e = 1.2011) |
| ✅ PASS | Apophis closest approach 2029-04-13, ~38,000 km (inside GEO) | Horizons vectors: 38011 km from Earth's center at 2029-04-13 21:45 UTC (GEO radius 42,164 km) |
| ✅ PASS | Perseids: Earth crosses the 109P stream ~08/12 ⏱ | closest 2026-08-12 10:37 UTC (-0.1 d vs peak) at 0.0004 AU from the parent orbit; radiant RA 45.8°, Dec 57.7° (1.2° from IMO 48°, 58°); v_g 59.4 km/s (IMO 59) |

## Phase-specific checks (data, moons, rendering, small bodies, comets, events)
| Status | Check | Result |
|---|---|---|
| ✅ PASS | Events engine finds the 2024-04-08 total solar & 2025-03-14 total lunar eclipses | found total solar (+0.7 min vs NASA), total lunar (+0.6 min); tests/events.test.mjs checks all 44 eclipses of 2021–2030 |
| ✅ PASS | 20 major moons vs JPL Horizons (2026-09-25) | worst enceladus 0.312° (1299 km); phobos 0.02°, deimos 0.06°, io 0.06°, europa 0.09°, ganymede 0.08°, callisto 0.02°, mimas 0.12°, enceladus 0.31°, tethys 0.07°, dione 0.06°, rhea 0.03°, titan 0.02°, iapetus 0.08°, miranda 0.15°, ariel 0.08°, umbriel 0.04°, titania 0.07°, oberon 0.27°, triton 0.01°, charon 0.00° |
| ✅ PASS | Solar eclipse shading (Moon umbra on Earth) | solar disc visible at the shadow-axis point on Earth: 0.000% (total → 0%) |
| ✅ PASS | Lunar eclipse shading (Moon turns red) | solar disc visible from Moon center 0.00%; light rgb (0.0393, 0.0132, 0.0041) — red-dominant |
| ✅ PASS | Kepler solver: universal vs elliptic (e = 0.5) | max \|Δ\| 3.61e-15 AU |
| ✅ PASS | Kepler solver: universal vs hyperbolic (e = 1.5) | max relative \|Δ\| 5.45e-16 |
| ✅ PASS | Kepler solver: near-parabolic continuity (e = 0.9999 / 1 / 1.0001) | max \|Δ\| 6.78e-4 AU |
| ✅ PASS | Rotation sense (retrograde rotators) ⏱ | retrograde: venus, uranus (expect venus, uranus) |
| ✅ PASS | Earth daylight / GMST alignment (2026-06-21 12:00 UTC) | sub-solar point 23.44°N, 0.46°E (expect ≈23.43°N, +0.4°E) |
| ✅ PASS | Small-body data present and fresh (< 6 months) ⏱ | updated 2026-09-25 (46.4 d ago, full); 50000 asteroids, 42531 NEOs (2549 PHA), 645 comets, 3 interstellar, 8 dwarfs, 43470 close approaches, 14 Horizons tracks |
| ➖ SKIP | GPU Kepler solver vs float64 CPU (render-target readback) | needs WebGL (runs in the browser Verify panel) |
| ✅ PASS | Horizons vector interpolation (cubic Hermite, leave-one-out) | Apophis, predicting each sample from neighbours 2 steps apart (an upper bound): geocentric 10 min: ≤ 0.13 km; heliocentric 360 min: ≤ 106.86 km; heliocentric 1440 min: ≤ 3.72 km; heliocentric 1440 min: ≤ 1.50 km |
| ✅ PASS | Kirkwood gaps emerge in the main-belt semi-major axes | 40,448 main-belt asteroids; density in gap ÷ neighbours: 3:1 0.00, 5:2 0.00, 7:3 0.20, 2:1 0.00 (gap if < 0.35) |
| ✅ PASS | Jupiter Trojans cluster at L4/L5 (±60° from Jupiter) | 8,015 Trojans: L4 (leading) 4788 with median Δλ = 62.1°, L5 (trailing) 3227 with median -61.6°; 99.7% within 20–100° of Jupiter |
| ✅ PASS | Plutinos pile up in the 3:2 Neptune resonance (a ≈ 39.4 AU) | 8,341 TNOs/Centaurs; density at 39.2–39.7 AU is 6.4× the neighbouring bins (resonance if > 3) |
| ✅ PASS | DART changed Dimorphos' orbital period (−33 min) | sim period 11.921 h before → 11.367 h after the 2022-09-26 impact: Δ = -33.2 min (published −33.24 ± 1.6 min, Naidu 2024) |
| ➖ SKIP | Named asteroids & dwarf planets modelled | browser only |
| ✅ PASS | Orionids: Earth crosses the 1P stream ~10/21 ⏱ | closest 2026-10-25 19:53 UTC (+4.3 d vs peak) at 0.1504 AU from the parent orbit; radiant RA 97.8°, Dec 19.4° (4.3° from IMO 95°, 16°); v_g 65.7 km/s (IMO 66) |
| ✅ PASS | Eta Aquariids: Earth crosses the 1P stream ~05/06 ⏱ | closest 2026-05-07 10:04 UTC (+0.9 d vs peak) at 0.0747 AU from the parent orbit; radiant RA 337.4°, Dec 1.2° (2.3° from IMO 338°, -1°); v_g 66.5 km/s (IMO 66) |
| ✅ PASS | Leonids: Earth crosses the 55P stream ~11/17 ⏱ | closest 2026-11-17 17:34 UTC (+0.2 d vs peak) at 0.0081 AU from the parent orbit; radiant RA 153.4°, Dec 21.8° (1.3° from IMO 152°, 22°); v_g 70.8 km/s (IMO 71) |
| ✅ PASS | Geminids: Earth crosses the Phaethon stream ~12/14 ⏱ | closest 2026-12-14 21:02 UTC (+0.4 d vs peak) at 0.0187 AU from the parent orbit; radiant RA 114.7°, Dec 32.7° (2.2° from IMO 112°, 33°); v_g 33.8 km/s (IMO 35) |
| ✅ PASS | Interstellar objects: hyperbolic excess speed v∞ and ʻOumuamua radiant | 'Oumuamua 26.4 km/s (expect 26.3); C/2019 Q4 32.3 km/s (expect 32.3); C/2025 N1 58.0 km/s (expect 58); ʻOumuamua came from RA 279.6°, Dec 33.9° (0.2° from the published 279.8°, +33.9°, near Vega) |
| ✅ PASS | Dust tail curves behind the orbital motion (syndyne/synchrone model) | NEOWISE on 2020-07-20 (17 d after perihelion): synchrone angle from the anti-sunward ion-tail axis 4 d → 8° trailing, 13 d → 37° trailing, 30 d → 99° trailing, 60 d → 129° trailing — curves steadily toward −v |

## Node test suites (`npm test`)
### ephemeris.test.mjs — passed
- ✅ mercury helio direction — worst 0.1″, \|Δr\| 2.17e-7 AU
- ✅ venus helio direction — worst 0.2″, \|Δr\| 1.79e-7 AU
- ✅ earth helio direction — worst 0.2″, \|Δr\| 3.28e-7 AU
- ✅ mars helio direction — worst 0.2″, \|Δr\| 4.52e-7 AU
- ✅ jupiter helio direction — worst 0.5″, \|Δr\| 3.02e-6 AU
- ✅ saturn helio direction — worst 0.7″, \|Δr\| 9.98e-6 AU
- ✅ uranus helio direction — worst 1.5″, \|Δr\| 7.56e-5 AU
- ✅ neptune helio direction — worst 2.2″, \|Δr\| 6.05e-5 AU
- ✅ pluto helio direction — worst 0.1″, \|Δr\| 1.04e-5 AU
- ✅ moon @JD 2440000.5000 — Δθ 2.4″ — Δr -5.2 km — \|Δ\| 7 km
- ✅ moon @JD 2451545.0000 — Δθ 1.7″ — Δr -3.8 km — \|Δ\| 5 km
- ✅ moon @JD 2460409.2633 — Δθ 3.1″ — Δr 2.3 km — \|Δ\| 6 km
- ✅ moon @JD 2460748.7911 — Δθ 2.2″ — Δr 1.2 km — \|Δ\| 4 km
- ✅ moon @JD 2461308.5000 — Δθ 3.2″ — Δr -1.3 km — \|Δ\| 6 km
- ✅ moon @JD 2466000.5000 — Δθ 5.0″ — Δr 0.6 km — \|Δ\| 9 km
- ✅ mars longitude 2024–2030 vs Horizons — worst 0.00007°
- ✅ jupiter longitude 2024–2030 vs Horizons — worst 0.00014°
- ✅ universal vs elliptic (e=0.5) — max \|Δ\| 3.61e-15 AU
- ✅ universal vs hyperbolic (e=1.5) — max rel \|Δ\| 5.45e-16
- ✅ near-parabolic continuity e=0.9999/1/1.0001 — max \|Δ\| 6.78e-4 AU
- ✅ conicPosition r(tp) = q — r=0.586000000000
- ✅ 2024-04-08 solar eclipse gamma — γ=0.3439 (NASA 0.3431 at 18:17:16)
- ✅ 2025-03-14 lunar eclipse gamma
- ✅ mercury rotation (sub-solar point) — Δlon -0.010° — Δlat 0.000°
- ✅ venus rotation (sub-solar point) — Δlon 0.007° — Δlat -0.000°
- ✅ earth rotation (sub-solar point) — Δlon 0.005° — Δlat -0.001°
- ✅ mars rotation (sub-solar point) — Δlon -0.007° — Δlat 0.001°
- ✅ jupiter rotation (sub-solar point) — Δlon -0.008° — Δlat -0.000°
- ✅ saturn rotation (sub-solar point) — Δlon -0.004° — Δlat -0.001°
- ✅ uranus rotation (sub-solar point) — Δlon 0.001° — Δlat 0.001°
- ✅ neptune pole
- ✅ pluto rotation (sub-solar point) — Δlon -0.002° — Δlat 0.000°
- ✅ phobos — vs Horizons — worst 0.061° (10 km), fit rms 0.008°
- ✅ deimos — vs Horizons — worst 0.058° (24 km), fit rms 0.029°
- ✅ io — vs Horizons — worst 0.072° (1574 km), fit rms 0.006°
- ✅ europa — vs Horizons — worst 0.085° (6274 km), fit rms 0.033°
- ✅ ganymede — vs Horizons — worst 0.143° (2847 km), fit rms 0.05°
- ✅ callisto — vs Horizons — worst 0.016° (651 km), fit rms 0.013°
- ✅ mimas — vs Horizons — worst 0.160° (526 km), fit rms 0.099°
- ✅ enceladus vs Horizons — worst 0.312° (1298 km), fit rms 0.117°
- ✅ tethys — vs Horizons — worst 0.073° (375 km), fit rms 0.012°
- ✅ dione — vs Horizons — worst 0.057° (376 km), fit rms 0.015°
- ✅ rhea — vs Horizons — worst 0.080° (737 km), fit rms 0.014°
- ✅ titan — vs Horizons — worst 0.034° (836 km), fit rms 0.018°
- ✅ iapetus — vs Horizons — worst 0.092° (5805 km), fit rms 0.033°
- ✅ ariel — vs Horizons — worst 0.111° (377 km), fit rms 0.072°
- ✅ umbriel — vs Horizons — worst 0.112° (530 km), fit rms 0.058°
- ✅ titania — vs Horizons — worst 0.166° (1263 km), fit rms 0.084°
- ✅ oberon — vs Horizons — worst 0.271° (2782 km), fit rms 0.118°
- ✅ miranda — vs Horizons — worst 0.240° (544 km), fit rms 0.103°
- ✅ triton — vs Horizons — worst 0.053° (327 km), fit rms 0.004°
- ✅ charon — vs Horizons — worst 0.004° (1 km), fit rms 0°

### accuracy.test.mjs — passed
- ✅ mercury vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.34″ (rms 0.14″), from Earth worst 0.40″, position worst 79 km
- ✅ venus vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.34″ (rms 0.13″), from Earth worst 0.75″, position worst 179 km
- ✅ earth vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.38″ (rms 0.13″), position worst 277 km
- ✅ mars vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.46″ (rms 0.16″), from Earth worst 0.73″, position worst 476 km
- ✅ jupiter vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.55″ (rms 0.21″), from Earth worst 0.55″, position worst 2068 km
- ✅ saturn vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.64″ (rms 0.28″), from Earth worst 0.69″, position worst 4703 km
- ✅ uranus vs Horizons, 160 dates 1800–2050 — from the Sun worst 1.79″ (rms 0.65″), from Earth worst 1.77″, position worst 24428 km
- ✅ neptune vs Horizons, 160 dates 1800–2050 — from the Sun worst 2.21″ (rms 1.13″), from Earth worst 2.28″, position worst 48815 km
- ✅ pluto vs Horizons, 160 dates 1800–2050 — from the Sun worst 0.02″ (rms 0.01″), from Earth worst 0.02″, position worst 547 km
- ✅ moon (geocentric) vs Horizons, 160 dates 1800–2050 — worst 11.37″ (rms 3.12″), position worst 20.2 km
- ✅ phobos (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.245° (rms 0.100°), position worst 40 km; limit 0.5°
- ✅ deimos (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.180° (rms 0.082°), position worst 74 km; limit 0.5°
- ✅ io (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.081° (rms 0.042°), position worst 1820 km; limit 0.5°
- ✅ europa (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.160° (rms 0.072°), position worst 6463 km; limit 0.5°
- ✅ ganymede (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.181° (rms 0.090°), position worst 3386 km; limit 0.5°
- ✅ callisto (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.047° (rms 0.024°), position worst 1574 km; limit 0.5°
- ✅ mimas (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.324° (rms 0.150°), position worst 1031 km; limit 0.5°
- ✅ enceladus (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.315° (rms 0.153°), position worst 1304 km; limit 0.5°
- ✅ tethys (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.098° (rms 0.048°), position worst 506 km; limit 0.5°
- ✅ dione (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.067° (rms 0.033°), position worst 442 km; limit 0.5°
- ✅ rhea (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.127° (rms 0.063°), position worst 1171 km; limit 0.5°
- ✅ titan (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.047° (rms 0.026°), position worst 1203 km; limit 0.5°
- ✅ iapetus (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.108° (rms 0.049°), position worst 6653 km; limit 0.5°
- ✅ miranda (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.295° (rms 0.160°), position worst 668 km; limit 0.5°
- ✅ ariel (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.148° (rms 0.079°), position worst 494 km; limit 0.5°
- ✅ umbriel (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.155° (rms 0.069°), position worst 720 km; limit 0.5°
- ✅ titania (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.181° (rms 0.085°), position worst 1398 km; limit 0.5°
- ✅ oberon (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.264° (rms 0.132°), position worst 2690 km; limit 0.5°
- ✅ triton (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.475° (rms 0.171°), position worst 2938 km; limit 0.8°
- ✅ charon (from its planet) vs Horizons, 80 dates 1850–2050 — worst 0.005° (rms 0.002°), position worst 2 km; limit 0.5°

### kepler-state.test.mjs — passed
- ✅ propagateState vs conicPosition (e = 0.967) — worst \|Δ\| 4.16e-6 AU over ±3000 d (limited by the finite-difference test velocity)
- ✅ propagateState vs conicPosition (e = 1.5) — worst relative \|Δ\| 8.27e-8
- ✅ β = 0.9 grain conserves energy (μ_eff = 0.1 μ) — relative ΔE 2.29e-16; r(100 d) = (0.900, 1.677, 0.000) AU

### events.test.mjs — passed
- ✅ solar eclipses 2021–2030: 22 in NASA's table, 22 found; worst timing error 0.9 min
- ✅ lunar eclipses 2021–2030: 22 in NASA's table, 22 found; worst timing error 0.9 min
- ✅ Jupiter–Saturn great conjunction 2020-12-21 (0.10°): JD 2459205.26, 6.1′

### photometry.test.mjs — passed
- ✅ mercury — V — -0.20 — Horizons — -0.202 — Δ +0.000
- ✅ venus — V — -4.80 — Horizons — -4.804 — Δ +0.000
- ✅ mars — V — 1.15 — Horizons — 1.069 — Δ +0.083
- ✅ jupiter — V — -1.85 — Horizons — -1.854 — Δ +0.000
- ✅ saturn — V — 0.37 — Horizons — 0.375 — Δ -0.004
- ✅ uranus — V — 5.74 — Horizons — 5.662 — Δ +0.081
- ✅ neptune — V — 7.68 — Horizons — 7.679 — Δ +0.001
- ✅ moon — V — -12.17 — Horizons -12.152 — Δ -0.020

### data.test.mjs — passed
- ✅ Hermite interpolation, daily samples, Earth-like orbit — worst 0.039 km
- ✅ Small-body data present and fresh (< 6 months) — updated 2026-09-25 (46.4 d ago, full); 50000 asteroids, 42531 NEOs (2549 PHA), 645 comets, 3 interstellar, 8 dwarfs, 43470 close approaches, 14 Horizons tracks
- ➖ GPU Kepler solver vs float64 CPU (render-target readback) — needs WebGL (runs in the browser Verify panel)
- ✅ Horizons vector interpolation (cubic Hermite, leave-one-out) — Apophis, predicting each sample from neighbours 2 steps apart (an upper bound): geocentric 10 min: ≤ 0.13 km; heliocentric 360 min: ≤ 106.86 km; heliocentric 1440 min: ≤ 3.72 km; heliocentric 1440 min: ≤ 1.50 km
- ✅ Halley's Comet perihelion 1986-02-09, ~0.586 AU — Horizons vectors: perihelion 1986-02-09 11:00 UTC at 0.5871 AU
- ✅ Hale-Bopp perihelion 1997-04-01, ~0.914 AU — Horizons vectors: perihelion 1997-04-01 03:10 UTC at 0.9142 AU
- ✅ ʻOumuamua perihelion 2017-09-09, ~0.256 AU — 'Oumuamua (A/2017 U1): two-body perihelion from current elements 2017-09-09 12:09 UTC at q = 0.2559 AU (e = 1.2011)
- ✅ Apophis closest approach 2029-04-13, ~38,000 km (inside GEO) — Horizons vectors: 38011 km from Earth's center at 2029-04-13 21:45 UTC (GEO radius 42,164 km)
- ✅ Kirkwood gaps emerge in the main-belt semi-major axes — 40,448 main-belt asteroids; density in gap ÷ neighbours: 3:1 0.00, 5:2 0.00, 7:3 0.20, 2:1 0.00 (gap if < 0.35)
- ✅ Jupiter Trojans cluster at L4/L5 (±60° from Jupiter) — 8,015 Trojans: L4 (leading) 4788 with median Δλ = 62.1°, L5 (trailing) 3227 with median -61.6°; 99.7% within 20–100° of Jupiter
- ✅ Plutinos pile up in the 3:2 Neptune resonance (a ≈ 39.4 AU) — 8,341 TNOs/Centaurs; density at 39.2–39.7 AU is 6.4× the neighbouring bins (resonance if > 3)
- ✅ DART changed Dimorphos' orbital period (−33 min) — sim period 11.921 h before → 11.367 h after the 2022-09-26 impact: Δ = -33.2 min (published −33.24 ± 1.6 min, Naidu 2024)
- ➖ Named asteroids & dwarf planets modelled — browser only
- ✅ Perseids: Earth crosses the 109P stream ~08/12 — closest 2026-08-12 10:37 UTC (-0.1 d vs peak) at 0.0004 AU from the parent orbit; radiant RA 45.8°, Dec 57.7° (1.2° from IMO 48°, 58°); v_g 59.4 km/s (IMO 59)
- ✅ Orionids: Earth crosses the 1P stream ~10/21 — closest 2026-10-25 19:53 UTC (+4.3 d vs peak) at 0.1504 AU from the parent orbit; radiant RA 97.8°, Dec 19.4° (4.3° from IMO 95°, 16°); v_g 65.7 km/s (IMO 66)
- ✅ Eta Aquariids: Earth crosses the 1P stream ~05/06 — closest 2026-05-07 10:04 UTC (+0.9 d vs peak) at 0.0747 AU from the parent orbit; radiant RA 337.4°, Dec 1.2° (2.3° from IMO 338°, -1°); v_g 66.5 km/s (IMO 66)
- ✅ Leonids: Earth crosses the 55P stream ~11/17 — closest 2026-11-17 17:34 UTC (+0.2 d vs peak) at 0.0081 AU from the parent orbit; radiant RA 153.4°, Dec 21.8° (1.3° from IMO 152°, 22°); v_g 70.8 km/s (IMO 71)
- ✅ Geminids: Earth crosses the Phaethon stream ~12/14 — closest 2026-12-14 21:02 UTC (+0.4 d vs peak) at 0.0187 AU from the parent orbit; radiant RA 114.7°, Dec 32.7° (2.2° from IMO 112°, 33°); v_g 33.8 km/s (IMO 35)
- ✅ Interstellar objects: hyperbolic excess speed v∞ and ʻOumuamua radiant — 'Oumuamua 26.4 km/s (expect 26.3); C/2019 Q4 32.3 km/s (expect 32.3); C/2025 N1 58.0 km/s (expect 58); ʻOumuamua came from RA 279.6°, Dec 33.9° (0.2° from the published 279.8°, +33.9°, near Vega)
- ✅ Dust tail curves behind the orbital motion (syndyne/synchrone model) — NEOWISE on 2020-07-20 (17 d after perihelion): synchrone angle from the anti-sunward ion-tail axis 4 d → 8° trailing, 13 d → 37° trailing, 30 d → 99° trailing, 60 d → 129° trailing — curves steadily toward −v

### satellites.test.mjs — passed
- ✅ ISS: SGP4 + TEME→ecliptic vs JPL Horizons — mean 0.224 km, worst 0.447 km over 121 states (±1.3 d from the element epoch)
- ✅ TDB passed as UTC is detectably wrong — 530 km off — the layer must convert TDB → UTC
- ✅ TEME→ecliptic matrix is a proper rotation — max \|TTᵀ − I\| 5.6e-17, det 1.000000000000
- ✅ True scale: ISS altitude preserved — \|scene\| = 6790.000 km for \|rel\| = 6790 km
- ✅ Visual scale: satellite outside the enlarged Earth — \|scene\| = 1.150 × the drawn radius
- ✅ Duplicate object keeps the priority group — group = stations
- ✅ Validity window (fresh ≤ 3 d, approximate ≤ 30 d, hidden beyond) — fresh, fresh, approx, expired
- ✅ data/satellites.json: every object propagates at its epoch — 959 / 959 records, 0 failed

### mcp.test.mjs — passed
- ✅ initialize — protocol 2025-06-18, server sol-simulator, instructions 889 chars
- ✅ tools/list — 24 tools
- ✅ find_eclipses: 2026-08-12 total solar eclipse — annular 2026-02-17T12:12:41Z, total 2026-08-12T17:46:22Z
- ✅ satellite_state ISS — ISS (ZARYA) at 423.55 km over -27.6584, 122.0436
- ✅ tool error → isError result (not a protocol error) — Error: Unknown body "Vulcan". Known: sun, mercury, venus, ea
- ✅ unknown method → JSON-RPC −32601 — Method not found: no/such/method
- ✅ ping — {}
- ✅ stdout carries only JSON-RPC — clean

