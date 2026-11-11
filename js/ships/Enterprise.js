// =============================================================================
// ships/Enterprise.js — USS Enterprise NCC-1701, procedural (no files loaded).
// Model code adapted from a stand-alone Three.js viewer of the same model.
// Changes for the simulator: the whole model is built inside buildModel() so every
// build owns its materials and geometry (the controller disposes them on a ship
// change); the viewer's point lights and glow sprites are removed (the Sun lights
// the ship, and sprites would inflate the bounding box used to size it); the
// panel seams darken the hull instead of being light grey (they are unlit lines); the
// warp-chamber shader writes logarithmic depth; and every glow is pre-divided by
// exposure like the rest of the ship's HDR lights.
// Axis convention: +X = bow, +Y = up, +Z = starboard. Units are metres.
// Reference figures: 288.6 m overall, saucer 127 m, nacelles 153.6 m x 17.3 m,
// secondary hull 104 m x 34 m. Origin = centre of the saucer, on the rim mid-plane.
// =============================================================================
import * as THREE from 'three';

function buildModel() {
  // ---- editable proportions --------------------------------------------------
  const SAUCER_RADIUS       = 63.5;   // primary hull radius
  const SAUCER_THICKNESS    = 19.2;   // underside platform to upper surface (no bridge / sensor dome)
  const ENGINEERING_LENGTH  = 104;    // secondary hull, deflector rim to shuttle-bay end
  const ENGINEERING_RADIUS  = 17;     // secondary hull maximum radius
  const ENGINEERING_FRONT_X = -44;    // deflector rim, aft of saucer centre
  const NECK_HEIGHT         = 36;     // saucer rim plane down to secondary hull axis
  const NACELLE_LENGTH      = 153.6;
  const NACELLE_RADIUS      = 8.65;
  const NACELLE_SPACING     = 53;     // centreline to centreline
  const NACELLE_HEIGHT      = 10.7;   // nacelle axis above saucer rim plane
  const NACELLE_FRONT_X     = -71.5;   // dome tip, aft of saucer centre
  const PYLON_X             = -115;   // pylon root (mid chord) on the secondary hull

  // Classic NCC-1701: red-orange Bussard domes at the FRONT of each nacelle.
  // (Set to 0x6fb8ff / 0x2a7fff for a blue-white forward section instead.)
  const BUSSARD_COLOR       = 0xff6a2a;
  const BUSSARD_EMISSIVE    = 0xff3c0c;

  const SR = SAUCER_RADIUS / 63.5;        // saucer radial scale
  const SY = SAUCER_THICKNESS / 19.2;     // saucer vertical scale
  const HL = ENGINEERING_LENGTH / 104;    // hull length scale
  const HR = ENGINEERING_RADIUS / 17;     // hull radius scale
  const NL = NACELLE_LENGTH / 153.6;
  const NR = NACELLE_RADIUS / 8.65;
  const HULL_Y = -NECK_HEIGHT;

  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const DEG = Math.PI / 180;

  // ---- small utilities -------------------------------------------------------
  function mulberry32(a) {
    return () => {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(1701);
  const lerp = (a, b, t) => a + (b - a) * t;

  /** piecewise-linear lookup through [[x, y], ...] sorted by x */
  function linear1D(pts) {
    return (x) => {
      if (x <= pts[0][0]) return pts[0][1];
      for (let i = 0; i < pts.length - 1; i++) {
        if (x <= pts[i + 1][0]) {
          const s = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
          return lerp(pts[i][1], pts[i + 1][1], s);
        }
      }
      return pts[pts.length - 1][1];
    };
  }
  /** smooth (Catmull-Rom) lookup through [[x, y], ...] sorted by x */
  function curve1D(pts) {
    return (x) => {
      const n = pts.length;
      if (x <= pts[0][0]) return pts[0][1];
      if (x >= pts[n - 1][0]) return pts[n - 1][1];
      let i = 0;
      while (x > pts[i + 1][0]) i++;
      const s = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      const p0 = pts[Math.max(i - 1, 0)][1], p1 = pts[i][1], p2 = pts[i + 1][1], p3 = pts[Math.min(i + 2, n - 1)][1];
      return 0.5 * ((2 * p1) + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s);
    };
  }

  // ---- hull shape functions (shared by geometry, windows, decals) ------------
  // Saucer profile: [radius, y]. Bottom runs centre -> rim, top runs rim -> centre.
  const SAUCER_BOTTOM = [
    [0, -12.4], [7.5, -12.4], [8.5, -11.6], [15, -10.9], [21, -9.9], [22.5, -8.7], [30, -7.7],
    [40, -6.2], [49, -4.8], [50.5, -3.9], [57, -3.2], [61.5, -2.5], [62.9, -2.0], [63.5, -1.3],
  ].map(([r, y]) => [r * SR, y * SY]);
  const SAUCER_TOP = [
    [63.5, 1.3], [62.9, 2.0], [61.5, 2.4], [50, 3.5], [40, 4.5], [30, 5.5], [22, 6.3], [12, 6.7], [0, 6.8],
  ].map(([r, y]) => [r * SR, y * SY]);
  const saucerBottomY = linear1D(SAUCER_BOTTOM);
  const saucerTopY = linear1D([...SAUCER_TOP].reverse());
  const RIM_Y = 1.3 * SY;

  /** point + outward normal on the saucer skin */
  function saucerPoint(r, theta, top, lift = 0) {
    const f = top ? saucerTopY : saucerBottomY;
    const d = (f(r + 0.25) - f(r - 0.25)) / 0.5;
    const rh = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
    const n = top ? rh.clone().multiplyScalar(-d).add(Y) : rh.clone().multiplyScalar(d).sub(Y);
    n.normalize();
    const pos = new THREE.Vector3(r * Math.cos(theta), f(r), r * Math.sin(theta)).addScaledVector(n, lift);
    return { pos, normal: n, radial: rh };
  }

  // Secondary hull: radius along its length t (0 = deflector rim, L = shuttle bay)
  const hullR = (() => {
    const f = curve1D([[0, 11.5], [3, 13.2], [8, 15], [15, 16.5], [24, 17], [36, 16.8], [50, 15.8],
      [65, 14.0], [80, 11.6], [92, 9.6], [100, 8.4], [104, 7.6]]);
    return (t) => f(t / HL) * HR;
  })();
  // The top line of the hull stays nearly level while the keel sweeps up aft.
  const hullCY = (t) => (t / HL > 24 ? Math.max(0, ENGINEERING_RADIUS - hullR(t)) * 0.8 : 0);
  function hullPoint(t, alpha, side, lift = 0) {
    const r = hullR(t) + lift;
    return {
      pos: new THREE.Vector3(ENGINEERING_FRONT_X - t, HULL_Y + hullCY(t) + r * Math.sin(alpha), side * r * Math.cos(alpha)),
      normal: new THREE.Vector3(0, Math.sin(alpha), side * Math.cos(alpha)),
    };
  }

  // Nacelle: radius along its length t (0 = dome tip, L = aft end)
  const nacR = (() => {
    const f = linear1D([[8, 8.65], [60, 8.65], [100, 7.8], [140, 6.6], [147.6, 6.3]]);
    return (t) => f(t / NL) * NR;
  })();
  /** point on a nacelle; alpha = 0 is the outboard equator, +90deg is the top */
  function nacellePoint(t, alpha, side, lift = 0) {
    const r = nacR(t) + lift;
    return {
      pos: new THREE.Vector3(NACELLE_FRONT_X - t, NACELLE_HEIGHT + r * Math.sin(alpha), side * (NACELLE_SPACING / 2 + r * Math.cos(alpha))),
      normal: new THREE.Vector3(0, Math.sin(alpha), side * Math.cos(alpha)),
    };
  }

  // Neck (dorsal): horizontal lens sections, h = 0 at the hull, 1 inside the saucer
  const NECK = {
    y0: HULL_Y + ENGINEERING_RADIUS - 3, y1: -1.0,
    lead0: ENGINEERING_FRONT_X - 6, lead1: -40 * SR,
    trail0: ENGINEERING_FRONT_X - 36, trail1: -58 * SR,
    w0: 3.7, w1: 3.2,
  };
  function neckSection(h) {
    const lead = lerp(NECK.lead0, NECK.lead1, h), trail = lerp(NECK.trail0, NECK.trail1, h);
    return { y: lerp(NECK.y0, NECK.y1, h), cx: (lead + trail) / 2, a: (lead - trail) / 2, b: lerp(NECK.w0, NECK.w1, h) };
  }

  // ---- materials (shared) ----------------------------------------------------
  const M = {
    hull:    new THREE.MeshStandardMaterial({ color: 0xc6cacc, roughness: 0.56, metalness: 0.22 }),
    hull2:   new THREE.MeshStandardMaterial({ color: 0xb4b9bc, roughness: 0.6, metalness: 0.25 }),
    hull3:   new THREE.MeshStandardMaterial({ color: 0xa3a8ac, roughness: 0.62, metalness: 0.28 }),
    dark:    new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.7, metalness: 0.4 }),
    darker:  new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.8, metalness: 0.3, side: THREE.DoubleSide }),
    copper:  new THREE.MeshStandardMaterial({ color: 0xb07a48, roughness: 0.4, metalness: 0.65, emissive: 0x2a7fff, emissiveIntensity: 0.3, side: THREE.DoubleSide }),
    emitter: new THREE.MeshStandardMaterial({ color: 0xbfe0ff, roughness: 0.3, metalness: 0.2, emissive: 0x4aa0ff, emissiveIntensity: 1.5 }),
    dome:    new THREE.MeshStandardMaterial({ color: BUSSARD_COLOR, roughness: 0.22, metalness: 0.0, emissive: BUSSARD_EMISSIVE, emissiveIntensity: 0.85, transparent: true, opacity: 0.7, depthWrite: false }),
    domeCore:new THREE.MeshStandardMaterial({ color: 0xffd9a0, roughness: 0.5, emissive: 0xffa040, emissiveIntensity: 2.4 }),
    engine:  new THREE.MeshStandardMaterial({ color: 0xff7a30, roughness: 0.4, emissive: 0xff3a10, emissiveIntensity: 2.2 }),
    sensor:  new THREE.MeshStandardMaterial({ color: 0xf2f0dc, roughness: 0.3, emissive: 0xfff2c0, emissiveIntensity: 0.9 }),
    bridge:  new THREE.MeshStandardMaterial({ color: 0xe6e8ea, roughness: 0.35, metalness: 0.1, emissive: 0xdfe8ff, emissiveIntensity: 0.25 }),
    navRed:  new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xff1010, emissiveIntensity: 3 }),
    navGreen:new THREE.MeshStandardMaterial({ color: 0x30ff60, emissive: 0x10ff40, emissiveIntensity: 3 }),
    navWhite:new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 }),
    panel:   new THREE.MeshStandardMaterial({ color: 0x9da2a6, roughness: 0.65, metalness: 0.25 }),
    markRed: new THREE.MeshStandardMaterial({ color: 0xb02a22, roughness: 0.7 }),
    markYel: new THREE.MeshStandardMaterial({ color: 0xd9b23a, roughness: 0.7 }),
    seam:    new THREE.LineBasicMaterial({ color: 0x70767b, transparent: true, opacity: 0.5 }),
    window:  new THREE.MeshBasicMaterial({ color: 0xffffff }),
  };

  // warp energy chamber: emissive shader with a wave travelling aft
  const chamberUniforms = { uTime: { value: 0 }, uOn: { value: 1 }, uGain: { value: 1 } };
  M.chamber = new THREE.ShaderMaterial({
    uniforms: chamberUniforms,
    vertexShader: `#include <common>
  #include <logdepthbuf_pars_vertex>
  varying float vX;
  void main(){ vX = position.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  #include <logdepthbuf_vertex>
  }`,
    fragmentShader: `#include <common>
  #include <logdepthbuf_pars_fragment>
  uniform float uTime; uniform float uOn; uniform float uGain; varying float vX;
      void main(){
  #include <logdepthbuf_fragment>
        float w = 0.5 + 0.5 * sin(vX * 0.38 + uTime * 1.6);
        float p = 0.8 + 0.2 * sin(uTime * 1.1);
        vec3 c = mix(vec3(0.10, 0.38, 1.0), vec3(0.85, 0.95, 1.0), w * w);
        gl_FragColor = vec4((c * p * uOn * 1.5 + vec3(0.015, 0.02, 0.035)) * uGain, 1.0);
      }`,
  });

  // things the animation loop / UI toggles need
  const FX = { glowMats: [], glowLights: [], glowSprites: [], shipLights: [], fans: [], windows: null, windowBase: null };
  function registerGlow(mat) { FX.glowMats.push({ mat, base: mat.emissiveIntensity }); return mat; }
  [M.copper, M.emitter, M.dome, M.domeCore, M.engine].forEach(registerGlow);

  // ---- geometry helpers ------------------------------------------------------
  /**
   * Skin a sequence of closed rings (arrays of Vector3, equal length).
   * Rings must advance along a direction d with their points running
   * counter-clockwise when looking along d — then the skin faces outward.
   */
  function ringLoft(rings, { capStart = false, capEnd = false } = {}) {
    const n = rings[0].length, pos = [], uv = [], idx = [];
    rings.forEach((ring, i) => {
      for (let j = 0; j <= n; j++) {
        const p = ring[j % n];
        pos.push(p.x, p.y, p.z);
        uv.push(j / n, i / (rings.length - 1));
      }
    });
    const w = n + 1;
    for (let i = 0; i < rings.length - 1; i++) {
      for (let j = 0; j < n; j++) {
        const a = i * w + j, b = a + 1, c = a + w, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const cap = (ring, flip) => {
      const c = new THREE.Vector3();
      ring.forEach((p) => c.add(p));
      c.multiplyScalar(1 / n);
      const base = pos.length / 3;
      pos.push(c.x, c.y, c.z); uv.push(0.5, 0.5);
      ring.forEach((p) => { pos.push(p.x, p.y, p.z); uv.push(0.5, 0.5); });
      for (let j = 0; j < n; j++) {
        const p = base + 1 + j, q = base + 1 + (j + 1) % n;
        flip ? idx.push(base, q, p) : idx.push(base, p, q);
      }
    };
    if (capStart) cap(rings[0], false);
    if (capEnd) cap(rings[rings.length - 1], true);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    // weld normals across the u seam
    const nrm = g.attributes.normal;
    for (let i = 0; i < rings.length; i++) {
      const a = i * w, b = a + n;
      const x = nrm.getX(a) + nrm.getX(b), y = nrm.getY(a) + nrm.getY(b), z = nrm.getZ(a) + nrm.getZ(b);
      const l = Math.hypot(x, y, z) || 1;
      nrm.setXYZ(a, x / l, y / l, z / l); nrm.setXYZ(b, x / l, y / l, z / l);
    }
    return g;
  }

  /** body of revolution about the X axis; stations run bow -> stern: {x, r, y?} */
  function loftX(stations, radial = 48, caps = {}) {
    const rings = stations.map((s) => {
      const ring = [];
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        ring.push(new THREE.Vector3(s.x, (s.y || 0) + s.r * Math.cos(a), s.r * Math.sin(a)));
      }
      return ring;
    });
    return ringLoft(rings, caps);
  }

  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1),
    disc: new THREE.CylinderGeometry(1, 1, 1, 24).rotateX(Math.PI / 2),   // axis = local Z
    hemi: new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), // bulges +Z
    sphere: new THREE.SphereGeometry(1, 24, 16),
  };
  const cylX = (r1, r2, len, seg = 40, open = false) => new THREE.CylinderGeometry(r1, r2, len, seg, 1, open).rotateZ(-Math.PI / 2); // r1 at +X end
  const torusX = (R, tube, seg = 64) => new THREE.TorusGeometry(R, tube, 8, seg).rotateY(Math.PI / 2);
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

  /** place an object on a surface: local +Z along the outward normal */
  function orient(obj, pos, normal, up = Y) {
    obj.position.copy(pos);
    obj.up.copy(up);
    obj.lookAt(pos.clone().add(normal));
    return obj;
  }

  /** soft radial glow sprite (shared texture) */
  const glowTexture = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.1)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  function glowSprite(color, size, opacity = 0.6) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.setScalar(size);
    FX.glowSprites.push({ sprite: s, base: opacity });
    return s;
  }
  function glowLight(color, intensity, distance, x, y, z) {
    const l = new THREE.PointLight(color, intensity, distance, 1.2);
    l.position.set(x, y, z);
    FX.glowLights.push({ light: l, base: intensity });
    return l;
  }

  // ---- reusable detail builders ---------------------------------------------
  /** recessed maintenance panel: a thin, slightly darker plate (local +Z = out) */
  function createHullPanel(w, h, mat = M.panel) {
    const m = new THREE.Mesh(GEO.box, mat);
    m.scale.set(w, h, 0.08);
    return m;
  }
  /** circular access panel */
  function createAccessPanel(r, mat = M.panel) {
    const m = new THREE.Mesh(GEO.disc, mat);
    m.scale.set(r, r, 0.08);
    return m;
  }
  /** small sensor blister */
  function createSensor(r = 0.6, mat = M.sensor) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(GEO.disc, M.dark); base.scale.set(r * 1.5, r * 1.5, 0.2);
    const dome = new THREE.Mesh(GEO.hemi, mat); dome.scale.setScalar(r); dome.position.z = 0.1;
    g.add(base, dome);
    return g;
  }
  /** twin phaser emitter on a small base plate */
  function createPhaserBank() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(GEO.disc, M.hull3); base.scale.set(1.5, 0.85, 0.22);
    g.add(base);
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(GEO.hemi, M.dark); e.scale.set(0.42, 0.42, 0.5); e.position.set(s * 0.65, 0, 0.1);
      g.add(e);
    }
    return g;
  }
  /** row of collar rings around the warp energy chamber (one InstancedMesh) */
  function createEngineRing(count, spacing, radius) {
    const geo = torusX(radius, radius * 0.14, 20);
    const inst = new THREE.InstancedMesh(geo, M.dark, count);
    const d = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      d.position.set((i - (count - 1) / 2) * spacing, 0, 0);
      d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
    }
    return inst;
  }

  // panel seams are collected into a single LineSegments object
  const seamPositions = [];
  function seamPolyline(points, closed = false) {
    for (let i = 0; i < points.length - 1; i++) seamPositions.push(...points[i].toArray(), ...points[i + 1].toArray());
    if (closed) seamPositions.push(...points[points.length - 1].toArray(), ...points[0].toArray());
  }
  /** concentric seam on the saucer skin */
  function createPanelRing(r, top) {
    const pts = [];
    for (let i = 0; i < 96; i++) pts.push(saucerPoint(r, (i / 96) * Math.PI * 2, top, 0.05).pos);
    seamPolyline(pts, true);
  }

  // windows are collected and emitted as a single InstancedMesh
  const windowList = [];
  /** queue a row of windows: items = [{pos, normal, up?}] */
  function createWindowRow(items, w = 0.95, h = 0.5) {
    for (const it of items) windowList.push({ ...it, w, h });
  }
  function buildWindows() {
    const inst = new THREE.InstancedMesh(GEO.box, M.window, windowList.length);
    const d = new THREE.Object3D(), c = new THREE.Color();
    FX.windowBase = new Float32Array(windowList.length * 3);
    windowList.forEach((wn, i) => {
      orient(d, wn.pos, wn.normal, wn.up || Y);
      d.scale.set(wn.w, wn.h, 0.14);
      d.updateMatrix(); inst.setMatrixAt(i, d.matrix);
      const b = 0.55 + 0.45 * rnd(), cool = rnd() < 0.3;
      c.setRGB(b * (cool ? 0.82 : 1.0), b * (cool ? 0.92 : 0.96), b * (cool ? 1.0 : 0.82));
      FX.windowBase.set([c.r, c.g, c.b], i * 3);
      inst.setColorAt(i, c);
    });
    inst.name = 'WindowInstances';
    FX.windows = inst;
    return inst;
  }

  // ---- hull lettering --------------------------------------------------------
  const FONT = '"Eurostile Extended", "Microgramma D Extended", "Bank Gothic", "Arial Black", "Arial", sans-serif';
  /** black hull lettering on a transparent canvas, stretched to fill the decal */
  function textTexture(text, aspect, { draw } = {}) {
    const H = 256, W = Math.min(4096, Math.round(H * aspect));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    if (draw) draw(g, W, H);
    else drawText(g, text, 0, 0, W, H);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  function drawText(g, text, x, y, w, h, color = '#14161a') {
    g.save();
    g.fillStyle = color;
    g.font = `900 ${h}px ${FONT}`;
    if ('letterSpacing' in g) g.letterSpacing = `${h * 0.14}px`;
    g.textBaseline = 'alphabetic';
    const m = g.measureText(text);
    const tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const pad = h * 0.06;
    g.translate(x + pad, y + pad);
    g.scale((w - 2 * pad) / tw, (h - 2 * pad) / th);
    g.fillText(text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent);
    g.restore();
  }
  /**
   * Decal that follows a surface. fn(u, v) -> Vector3 where u runs along the
   * reading direction and v runs up the letters; the decal then faces the reader.
   */
  function createDecal(fn, texture, nu = 48, nv = 6) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const p = fn(i / nu, j / nv);
      pos.push(p.x, p.y, p.z); uv.push(i / nu, j / nv);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
      map: texture, transparent: true, roughness: 0.75, metalness: 0.05,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    }));
    m.userData.decal = true;
    m.renderOrder = 2;
    return m;
  }

  // ==========================================================================
  //  COMPONENTS
  // ==========================================================================
  function createSaucer() {
    const g = new THREE.Group(); g.name = 'Saucer';
    const pts = [...SAUCER_BOTTOM, ...SAUCER_TOP].map(([r, y]) => new THREE.Vector2(r, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), M.hull);
    body.name = 'SaucerHull';
    g.add(body);

    // recessed perimeter band between the two rim window rows + separation line
    g.add(mesh(new THREE.CylinderGeometry(SAUCER_RADIUS + 0.03, SAUCER_RADIUS + 0.03, 0.22, 96, 1, true), M.hull3, 0, 0, 0));
    // layered upper deck: teardrop superstructure (decks 2-3), tail pointing aft
    const R = 11 * SR, tail = -24 * SR, phi = Math.acos(R / tail);
    const s = new THREE.Shape();
    s.moveTo(tail, 0);
    s.lineTo(R * Math.cos(-phi), R * Math.sin(-phi));
    s.absarc(0, 0, R, -phi, phi, false);
    s.closePath();
    const tear = new THREE.ExtrudeGeometry(s, { depth: 3.0 * SY, bevelEnabled: true, bevelSize: 0.7, bevelThickness: 0.6, bevelSegments: 3, curveSegments: 40 });
    tear.rotateX(-Math.PI / 2);
    const td = mesh(tear, M.hull2, 0, 6.4 * SY, 0); td.name = 'UpperDeck';
    g.add(td);
    // underside: stepped lower platform ring around the sensor dome
    g.add(mesh(new THREE.CylinderGeometry(5.2 * SR, 6.4 * SR, 0.9, 48), M.hull2, 0, -12.4 * SY - 0.45, 0));
    // underside concentric raised ring (construction layer)
    g.add(mesh(new THREE.TorusGeometry(22.2 * SR, 0.45, 8, 96).rotateX(Math.PI / 2), M.hull2, 0, saucerBottomY(22.2 * SR) + 0.1, 0));
    return g;
  }

  function createBridge() {
    const g = new THREE.Group(); g.name = 'Bridge';
    const y0 = 6.4 * SY + 3.0 * SY + 0.6;                       // top of the teardrop deck
    g.add(mesh(new THREE.CylinderGeometry(5.0, 5.7, 1.6, 48), M.hull, 0, y0 + 0.8, 0));   // surrounding deck structure
    g.add(mesh(new THREE.TorusGeometry(5.35, 0.14, 6, 48).rotateX(Math.PI / 2), M.hull3, 0, y0 + 0.85, 0));
    const dome = mesh(new THREE.SphereGeometry(4.0, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.bridge, 0, y0 + 1.6, 0);
    dome.scale.y = 0.72; dome.name = 'BridgeDome';
    g.add(dome);
    // turbolift housing at the back of the dome
    g.add(mesh(new THREE.CylinderGeometry(1.0, 1.1, 2.4, 16), M.hull2, -3.9, y0 + 1.9, 0));
    g.userData.topY = y0 + 1.6 + 4.0 * 0.72;
    g.userData.deckY = y0;
    return g;
  }

  function createEngineeringHull() {
    const g = new THREE.Group(); g.name = 'EngineeringHull';
    const st = [];
    for (let i = 0; i <= 80; i++) {
      const t = (ENGINEERING_LENGTH * i) / 80;
      st.push({ x: ENGINEERING_FRONT_X - t, r: hullR(t), y: HULL_Y + hullCY(t) });
    }
    const body = new THREE.Mesh(loftX(st, 64, { capEnd: true }), M.hull); body.name = 'SecondaryHull';
    g.add(body);
    // recessed deflector housing: dark cone running back inside the bow opening
    const r0 = hullR(0) - 0.15;
    const housing = new THREE.Mesh(loftX([
      { x: ENGINEERING_FRONT_X, r: r0, y: HULL_Y }, { x: ENGINEERING_FRONT_X - 2.5, r: r0 * 0.74, y: HULL_Y },
      { x: ENGINEERING_FRONT_X - 5, r: r0 * 0.42, y: HULL_Y },
    ], 48, { capEnd: true }), M.darker);
    housing.name = 'DeflectorHousing';
    g.add(housing);
    g.add(mesh(torusX(hullR(0) - 0.05, 0.42), M.hull3, ENGINEERING_FRONT_X, HULL_Y, 0));       // bow lip
    // recessed engineering detail: dark trench band on the keel + strongback on the spine
    for (const [t0, t1, a, w] of [[58, 96, 90, 2.6]]) {
      const mid = (t0 + t1) / 2 * HL, p = hullPoint(mid, a * DEG, 1, -0.12);
      const slope = (hullPoint(t1 * HL, a * DEG, 1).pos.y - hullPoint(t0 * HL, a * DEG, 1).pos.y) / ((t1 - t0) * HL);
      const b = mesh(GEO.box, M.hull3, p.pos.x, p.pos.y, 0);
      b.scale.set((t1 - t0) * HL, 0.5, w); b.rotation.z = -Math.atan(slope);
      g.add(b);
    }
    return g;
  }

  function createNeck() {
    const g = new THREE.Group(); g.name = 'Neck';
    const rings = [];
    for (let i = 0; i <= 10; i++) {
      const s = neckSection(i / 10), ring = [];
      for (let j = 0; j < 40; j++) {
        const p = (j / 40) * Math.PI * 2, c = Math.cos(p);
        ring.push(new THREE.Vector3(s.cx + s.a * Math.sign(c) * Math.pow(Math.abs(c), 0.8), s.y, s.b * Math.sin(p)));
      }
      rings.push(ring);
    }
    const m = new THREE.Mesh(ringLoft(rings), M.hull2); m.name = 'Dorsal';
    g.add(m);
    // blend fairing where the dorsal meets the secondary hull
    const s0 = neckSection(0.04), fair = [];
    for (const [k, dy] of [[1.28, -1.5], [1.12, 0.6], [1.0, 2.2]]) {
      const ring = [];
      for (let j = 0; j < 40; j++) {
        const p = (j / 40) * Math.PI * 2, c = Math.cos(p);
        ring.push(new THREE.Vector3(s0.cx + (s0.a + (k - 1) * 6) * Math.sign(c) * Math.pow(Math.abs(c), 0.8), s0.y + dy, s0.b * k * Math.sin(p)));
      }
      fair.push(ring);
    }
    g.add(new THREE.Mesh(ringLoft(fair), M.hull));
    return g;
  }

  /** pylon root/tip centres for one side (+1 starboard, -1 port) */
  function pylonEnds(side) {
    return {
      root: new THREE.Vector3(PYLON_X, HULL_Y + hullCY(-(PYLON_X - ENGINEERING_FRONT_X)) + 9, side * 6.5),
      tip: new THREE.Vector3(PYLON_X - 3, NACELLE_HEIGHT - 5.5 * NR, side * (NACELLE_SPACING / 2 - 4.5 * NR)),
    };
  }
  function pylonSection(side, f, chordScale = 1, thickScale = 1) {
    const { root, tip } = pylonEnds(side);
    const span = tip.clone().sub(root).normalize();
    const n = new THREE.Vector3().crossVectors(X, span).normalize();
    const c = root.clone().lerp(tip, f);
    const chord = lerp(10.5, 8.2, f) * chordScale, thick = lerp(2.4, 1.9, f) * thickScale;
    const ring = [];
    for (let j = 0; j < 28; j++) {
      const p = (j / 28) * Math.PI * 2, cs = Math.cos(p), sn = Math.sin(p);
      ring.push(c.clone()
        .addScaledVector(X, (chord / 2) * Math.sign(cs) * Math.pow(Math.abs(cs), 0.7))
        .addScaledVector(n, (thick / 2) * Math.sign(sn) * Math.pow(Math.abs(sn), 0.6)));
    }
    return ring;
  }
  function createNacellePylons() {
    const g = new THREE.Group(); g.name = 'NacellePylons';
    for (const side of [1, -1]) {
      const p = new THREE.Group(); p.name = side > 0 ? 'StarboardPylon' : 'PortPylon';
      const rings = [];
      for (let i = 0; i <= 8; i++) rings.push(pylonSection(side, i / 8));
      p.add(new THREE.Mesh(ringLoft(rings), M.hull2));
      // structural reinforcement: root and tip fairings + three seam bands
      p.add(new THREE.Mesh(ringLoft([pylonSection(side, 0.0, 1.1, 1.4), pylonSection(side, 0.14, 1.04, 1.15), pylonSection(side, 0.22, 1.0, 1.0)]), M.hull));
      p.add(new THREE.Mesh(ringLoft([pylonSection(side, 0.84, 1.0, 1.0), pylonSection(side, 0.92, 1.04, 1.15), pylonSection(side, 1.0, 1.08, 1.35)]), M.hull));
      for (const f of [0.36, 0.52, 0.68]) {
        p.add(new THREE.Mesh(ringLoft([pylonSection(side, f - 0.004, 1.004, 1.03), pylonSection(side, f + 0.004, 1.004, 1.03)]), M.dark));
      }
      g.add(p);
    }
    return g;
  }

  /** one warp nacelle; side = +1 starboard, -1 port. Dome (bow) end is at local x = 0. */
  function createNacelle(side) {
    const g = new THREE.Group(); g.name = side > 0 ? 'StarboardNacelle' : 'PortNacelle';
    g.position.set(NACELLE_FRONT_X, NACELLE_HEIGHT, side * NACELLE_SPACING / 2);
    const L = NACELLE_LENGTH, r = NACELLE_RADIUS, dr = 8 * NL;   // dome length
    const inboard = -side;

    // --- outer housing ---
    const st = [];
    for (const t of [8, 20, 40, 60, 70, 80, 90, 100, 110, 120, 130, 140, 147.6]) st.push({ x: -t * NL, r: nacR(t * NL) });
    const housing = new THREE.Mesh(loftX(st, 48, { capStart: true, capEnd: true }), M.hull); housing.name = 'Housing';
    g.add(housing);
    // structural rings
    for (const t of [14, 40, 60, 134]) g.add(mesh(torusX(nacR(t * NL) + 0.02, 0.2, 48), M.hull3, -t * NL, 0, 0));

    // --- forward section: Bussard dome with internal collector ---
    const fwd = new THREE.Group(); fwd.name = 'ForwardSection';
    fwd.add(mesh(cylX(r * 1.035, r * 1.035, 2.6 * NL, 48), M.dark, -(dr + 1.3 * NL), 0, 0));          // collar
    fwd.add(mesh(torusX(r * 1.0, 0.3, 48), M.hull3, -dr, 0, 0));
    const domeGeo = new THREE.SphereGeometry(r * 0.94, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2); // bulges +X
    const dome = mesh(domeGeo, M.dome, -dr, 0, 0); dome.scale.x = dr / (r * 0.94); dome.name = 'BussardDome'; dome.renderOrder = 3;
    const core = mesh(domeGeo, M.domeCore, -dr, 0, 0); core.scale.set(0.42 * dr / (r * 0.94), 0.8, 0.8);
    const fan = new THREE.Group(); fan.position.x = -dr + 0.46 * dr;
    for (let i = 0; i < 12; i++) {
      const blade = mesh(GEO.box, M.darker); blade.scale.set(0.25, r * 0.74, 0.5);
      const holder = new THREE.Group(); holder.rotation.x = (i / 12) * Math.PI * 2;
      blade.position.y = r * 0.4; holder.add(blade); fan.add(holder);
    }
    fan.add(mesh(GEO.sphere, M.dark).translateX(0)); fan.children[fan.children.length - 1].scale.setScalar(r * 0.14);
    FX.fans.push({ obj: fan, dir: side });
    fwd.add(core, fan, dome);
    const sp = glowSprite(BUSSARD_EMISSIVE, r * 4.2, 0.5); sp.position.set(-dr * 0.5, 0, 0); fwd.add(sp);
    fwd.add(glowLight(BUSSARD_EMISSIVE, 55, 60, 6, 0, 0));
    g.add(fwd);

    // --- warp energy chamber: recessed trench on the inboard flank ---
    const t0 = 62 * NL, t1 = 132 * NL, len = t1 - t0, tm = (t0 + t1) / 2;
    const ch = new THREE.Group(); ch.name = 'WarpChamber';
    ch.position.set(-tm, 0, inboard * (nacR(tm) - 0.35));
    ch.rotation.y = side * Math.atan((nacR(t0) - nacR(t1)) / len);
    const frame = mesh(GEO.box, M.dark); frame.scale.set(len, 3.6 * NR, 1.3);
    const bed = mesh(GEO.box, M.darker, 0, 0, inboard * 0.3); bed.scale.set(len - 1.2, 2.7 * NR, 1.0);
    const tube = mesh(cylX(1.05 * NR, 1.05 * NR, len - 2.4, 20), M.chamber, 0, 0, inboard * 0.75);
    const rings = createEngineRing(13, (len - 6) / 12, 1.22 * NR); rings.position.z = inboard * 0.75;
    for (const e of [-1, 1]) { const cap = mesh(GEO.box, M.hull3, e * (len / 2 - 0.5), 0, inboard * 0.55); cap.scale.set(1.2, 3.9 * NR, 1.6); ch.add(cap); }
    ch.add(frame, bed, tube, rings);
    ch.add(glowLight(0x4a90ff, 90, 50, 0, 0, inboard * 6));
    g.add(ch);

    // --- rear engine section ---
    const aft = new THREE.Group(); aft.name = 'RearSection';
    const ra = nacR(147.6 * NL);
    aft.add(mesh(cylX(ra * 1.05, ra * 1.02, 3.6 * NL, 40), M.dark, -143.2 * NL, 0, 0));      // exhaust housing collar
    aft.add(mesh(torusX(ra * 0.93, 0.5 * NR, 40), M.engine, -(L - 5.75 * NL), 0, 0));        // glowing exhaust ring
    const ball = mesh(new THREE.SphereGeometry(ra * 0.93, 32, 16), M.hull2, -(L - ra * 0.93), 0, 0); ball.name = 'EndCap';
    aft.add(ball);
    for (const z of [-1, 1]) {                                                               // dorsal intercooler loops
      const ic = mesh(GEO.box, M.hull3, -128 * NL, nacR(128 * NL) + 0.15, z * 2.1 * NR); ic.scale.set(15 * NL, 0.9, 1.9 * NR);
      ic.rotation.z = Math.atan((nacR(120 * NL) - nacR(136 * NL)) / (16 * NL));
      aft.add(ic);
    }
    const vent = mesh(GEO.box, M.dark, -139 * NL, 0, inboard * (nacR(139 * NL) - 0.1)); vent.scale.set(5 * NL, 2.2 * NR, 0.5);  // mechanical vent
    aft.add(vent);
    const asp = glowSprite(0xff4a18, ra * 3.2, 0.3); asp.position.set(-(L - 5.75 * NL), 0, 0); aft.add(asp);
    g.add(aft);
    return g;
  }

  function createDeflector() {
    const g = new THREE.Group(); g.name = 'Deflector';
    g.position.set(ENGINEERING_FRONT_X, HULL_Y, 0);
    const s = HR, base = 1.5 * s;                               // dish stands on its stalk in the mouth of the housing
    g.add(mesh(cylX(1.5 * s, 1.9 * s, 6.5 * s, 20), M.dark, base - 3.25 * s, 0, 0));           // mounting stalk
    [[6.2, -1.8], [4.8, -1.2], [3.4, -0.6]].forEach(([r, x]) =>                             // stepped rings behind the dish
      g.add(mesh(cylX(r * s, r * s, 0.6 * s, 40), M.hull3, base + x * s, 0, 0)));
    const pts = [];
    for (let i = 0; i <= 14; i++) { const r = (i / 14) * 7.6 * s; pts.push(new THREE.Vector2(r, 1.9 * s * Math.pow(i / 14, 2))); }
    const dish = mesh(new THREE.LatheGeometry(pts, 56).rotateZ(-Math.PI / 2), M.copper, base, 0, 0); dish.name = 'Dish';
    g.add(dish);
    g.add(mesh(torusX(7.6 * s, 0.26 * s, 56), M.dark, base + 1.9 * s, 0, 0));                 // outer ring
    for (const r of [2.6, 5.1]) g.add(mesh(torusX(r * s, 0.09 * s, 40), M.dark, base + 1.9 * s * Math.pow(r / 7.6, 2) + 0.05, 0, 0));
    g.add(mesh(cylX(0.5 * s, 0.95 * s, 1.0 * s, 16), M.emitter, base + 0.5 * s, 0, 0));       // inner emitter
    g.add(mesh(cylX(0.08 * s, 0.3 * s, 4.2 * s, 10), M.emitter, base + 3.0 * s, 0, 0));       // antenna spike
    const sp = glowSprite(0x3a8cff, 26 * s, 0.22); sp.position.x = base + 3.0 * s; g.add(sp);
    g.add(glowLight(0x3f8cff, 70, 45, 11, 0, 0));
    return g;
  }

  function createEngines() {
    const g = new THREE.Group(); g.name = 'Engines';
    // impulse deck: boxy housing at the saucer trailing edge with twin exhausts
    const x0 = -58.6 * SR, w = 18 * SR;
    // side profile (x, y) extruded across the beam: flat aft face, roof sloping forward into the saucer
    const prof = new THREE.Shape();
    [[-4.7, 0.6], [-4.7, 4.6], [-2.2, 4.75], [4.9, 3.3], [4.9, 0.6]].forEach(([px, py], i) =>
      (i ? prof.lineTo(x0 + px * SR, py * SY) : prof.moveTo(x0 + px * SR, py * SY)));
    const deckGeo = new THREE.ExtrudeGeometry(prof, { depth: w - 0.6, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 2 });
    deckGeo.translate(0, 0, -(w - 0.6) / 2);
    const deck = mesh(deckGeo, M.hull2); deck.name = 'ImpulseDeck';
    g.add(deck);
    const back = mesh(GEO.box, M.dark, x0 - 4.7 * SR, 2.7 * SY, 0); back.scale.set(0.3, 2.9 * SY, w - 1.6); g.add(back);
    for (const s of [-1, 1]) {
      const ex = mesh(GEO.box, M.engine, x0 - 4.8 * SR, 2.7 * SY, s * 4.2 * SR); ex.scale.set(0.35, 2.0 * SY, 6.0 * SR); ex.name = 'ImpulseExhaust';
      g.add(ex);
      for (let i = -2; i <= 2; i++) {                             // exhaust louvres
        const lv = mesh(GEO.box, M.dark, x0 - 4.95 * SR, 2.7 * SY, s * 4.2 * SR + i * 1.05 * SR); lv.scale.set(0.2, 2.0 * SY, 0.14); g.add(lv);
      }
    }
    const sp = glowSprite(0xff4a18, 20 * SR, 0.35); sp.position.set(x0 - 6 * SR, 3 * SY, 0); g.add(sp);
    g.add(glowLight(0xff5a20, 45, 50, x0 - 12, 4, 0));
    return g;
  }

  function createShuttleBay() {
    const g = new THREE.Group(); g.name = 'ShuttleBay';
    const t = ENGINEERING_LENGTH, r = hullR(t), y = HULL_Y + hullCY(t), x = ENGINEERING_FRONT_X - t;
    // clamshell doors: segmented hemisphere closing the fantail
    const doors = mesh(new THREE.SphereGeometry(r * 0.985, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(Math.PI / 2), M.hull2, x, y, 0);
    doors.scale.x = 0.62; doors.name = 'ClamshellDoors';
    g.add(doors);
    g.add(mesh(torusX(r + 0.05, 0.3, 48), M.hull3, x, y, 0));
    for (let i = 1; i <= 4; i++) {                                // door segment seams
      const a = (i / 5) * (Math.PI / 2), rr = r * 0.99 * Math.cos(a);
      g.add(mesh(torusX(rr, 0.07, 40), M.dark, x - r * 0.62 * Math.sin(a), y, 0));
    }
    const ledge = mesh(GEO.box, M.hull3, x - 0.6, y - r * 0.62, 0); ledge.scale.set(3.2, 0.5, r * 1.3); g.add(ledge);  // landing-deck sill
    const beacon = orient(createSensor(0.55, M.navWhite), new THREE.Vector3(x + 1.5, y + r + 0.02, 0), Y, X); g.add(beacon); // bay approach beacon
    FX.shipLights.push(beacon);
    return g;
  }

  function createPhaserBanks() {
    const g = new THREE.Group(); g.name = 'PhaserBanks';
    const place = (r, deg, top) => {
      const p = saucerPoint(r * SR, deg * DEG, top, 0.02);
      const tangent = new THREE.Vector3(-Math.sin(deg * DEG), 0, Math.cos(deg * DEG));
      g.add(orient(createPhaserBank(), p.pos, p.normal, p.radial.clone().cross(tangent).lengthSq() ? p.radial : X));
    };
    // underside: forward bank pair, port/starboard mid banks, aft pair
    for (const d of [-8, 8, -90, 90, -152, 152]) place(26, d, false);
    // upper surface: port/starboard banks flanking the superstructure
    for (const d of [-55, 55, -125, 125]) place(27, d, true);
    return g;
  }

  function createSensors(bridge) {
    const g = new THREE.Group(); g.name = 'Sensors';
    // lower sensor dome under the saucer
    const yb = -12.4 * SY - 0.9;
    const dome = mesh(new THREE.SphereGeometry(3.2 * SR, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.sensor, 0, yb, 0);
    dome.scale.y = 0.85; dome.name = 'LowerSensorDome'; g.add(dome);
    g.add(mesh(new THREE.TorusGeometry(3.25 * SR, 0.16, 6, 40).rotateX(Math.PI / 2), M.dark, 0, yb, 0));
    g.add(mesh(GEO.sphere, M.navWhite, 0, yb - 3.2 * SR * 0.85, 0).translateY(0)); g.children[g.children.length - 1].scale.setScalar(0.4);
    // bridge-top sensor / beacon
    const top = mesh(GEO.sphere, M.navWhite, 0, bridge.userData.topY + 0.1, 0); top.scale.setScalar(0.45); g.add(top);
    // running lights: red to port (-Z), green to starboard (+Z), white at the bow
    const nav = (mat, r, deg, topSide) => {
      const p = saucerPoint(r, deg * DEG, topSide, 0.02), s = orient(createSensor(0.55, mat), p.pos, p.normal, p.radial);
      g.add(s); FX.shipLights.push(s);
    };
    nav(M.navGreen, 59 * SR, 90, true); nav(M.navRed, 59 * SR, -90, true);
    nav(M.navGreen, 59 * SR, 90, false); nav(M.navRed, 59 * SR, -90, false);
    nav(M.navWhite, 59 * SR, 0, true); nav(M.navWhite, 59 * SR, 0, false);
    // small sensor blisters: upper saucer, hull keel, nacelle tops
    for (const d of [-35, 35, 180]) { const p = saucerPoint(17 * SR, d * DEG, true, 0.02); g.add(orient(createSensor(0.5), p.pos, p.normal, p.radial)); }
    for (const t of [20, 62]) { const p = hullPoint(t * HL, -90 * DEG, 1, 0.02); g.add(orient(createSensor(0.6), p.pos, p.normal, X)); }
    for (const s of [1, -1]) { const p = nacellePoint(30 * NL, 90 * DEG, s, 0.02); g.add(orient(createSensor(0.5), p.pos, p.normal, X)); }
    return g;
  }

  function createWindows(bridge) {
    const g = new THREE.Group(); g.name = 'Windows';
    // saucer rim: two rows in irregular clusters
    for (const y of [0.68 * SY, -0.68 * SY]) {
      const items = [];
      let a = rnd() * 0.2;
      while (a < Math.PI * 2 - 0.05) {
        const run = 2 + Math.floor(rnd() * 4);
        for (let k = 0; k < run; k++, a += 1.75 / SAUCER_RADIUS) {
          const deg = ((a / DEG) + 180) % 360 - 180;
          if (Math.abs(Math.abs(deg) - 180) < 9.5) continue;       // impulse deck
          const n = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
          items.push({ pos: n.clone().multiplyScalar(SAUCER_RADIUS).setY(y), normal: n });
        }
        a += (5 + rnd() * 14) / SAUCER_RADIUS;
      }
      createWindowRow(items);
    }
    // bridge deck ring and teardrop superstructure flanks
    const bw = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2, n = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      if (Math.abs(Math.abs(a - 0.2 - Math.PI)) < 0.35) continue;
      bw.push({ pos: n.clone().multiplyScalar(5.38).setY(bridge.userData.deckY + 0.85), normal: n });
    }
    createWindowRow(bw, 0.8, 0.45);
    const tw = [];
    for (const d of [-80, -62, -44, -26, 26, 44, 62, 80, -8, 8]) {
      const a = d * DEG, n = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      tw.push({ pos: n.clone().multiplyScalar(11 * SR + 0.72).setY(6.4 * SY + 1.7 * SY), normal: n });
    }
    createWindowRow(tw, 1.0, 0.6);
    // saucer underside rings
    for (const [r, count, skip] of [[34, 22, 0.55], [44, 30, 0.6]]) {
      const items = [];
      for (let i = 0; i < count; i++) {
        if (rnd() < skip) continue;
        const th = (i / count) * Math.PI * 2 + 0.07;
        if (Math.abs(Math.abs(th - Math.PI)) < 0.2) continue;      // dorsal
        const p = saucerPoint(r * SR, th, false, 0);
        items.push({ pos: p.pos, normal: p.normal, up: p.radial });
      }
      createWindowRow(items, 1.2, 0.7);
    }
    // secondary hull: three rows per side (lettering band is left clear)
    for (const side of [1, -1]) for (const [deg, t0, t1, skip] of [[34, 10, 92, 0.5], [-9, 8, 96, 0.45], [-27, 14, 84, 0.6]]) {
      const items = [];
      for (let t = t0; t <= t1; t += 2.4) {
        if (rnd() < skip) continue;
        if (deg > 0 && Math.abs(ENGINEERING_FRONT_X - t * HL - PYLON_X) < 8) continue;   // pylon root
        const p = hullPoint(t * HL, deg * DEG, side, 0);
        items.push({ pos: p.pos, normal: p.normal });
      }
      createWindowRow(items);
    }
    // dorsal neck: three rows per side
    for (const side of [1, -1]) for (const h of [0.3, 0.5, 0.7]) {
      const s = neckSection(h), items = [];
      for (const c of [-0.45, -0.25, -0.05, 0.15, 0.35]) {
        if (rnd() < 0.3) continue;
        const z = s.b * Math.sin(Math.acos(Math.sign(c) * Math.pow(Math.abs(c), 1 / 0.8)));
        items.push({ pos: new THREE.Vector3(s.cx + s.a * c, s.y, side * z), normal: new THREE.Vector3(0, 0, side) });
      }
      createWindowRow(items, 1.1, 0.65);
    }
    g.add(buildWindows());
    return g;
  }

  function createHullPanels() {
    const g = new THREE.Group(); g.name = 'HullPanels';
    // saucer plating: concentric seams + radial seams, upper and lower
    for (const r of [26, 34, 42, 50, 58]) createPanelRing(r * SR, true);
    for (const r of [28, 36, 44, 54]) createPanelRing(r * SR, false);
    for (let i = 0; i < 24; i++) {
      const th = (i / 24) * Math.PI * 2;
      for (const top of [true, false]) {
        const pts = [];
        for (let r = top ? 26 : 28; r <= 61; r += 3.5) pts.push(saucerPoint(r * SR, th, top, 0.05).pos);
        if (top && Math.abs(th - Math.PI) < 0.01) continue;
        seamPolyline(pts);
      }
    }
    // saucer separation line just under the rim
    { const pts = []; for (let i = 0; i < 96; i++) { const a = (i / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(SAUCER_RADIUS + 0.06).setY(-RIM_Y)); } seamPolyline(pts, true); }
    // secondary hull plating rings + longitudinal seams
    for (const t of [10, 24, 40, 56, 72, 88]) {
      const pts = []; for (let j = 0; j < 64; j++) pts.push(hullPoint(t * HL, (j / 64) * Math.PI * 2, 1, 0.05).pos);
      seamPolyline(pts, true);
    }
    for (const side of [1, -1]) for (const deg of [-55, -20, 48]) {
      const pts = []; for (let t = 4; t <= 100; t += 4) pts.push(hullPoint(t * HL, deg * DEG, side, 0.05).pos);
      seamPolyline(pts);
    }
    // nacelle plating rings
    for (const side of [1, -1]) for (const t of [26, 52, 78, 104, 122]) {
      const pts = []; for (let j = 0; j < 48; j++) pts.push(nacellePoint(t * NL, (j / 48) * Math.PI * 2, side, 0.05).pos);
      seamPolyline(pts, true);
    }
    // neck panel seams
    for (const side of [1, -1]) for (const h of [0.2, 0.4, 0.6, 0.8]) {
      const s = neckSection(h), pts = [];
      for (let k = -8; k <= 8; k++) {
        const p = Math.acos(k / 8.6), c = Math.cos(p);
        pts.push(new THREE.Vector3(s.cx + s.a * Math.sign(c) * Math.pow(Math.abs(c), 0.8), s.y, side * (s.b * Math.sin(p) + 0.05)));
      }
      seamPolyline(pts);
    }
    const seamGeo = new THREE.BufferGeometry();
    seamGeo.setAttribute('position', new THREE.Float32BufferAttribute(seamPositions, 3));
    const seams = new THREE.LineSegments(seamGeo, M.seam); seams.name = 'PanelSeams';
    g.add(seams);

    // recessed maintenance panels, circular access panels, engineering markings
    const onSaucer = (obj, r, deg, top) => { const p = saucerPoint(r * SR, deg * DEG, top, 0.0); g.add(orient(obj, p.pos, p.normal, p.radial)); };
    const onHull = (obj, t, deg, side) => { const p = hullPoint(t * HL, deg * DEG, side, 0.0); g.add(orient(obj, p.pos, p.normal, deg === 90 || deg === -90 ? X : Y)); };
    for (const s of [1, -1]) {
      onSaucer(createHullPanel(3.2, 2.0), 38, s * 150, true);
      onSaucer(createHullPanel(2.4, 1.6), 47, s * 118, true);
      onSaucer(createAccessPanel(1.3), 30, s * 100, true);
      onSaucer(createAccessPanel(1.0), 54, s * 162, true);
      onSaucer(createHullPanel(3.0, 2.2), 40, s * 120, false);
      onSaucer(createAccessPanel(1.4), 48, s * 75, false);
      // landing-leg triangles (yellow) on the forward underside
      onSaucer(createHullPanel(2.6, 2.6, M.markYel), 39, s * 28, false);
      onHull(createHullPanel(3.4, 2.0), 64, -42, s);
      onHull(createHullPanel(2.6, 1.6), 30, 50, s);
      onHull(createAccessPanel(1.1, M.markYel), 22, -40, s);
      onHull(createAccessPanel(0.9, M.markYel), 78, 22, s);
      onHull(createHullPanel(2.2, 1.0, M.markRed), 52, -48, s);
      onHull(createHullPanel(1.6, 0.8, M.markRed), 90, -10, s);
      // red hatch on the underside of each nacelle
      const np = nacellePoint(84 * NL, -90 * DEG, s, 0.0); g.add(orient(createHullPanel(5.0, 2.2, M.markRed), np.pos, np.normal, X));
      const np2 = nacellePoint(50 * NL, -90 * DEG, s, 0.0); g.add(orient(createHullPanel(8.0, 2.6, M.hull3), np2.pos, np2.normal, X));
    }
    onHull(createHullPanel(6.0, 2.4), 46, -90, 1);
    onHull(createAccessPanel(1.6), 80, -90, 1);
    return g;
  }

  function createMarkings() {
    const g = new THREE.Group(); g.name = 'Markings';
    const reg = textTexture('NCC-1701', 6.4);

    // 1. Saucer upper surface: read from ahead of the bow looking aft.
    //    Reading direction runs starboard -> port, letter tops point at the bridge.
    { const W = 58 * SR, H = W / 6.4, xc = 41.5 * SR;
      g.add(createDecal((u, v) => {
        const x = xc + (0.5 - v) * H, z = (0.5 - u) * W;
        return new THREE.Vector3(x, saucerTopY(Math.hypot(x, z)) + 0.07, z);
      }, reg, 64, 10)); }

    // 2. Saucer underside: one registry on each forward quarter, arced with the
    //    rim, letter tops toward the rim (upright when seen from ahead of and below the bow).
    { const W = 36 * SR, H = W / 6.4, R = 47 * SR;
      for (const th0 of [42 * DEG, -42 * DEG]) {
        g.add(createDecal((u, v) => {
          const th = th0 - (u - 0.5) * W / R, r = R + (v - 0.5) * H;
          return new THREE.Vector3(r * Math.cos(th), saucerBottomY(r) - 0.07, r * Math.sin(th));
        }, reg, 64, 8));
      } }

    // 3. Secondary hull flanks: ship's name over the pennant stripe.
    { const W = 44 * HL, H = 6.0 * HR, tc = 44 * HL, a0 = 13 * DEG;
      for (const side of [1, -1]) {
        const tex = textTexture('', W / H, { draw: (c, w, h) => {
          drawText(c, 'U.S.S. ENTERPRISE', w * 0.2, 0, w * 0.6, h * 0.42);
          // pennant: bow end is on the left for the port side, right for starboard
          c.save();
          if (side > 0) { c.translate(w, 0); c.scale(-1, 1); }
          const y = h * 0.74, t = h * 0.1;
          c.fillStyle = '#a3261d';
          c.beginPath(); c.moveTo(w * 0.07, y - t); c.lineTo(w * 0.9, y - t * 0.55); c.lineTo(w * 0.985, y); c.lineTo(w * 0.9, y + t * 0.55); c.lineTo(w * 0.07, y + t); c.closePath(); c.fill();
          c.fillStyle = '#d9b23a';
          c.beginPath(); c.moveTo(w * 0.09, y - t * 0.45); c.lineTo(w * 0.89, y - t * 0.2); c.lineTo(w * 0.93, y); c.lineTo(w * 0.89, y + t * 0.2); c.lineTo(w * 0.09, y + t * 0.45); c.closePath(); c.fill();
          // delta at the bow end of the pennant, apex forward
          c.fillStyle = '#d9b23a'; c.strokeStyle = '#14161a'; c.lineWidth = h * 0.02;
          c.beginPath(); c.moveTo(w * 0.012, y); c.lineTo(w * 0.07, y - t * 1.9); c.lineTo(w * 0.055, y); c.lineTo(w * 0.07, y + t * 1.9); c.closePath(); c.fill(); c.stroke();
          c.restore();
        } });
        g.add(createDecal((u, v) => hullPoint(tc - side * (u - 0.5) * W, a0 + (v - 0.5) * H / hullR(tc), side, 0.07).pos, tex, 48, 8));
      } }

    // 4. Nacelles: registry on each outboard flank, reading left to right from outside.
    { const W = 26 * NL, H = W / 6.4, tc = 104 * NL;
      for (const side of [1, -1]) {
        g.add(createDecal((u, v) => nacellePoint(tc - side * (u - 0.5) * W, (v - 0.5) * H / nacR(tc), side, 0.07).pos, reg, 32, 8));
      } }
    return g;
  }

  // ==========================================================================
  //  ASSEMBLY
  // ==========================================================================
  function createEnterprise() {
    const Enterprise_NCC1701 = new THREE.Group();
    Enterprise_NCC1701.name = 'Enterprise_NCC1701';
    const bridge = createBridge();
    const port = createNacelle(-1), starboard = createNacelle(1);
    Enterprise_NCC1701.add(
      createSaucer(), bridge, createEngineeringHull(), createNeck(), createNacellePylons(),
      port, starboard, createDeflector(), createPhaserBanks(), createWindows(bridge),
      createHullPanels(), createSensors(bridge), createEngines(), createShuttleBay(), createMarkings(),
    );
    return Enterprise_NCC1701;
  }

  return { root: createEnterprise(), M, FX, chamberUniforms, SR, SY };
}

/* =====================================================================
   SIMULATOR ENTRY POINT
   ===================================================================== */
/**
 * Build the ship for ShipController.setModel. Anchors are in model metres (+X = bow).
 * `animate(t, exposure)` drives the Bussard collectors, warp chambers, deflector, impulse
 * engines, windows and running lights; every glow is divided by exposure so it reads the
 * same at any adaptation.
 */
export function buildEnterpriseShip() {
  const { root, M, FX, chamberUniforms, SR, SY } = buildModel();
  // The viewer's coloured point lights would add lights to every material in the solar system,
  // and its glow sprites would widen the bounding box that normalises the ship's length.
  const drop = [];
  root.traverse((o) => { if (o.isLight || o.isSprite) drop.push(o); });
  drop.forEach((o) => { o.parent.remove(o); o.material?.dispose(); });
  // Panel seams are unlit lines: the viewer's light grey would glow on the night side, so they only darken.
  M.seam.color.set(0x0c0e10); M.seam.opacity = 0.45;

  // Impulse exhausts at the saucer's trailing edge (anchor sits just behind the exhaust face).
  const xAft = -58.6 * SR - 4.8 * SR - 0.7;
  const engines = [-4.2 * SR, 4.2 * SR].map((z) => ({ pos: new THREE.Vector3(xAft, 2.7 * SY, z), r: 1.6 * SR }));
  const bridge = root.getObjectByName('Bridge');
  const cockpit = new THREE.Vector3(8, bridge.userData.topY + 1.2, 0);

  // Every emissive material: base intensity, plus a pulse for the engine glows.
  const pulses = new Map([
    [M.copper, (t) => 1 + 0.22 * Math.sin(t * 1.4)],
    [M.emitter, (t) => 1 + 0.18 * Math.sin(t * 1.4 + 0.6)],
    [M.dome, (t) => 1 + 0.12 * Math.sin(t * 2.1)],
    [M.domeCore, (t) => 1 + 0.2 * Math.sin(t * 3.3) + 0.08 * Math.sin(t * 7.9)],
    [M.engine, (t) => 1 + 0.1 * Math.sin(t * 2.7) + 0.05 * Math.sin(t * 9.1)],
  ]);
  const glows = Object.values(M)
    .filter((m) => m.isMeshStandardMaterial && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0)
    .map((m) => ({ mat: m, base: m.emissiveIntensity, pulse: pulses.get(m) || null }));

  const W = FX.windows, wBase = FX.windowBase, tmp = new THREE.Color();
  const wPhase = Float32Array.from({ length: W.count }, (_, i) => (i * 2.399963) % (Math.PI * 2));
  const wSpeed = Float32Array.from({ length: W.count }, (_, i) => 0.4 + ((i * 0.618034) % 1) * 1.2);

  function animate(t, exposure) {
    const g = 1 / Math.max(exposure, 1e-9);
    chamberUniforms.uTime.value = t;
    chamberUniforms.uGain.value = g;
    for (const e of glows) e.mat.emissiveIntensity = e.base * (e.pulse ? e.pulse(t) : 1) * g;
    for (const f of FX.fans) f.obj.rotation.x = t * 0.9 * f.dir;            // collectors counter-rotate
    for (let i = 0; i < W.count; i++) {
      const b = (0.9 + 0.1 * Math.sin(t * wSpeed[i] + wPhase[i])) * g;
      tmp.setRGB(wBase[i * 3] * b, wBase[i * 3 + 1] * b, wBase[i * 3 + 2] * b);
      W.setColorAt(i, tmp);
    }
    W.instanceColor.needsUpdate = true;
  }

  return { root, engines, cockpit, animate };
}
