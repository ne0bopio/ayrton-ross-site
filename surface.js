/* DSCR stress surface — Three.js.
   One component, two instances: the cover (ambient, tilts with the mouse) and
   Exhibit 3 (driven by the loan slider, linked to the table).
   Reads the credit model from window.AYRTON, set by the inline script in index.html. */
import * as THREE from "./vendor/three.module.min.js";

const A = window.AYRTON;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const css = getComputedStyle(document.documentElement);
const cssColor = (v) => new THREE.Color(css.getPropertyValue(v).trim() || "#000");
const INK = cssColor("--ink"), INK2 = cssColor("--ink-2"), RED = cssColor("--red"),
      RULE = cssColor("--rule"), PAPER = cssColor("--paper");

const N = 41, M = 41;                    // rate steps × vacancy steps
const SHOCK_MAX = 0.02, VAC_MAX = 0.25;  // +200 bp, 25 % vacancy
const D_MIN = 0.70, D_MAX = 1.90, H = 1.55;   // DSCR display range → surface height
const yOf = (d) => (Math.min(Math.max(d, D_MIN), D_MAX) - D_MIN) / (D_MAX - D_MIN) * H;
const COV = A.FILE.covenant;
const fmtPct = (x, d) => (x * 100).toFixed(d) + "%";

export function createSurface(container, opts = {}) {
  let loan = opts.loan != null ? opts.loan : A.loan;
  const w0 = container.clientWidth || 600, h0 = container.clientHeight || 600;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w0, h0, false);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, w0 / h0, 0.1, 50);
  const target = new THREE.Vector3(0, H * 0.36, 0);

  /* ---------- geometry ---------- */
  const count = N * M;
  const idx = (i, j) => j * N + i;
  const xs = new Float32Array(N), zs = new Float32Array(M);
  for (let i = 0; i < N; i++) xs[i] = -1 + 2 * i / (N - 1);
  for (let j = 0; j < M; j++) zs[j] = -1 + 2 * j / (M - 1);
  const dscrAt = (i, j, l) => A.dscr(i / (N - 1) * SHOCK_MAX, j / (M - 1) * VAC_MAX, l);

  const targetY = new Float32Array(count), showY = new Float32Array(count);
  function computeTargets() { for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) targetY[idx(i, j)] = yOf(dscrAt(i, j, loan)); }
  computeTargets();
  const flat = yOf(1.0);
  showY.fill(REDUCED ? 0 : flat);
  if (REDUCED) showY.set(targetY);

  // fill mesh (occludes lines behind, raycast target)
  const fillPos = new Float32Array(count * 3);
  const fillIdx = [];
  for (let j = 0; j < M - 1; j++) for (let i = 0; i < N - 1; i++) {
    const a = idx(i, j), b = idx(i + 1, j), c = idx(i, j + 1), d = idx(i + 1, j + 1);
    fillIdx.push(a, c, b, b, c, d);
  }
  const fillGeo = new THREE.BufferGeometry();
  fillGeo.setAttribute("position", new THREE.BufferAttribute(fillPos, 3));
  fillGeo.setIndex(fillIdx);
  const fillMat = new THREE.MeshBasicMaterial({ color: PAPER, side: THREE.DoubleSide, transparent: true, opacity: 0.92,
    polygonOffset: true, polygonOffsetFactor: 1.5, polygonOffsetUnits: 2 });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  scene.add(fill);

  // wire lines: rows (constant j) and columns (constant i)
  const segCount = M * (N - 1) + N * (M - 1);
  const linePos = new Float32Array(segCount * 2 * 3), lineCol = new Float32Array(segCount * 2 * 3);
  const segMap = []; // vertex index pairs, in draw order
  for (let j = 0; j < M; j++) for (let i = 0; i < N - 1; i++) segMap.push(idx(i, j), idx(i + 1, j));
  for (let i = 0; i < N; i++) for (let j = 0; j < M - 1; j++) segMap.push(idx(i, j), idx(i, j + 1));
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
  scene.add(lines);

  const WARN = RED.clone().lerp(PAPER, 0.42);
  const inkArr = INK.toArray(), redArr = RED.toArray(), warnArr = WARN.toArray(), covY = yOf(COV), oneY = yOf(1.0);
  function writeBuffers() {
    for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
      const k = idx(i, j) * 3;
      fillPos[k] = xs[i]; fillPos[k + 1] = showY[idx(i, j)]; fillPos[k + 2] = zs[j];
    }
    for (let s = 0; s < segMap.length; s++) {
      const v = segMap[s], k = s * 3;
      linePos[k] = xs[v % N]; linePos[k + 1] = showY[v]; linePos[k + 2] = zs[(v / N) | 0];
      const y = targetY[v];
      const c = y < oneY - 1e-6 ? redArr : y < covY - 1e-6 ? warnArr : inkArr;
      lineCol[k] = c[0]; lineCol[k + 1] = c[1]; lineCol[k + 2] = c[2];
    }
    fillGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
    fillGeo.computeBoundingSphere();
  }
  writeBuffers();

  /* ---------- covenant plane, axes ---------- */
  const planeGeo = new THREE.PlaneGeometry(2.08, 2.08);
  const plane = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2; plane.position.y = covY;
  scene.add(plane);
  const planeEdge = new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo), new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.55 }));
  planeEdge.rotation.x = -Math.PI / 2; planeEdge.position.y = covY;
  scene.add(planeEdge);

  const base = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2, 2)), new THREE.LineBasicMaterial({ color: RULE }));
  base.rotation.x = -Math.PI / 2; scene.add(base);
  const axisPts = [
    new THREE.Vector3(-1, 0, -1), new THREE.Vector3(-1, H * 1.02, -1),
    ...[1.0, 1.25, 1.5].flatMap(d => [new THREE.Vector3(-1, yOf(d), -1), new THREE.Vector3(-1.05, yOf(d), -1)]),
  ];
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(axisPts), new THREE.LineBasicMaterial({ color: INK2 })));

  // marker: a point on the surface with a drop line to the base
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), new THREE.MeshBasicMaterial({ color: INK }));
  const dropGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const drop = new THREE.Line(dropGeo, new THREE.LineBasicMaterial({ color: INK2, transparent: true, opacity: 0.7 }));
  marker.visible = drop.visible = false;
  scene.add(marker, drop);

  /* ---------- labels (HTML, projected) ---------- */
  const labels = [];
  function label(text, pos, cls) {
    const el = document.createElement("span");
    el.className = "s3-label" + (cls ? " " + cls : ""); el.textContent = text;
    container.appendChild(el); labels.push({ el, pos }); return el;
  }
  const rateAt = (s) => fmtPct(A.FILE.rate + s, 2);
  label(rateAt(0), new THREE.Vector3(-0.9, 0, 1.12)); label(rateAt(0.02), new THREE.Vector3(0.9, 0, 1.12));
  label("Rate", new THREE.Vector3(0, 0, 1.14), "t");
  label("0%", new THREE.Vector3(1.14, 0, -0.9)); label(fmtPct(VAC_MAX, 0), new THREE.Vector3(1.14, 0, 0.9));
  label("Vacancy", new THREE.Vector3(1.2, 0, 0), "t");
  label("1.00×", new THREE.Vector3(-1.14, yOf(1.0), -1)); label("1.25×", new THREE.Vector3(-1.14, yOf(1.25), -1), "red"); label("1.50×", new THREE.Vector3(-1.14, yOf(1.5), -1));
  label("1.25× covenant", new THREE.Vector3(0.92, covY + 0.07, -0.62), "red t");
  const readout = document.createElement("div");
  readout.className = "s3-readout";
  container.appendChild(readout);
  const hint = opts.hint || "Drag to orbit · hover for values";
  const setReadout = (html) => { readout.innerHTML = html; };
  setReadout(hint);

  /* ---------- camera / orbit ---------- */
  let az = -0.66, el = 0.58, azOff = 0, elOff = 0, azOffT = 0, elOffT = 0;
  function dist() { const a = camera.aspect; return a < 1 ? 6.0 * Math.pow(1 / a, 1.0) : 5.6 * Math.pow(1 / a, 0.3); }
  function placeCamera() {
    const A2 = az + azOff, E = el + elOff, d = dist();
    camera.position.set(target.x + d * Math.cos(E) * Math.sin(A2), target.y + d * Math.sin(E), target.z + d * Math.cos(E) * Math.cos(A2));
    camera.lookAt(target);
  }

  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let dragging = false, lastX = 0, lastY = 0, moved = 0, pointerType = "mouse";
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; pointerType = e.pointerType;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
      az -= dx * 0.006;
      if (pointerType !== "touch") el = Math.min(1.3, Math.max(0.2, el + dy * 0.006));
      requestRender(); return;
    }
    if (e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    if (opts.tilt) { azOffT = (px - 0.5) * 0.22; elOffT = (0.5 - py) * 0.10; }
    ndc.set(px * 2 - 1, -(py * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(fill, false)[0];
    if (hit) showPoint((hit.point.x + 1) / 2 * SHOCK_MAX, (hit.point.z + 1) / 2 * VAC_MAX, true);
    else hidePoint();
    requestRender();
  });
  const endDrag = (e) => { if (!dragging) return; dragging = false; try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} requestRender(); };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { if (opts.tilt) { azOffT = 0; elOffT = 0; } if (!pinned) hidePoint(); requestRender(); });

  let pinned = false;
  function showPoint(shock, vac, fromHover) {
    const d = A.dscr(shock, vac, loan), x = shock / SHOCK_MAX * 2 - 1, z = vac / VAC_MAX * 2 - 1, y = yOf(d);
    marker.position.set(x, y, z); marker.visible = drop.visible = true;
    marker.material.color.copy(d < COV ? RED : INK);
    const p = dropGeo.attributes.position; p.setXYZ(0, x, 0, z); p.setXYZ(1, x, y, z); p.needsUpdate = true;
    setReadout(`<b>${d.toFixed(2)}×</b> DSCR &nbsp;·&nbsp; ${fmtPct(A.FILE.rate + shock, 2)} rate &nbsp;·&nbsp; ${fmtPct(vac, 0)} vacancy` + (d < COV ? ` &nbsp;·&nbsp; <i>below covenant</i>` : ""));
    if (!fromHover) pinned = true;
  }
  function hidePoint() { marker.visible = drop.visible = false; pinned = false; setReadout(hint); }

  /* ---------- render loop, on demand ---------- */
  let running = false, introDone = REDUCED, visible = false;
  function step() {
    let moving = false;
    const k = introDone ? 0.22 : 0.085;
    let maxd = 0;
    for (let v = 0; v < count; v++) {
      const d = targetY[v] - showY[v];
      if (Math.abs(d) > 0.0006) { showY[v] += d * k; maxd = Math.max(maxd, Math.abs(d)); }
      else showY[v] = targetY[v];
    }
    if (maxd > 0) { moving = true; writeBuffers(); } else introDone = true;
    if (Math.abs(azOffT - azOff) > 1e-4 || Math.abs(elOffT - elOff) > 1e-4) { azOff += (azOffT - azOff) * 0.12; elOff += (elOffT - elOff) * 0.12; moving = true; }
    placeCamera();
    renderer.render(scene, camera);
    projectLabels();
    if (moving && visible) requestAnimationFrame(step); else running = false;
  }
  function requestRender() { if (!running) { running = true; requestAnimationFrame(step); } }
  const tmp = new THREE.Vector3();
  function projectLabels() {
    const w = container.clientWidth, h = container.clientHeight;
    for (const { el, pos } of labels) {
      tmp.copy(pos).project(camera);
      el.style.transform = `translate(${((tmp.x + 1) / 2 * w).toFixed(1)}px,${((1 - tmp.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)`;
    }
  }

  new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); requestRender();
  }).observe(container);

  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    if (visible) requestRender();
  }, { threshold: 0.15 }).observe(container);

  placeCamera(); renderer.render(scene, camera); projectLabels();

  return {
    setLoan(l) { loan = l; computeTargets(); if (pinned || marker.visible) { /* refresh readout at same point */ } requestRender(); },
    highlight(shock, vac) { showPoint(shock, vac, false); requestRender(); },
    clear() { hidePoint(); requestRender(); },
  };
}

/* ---------- mount ---------- */
try {
  if (!A) throw new Error("model missing");
  const cover = document.getElementById("s3-cover");
  if (cover) createSurface(cover, { tilt: true, hint: "Exhibit 3 · drag to orbit, hover for values" });
  const ex = document.getElementById("s3-ex");
  if (ex) {
    const s = createSurface(ex, { tilt: false, hint: "Drag to orbit · hover the surface or the table" });
    A.onLoan = (l) => s.setLoan(l);
    const grid = document.getElementById("grid");
    if (grid) {
      grid.addEventListener("mouseover", (e) => { const td = e.target.closest("td[data-shock]"); if (td) s.highlight(+td.dataset.shock, +td.dataset.vac); });
      grid.addEventListener("mouseleave", () => s.clear());
    }
  }
  document.documentElement.classList.add("has-3d");
} catch (err) {
  document.documentElement.classList.add("no-3d");
  console.warn("3D surface unavailable:", err);
}
