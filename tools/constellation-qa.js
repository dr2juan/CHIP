/*
 * Constellation QA — run after touching PROJECTS / PILLARS positions.
 *
 *   npm install --no-save playwright-core      # dev-only; the SITE still has
 *   node tools/constellation-qa.js             # no build step and no deps
 *
 * (Chromium is already on the box at PLAYWRIGHT_BROWSERS_PATH — do not run
 *  "playwright install". Adjust CHROME below if the path has moved.)
 *
 * Checks the rotating project map in BOTH languages across ALL FOUR rotation
 * states (at rest + each domain brought to the top), and reports:
 *
 *   1. box clearance between every node, every pillar label, AND the centre
 *      core hub. The core is easy to forget — it is not a .eco-node and not a
 *      .eco-pillar, and leaving it out of the obstacle set is how a node ended
 *      up sitting on the hub (2026-08-02).
 *   2. connector-line separation: the angle at a pillar between the lines
 *      coming from each of its nodes. Two nodes on the same bearing draw two
 *      near-collinear lines (2026-08-01, Taster Space vs Protein in school
 *      meals). Boxes can all be clear while the lines are a mess.
 *   3. labels spilling outside the .eco-canvas box. This is a WARNING, not a
 *      failure: the canvas has no overflow:hidden, so a label that pokes past
 *      the box still renders fine on the page. (An element-only screenshot
 *      makes these look chopped off — they are not. Check a viewport
 *      screenshot before "fixing" one.) The real failure is the page picking
 *      up horizontal scroll, which is checked separately.
 *
 * Exit code is non-zero if anything fails, so this can gate a change.
 */
const { chromium } = require('playwright-core');

const CHROME = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const MIN_GAP = 8;      // px of breathing room between any two boxes
// Degrees between two connector lines arriving at the same pillar. This is the
// "these two lines are indistinguishable" floor, NOT a comfort target: the
// environmental pillar has six nodes fanning into it and legitimately runs
// 10-18deg. The bug this catches was ~0deg (two collinear lines, 2026-08-01).
// Do not raise it to 20+ without re-laying-out the whole map.
const MIN_ANGLE = 8;
const ROOT = 'file://' + require('path').resolve(__dirname, '..') + '/';

const measure = () => {
  const canvas = document.querySelector('.eco-canvas').getBoundingClientRect();
  const rel = e => {
    const r = e.getBoundingClientRect();
    return { l: r.left - canvas.left, t: r.top - canvas.top, r: r.right - canvas.left,
             b: r.bottom - canvas.top, cx: (r.left + r.right) / 2 - canvas.left,
             cy: (r.top + r.bottom) / 2 - canvas.top };
  };
  const items = [];
  document.querySelectorAll('.eco-node').forEach(e =>
    items.push({ kind: 'node', name: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), box: rel(e) }));
  document.querySelectorAll('.eco-pillar').forEach(e =>
    items.push({ kind: 'PILLAR', name: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), box: rel(e) }));
  const core = document.querySelector('.eco-core');
  if (core) items.push({ kind: 'CORE', name: 'centre hub', box: rel(core) });

  // gap: 0 when touching, negative = overlap depth
  const gap = (a, b) => {
    const dx = Math.max(a.l - b.r, b.l - a.r);
    const dy = Math.max(a.t - b.b, b.t - a.b);
    if (dx < 0 && dy < 0) return -Math.min(-dx, -dy);
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  };
  const pairs = [];
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].kind !== 'node' && items[j].kind !== 'node') continue;   // pillar/core layout is fixed
      pairs.push({ a: `${items[i].kind}:${items[i].name}`, b: `${items[j].kind}:${items[j].name}`,
                   g: Math.round(gap(items[i].box, items[j].box)) });
    }

  const clipped = items.filter(x => x.box.l < 0 || x.box.t < 0 ||
                                    x.box.r > canvas.width || x.box.b > canvas.height)
                       .map(x => `${x.kind}:${x.name}`);

  // Connector lines are l-enviro / l-cardio / l-food (l-core is the dashed
  // core->pillar spoke, not a node link). The svg is viewBox="0 0 100 100"
  // with preserveAspectRatio="none", so its units are NOT square — scale to
  // pixels before measuring any angle or the numbers are meaningless.
  const sx = canvas.width / 100, sy = canvas.height / 100;
  const lines = [...document.querySelectorAll('.eco-canvas svg line')]
    .filter(e => !e.classList.contains('l-core'))
    .map(e => ({
      x1: +e.getAttribute('x1') * sx, y1: +e.getAttribute('y1') * sy,
      x2: +e.getAttribute('x2') * sx, y2: +e.getAttribute('y2') * sy,
    }));
  const hScroll = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { pairs: pairs.sort((x, y) => x.g - y.g), spill: clipped, lines, hScroll,
           canvas: { w: canvas.width, h: canvas.height } };
};

// angle at the shared endpoint between two segments that meet there
const angleAt = (shared, p, q) => {
  const v1 = [p[0] - shared[0], p[1] - shared[1]], v2 = [q[0] - shared[0], q[1] - shared[1]];
  const n1 = Math.hypot(...v1), n2 = Math.hypot(...v2);
  if (!n1 || !n2) return 180;
  const c = Math.min(1, Math.max(-1, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)));
  return Math.acos(c) * 180 / Math.PI;
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  let failures = 0;

  for (const [file, tag, verb] of [['index.html', 'EN', 'Bring'], ['es/index.html', 'ES', 'Llevar']]) {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errs = [];
    p.on('pageerror', e => errs.push(String(e)));
    await p.goto(ROOT + file, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.getElementById('overview').scrollIntoView({ block: 'center' }));
    await p.waitForTimeout(2200);

    const labels = await p.evaluate(v =>
      [...document.querySelectorAll(`[aria-label^="${v}"]`)].map(e => e.getAttribute('aria-label')), verb);
    if (labels.length !== 3) {
      // guards against a silent no-op: the ES buttons say "Llevar", not "Bring"
      console.log(`${tag}: FAIL — expected 3 rotation buttons matching "${verb}", found ${labels.length}`);
      failures++;
    }

    for (const [name, click] of [['at rest', null], ...labels.map(l => [l.slice(0, 46), l])]) {
      if (click) { await p.click(`[aria-label="${click}"]`); await p.waitForTimeout(2300); }
      const m = await p.evaluate(measure);
      const problems = [], warnings = [];

      m.pairs.filter(x => x.g < MIN_GAP).forEach(x =>
        problems.push(`${x.g}px between ${x.a} and ${x.b}`));
      if (m.hScroll > 0) problems.push(`page has ${m.hScroll}px of horizontal scroll`);
      m.spill.forEach(c => warnings.push(`spills past the canvas box (renders fine): ${c}`));

      // group lines by pillar end and compare bearings
      const byPillar = new Map();
      for (const L of m.lines) {
        const key = `${Math.round(L.x2)},${Math.round(L.y2)}`;
        if (!byPillar.has(key)) byPillar.set(key, []);
        byPillar.get(key).push(L);
      }
      for (const [key, ls] of byPillar) {
        const [px, py] = key.split(',').map(Number);
        for (let i = 0; i < ls.length; i++)
          for (let j = i + 1; j < ls.length; j++) {
            const a = angleAt([px, py], [ls[i].x1, ls[i].y1], [ls[j].x1, ls[j].y1]);
            if (a < MIN_ANGLE) problems.push(`lines ${a.toFixed(1)}deg apart at pillar ${key}`);
          }
      }

      if (problems.length) { failures++; console.log(`${tag} | ${name}: FAIL`); problems.forEach(x => console.log(`      ${x}`)); }
      else console.log(`${tag} | ${name}: ok (tightest box gap ${m.pairs[0].g}px — ${m.pairs[0].a} / ${m.pairs[0].b})`);
      warnings.forEach(x => console.log(`      warn: ${x}`));
    }
    if (errs.length) { failures++; console.log(`${tag}: JS errors — ${errs.join(' | ')}`); }
    await p.close();
  }

  await b.close();
  console.log(failures ? `\nFAIL (${failures})` : `\nPASS — 8 states clear: boxes >=${MIN_GAP}px, lines >=${MIN_ANGLE}deg, nothing clipped`);
  process.exit(failures ? 1 : 0);
})();
