# Changelog

## 2026-11-11 — Accuracy overhaul, friendlier interface, satellite models

This release was made with [Claude](https://claude.com/claude-code) (Anthropic's AI model, running in Claude Code), which audited the simulator against JPL Horizons, found the errors below, fixed them, and reworked the interface for first-time visitors.

### Accuracy

Every figure is the worst error against JPL Horizons (DE441) over 160 dates from 1800 to 2050.

| Body | Before | After | What changed |
|---|---|---|---|
| Saturn | 738″ (5 million km) | 0.64″ | VSOP87A theory replaces the simplified mean elements |
| Jupiter | 494″ | 0.55″ | same |
| Uranus, Neptune | 121″, 60″ | 1.8″, 2.2″ | same |
| Mercury, Venus, Earth, Mars | 22–92″ | under 0.5″ | same |
| Pluto | 56″ | 0.02″ | interpolated from a JPL Horizons table |
| Moon | 178″ (343 km) | 11″ (20 km), typically 3″ | fixed a sign error in the ecliptic-of-date to J2000 conversion |

Major moons, worst error over 80 independent dates from 1850 to 2050:

| Moon | Before | After |
|---|---|---|
| Mimas | 3.4° | 0.32° |
| Phobos | 1.1° | 0.25° |
| Callisto | 0.8° | 0.05° |
| Umbriel | 0.8° | 0.15° |

The moon fitter (`tools/fit-moons.mjs`) was getting the eccentricity and apsidal rate wrong because its sparse sampling aliased them. It now samples dense windows, fits the radius as well as the longitude, and scans the apsidal rate on the radius alone. All 20 moons are now within 0.5°.

Known limits: Enceladus (0.31°) and Triton (0.48°) did not improve; Io and Europa are right in direction but up to 0.4% and 1% off in distance from Jupiter.

- New `tests/accuracy.test.mjs`, part of `npm test`, holds every planet, the Moon and all 20 moons to limits about twice the measured error.
- The in-app Verify check for Mars and Jupiter is tightened from 1° to 0.01°.
- Accuracy statements in the README, install guide and AI tools now quote the measured figures.
- Satellite data refreshed.

### Interface

- A welcome card on first visit with four things to try; the new **?** button reopens it.
- The top-left panel shows only the date, time speed, target and distance; the technical readouts are behind **More details**.
- Satellite orbit paths are off by default, so Earth is no longer buried in lines (switch them on under Settings → Satellites).
- Larger text and buttons, and labels no longer draw over the panels.
- A search box for the body list; it also finds Earth satellites by name.
- Settings start collapsed.
- Times are shown in your local time zone by default, with a Local/UTC switch.
- Phone layout: a body picker, a settings button, a folding fact panel, an on-screen flight pad, drag to steer and pinch to zoom.

### Models

- New satellite models: Hubble, the Tiangong station, Dragon, Soyuz-type ferries, navigation satellites (GPS, Galileo, GLONASS, BeiDou), geostationary comsats and spent rocket stages. Other satellites keep the generic model.
- New ship in the ship list: Enterprise NCC-1701 (a fan-made model).

### New tools

- `tools/build-vsop87.mjs` builds `js/data/vsop87a.js` from the IMCCE VSOP87 files.
- `tools/build-pluto.mjs` builds `js/data/plutoTrack.js` from JPL Horizons.
- `tools/fetch-accuracy-fixtures.mjs` and `tools/fetch-moon-accuracy-fixtures.mjs` download the reference positions the accuracy test uses.
