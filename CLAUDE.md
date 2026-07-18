# CHIP website — working notes for Claude

Continuing work on the CHIP (Community Health Impact Projects) website. Read
this first; it's the operating context for the repo.

## Session start check — do this BEFORE any edit

A session can be handed a work branch cut from an **old snapshot** of this repo.
On 2026-07-18 that actually happened: a session started on a June-era branch
(no `CLAUDE.md`, images still inline base64), spent the day re-optimizing an
obsolete version of the site, and nearly shipped a regression. Don't repeat it.

1. First command of the session:
   `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && echo BASE-OK`
2. If it does **not** print `BASE-OK`, your branch predates current `main`.
   Stop and rebase your work (or reset the branch if it has no commits of its
   own): `git checkout -B <your-branch> origin/main`, then re-apply anything
   worth keeping.
3. Stale-snapshot red flags, any one of which means you are NOT on the real
   site: no `CLAUDE.md`; no `assets/` directory; no `es/`; `index.html`
   megabytes big with `data:image/...;base64` URIs; a `.github/workflows`
   Pages deploy (main has none — deploy is Pages' built-in "from branch").
4. Before claiming a change is (or will be) live, re-derive it: the live site
   is `main` only — check the latest `pages-build-deployment` run's `head_sha`
   equals the `main` tip.

Branch hygiene, so stale snapshots stop accumulating: when a work branch's
commits are all contained in `main` (`git rev-list --count origin/main..<branch>`
is 0), delete the branch. Exceptions currently kept on purpose:
`claude/precision-nutrition-womens-health-r0yjd7` carries two unmerged grant
pre-proposal docs (`proposals/`).

## What this is & where it lives

- Repo: `dr2juan/CHIP`. This is a **hand-written static site — no framework, no
  build step, no npm.** Just HTML/CSS/JS you edit directly.
- Two pages:
  - `index.html` (repo root) = **English** → live at https://dr2juan.github.io/CHIP/
  - `es/index.html` = **Spanish** → live at https://dr2juan.github.io/CHIP/es/
- `assets/` = all 27 images (WebP, plus `favicon.png` and `og-card.jpg`).
- `evidence-library/` = internal grant-support notes. **Not part of the website.**

## Deployment (important)

- GitHub Pages builds **from the `main` branch** automatically on push (Pages'
  built-in "deploy from branch" — there is **no** custom Actions workflow).
  **To go live, a change must land on `main`.** Build takes ~1–2 min.
- **Always verify the build actually ran** after pushing: check that the latest
  `pages-build-deployment` run's `head_sha` matches your commit. A push
  occasionally does not trigger a build — an empty commit re-triggers it.
  (Earlier a silent no-build left the live site stale while it looked shipped.)
- `main` is the live branch. `claude/chip-website-refinement-e6d17k` is a mirror
  dev branch; only `main` reaches the site. If you can't reach GitHub tools,
  confirm a deploy by hard-refreshing the live URL.

## Editing rules

1. **English is canonical.** Edit `index.html`, then mirror the change into
   `es/index.html` (translated). Spanish is a full parallel translation and
   needs a native-speaker review. **Spanish asset paths use `../assets/`** (not
   `assets/`).
2. **Never re-embed images as base64.** The page was once 6 MB of inline base64;
   images now live in `assets/` as lazy-loaded WebP with explicit width/height.
   Keep it that way.
3. **The Overview constellation** (rotating project map) is **vanilla JS at the
   bottom of each file.** Node data lives in the `PROJECTS` and `PILLARS`
   arrays. To add/edit/remove a node, edit `PROJECTS`
   (`{id,label,title,desc,p:[domains],x,y,collab,independent}`). `p:[]` = no
   connecting lines (the independent "AI for clinical care" satellite).
   Positions are % coords; rotation is rigid, so nodes that don't overlap at
   rest never will. **Two things to keep in sync by hand:** the `.eco-mobile`
   fallback zone list (mirrors `PROJECTS`), and the fact that **both `index.html`
   and `es/index.html` each carry their own copy of this JS.**
4. **CSS class names still say "pillar"** (`.pillar-card`, `pz-`, the `PILLARS`
   JS var) even though visible copy says "domains." Only wording changed — do
   not rename the classes.
5. **Don't hardcode project counts** in copy ("twelve projects" was removed on
   purpose; the number changes).
6. `?depth=0` / `?depth=1` are leftover URL flags for alternate constellation
   views; the default (no flag) is the committed angled camera-move look.
7. **QA method:** render locally in headless Chromium (Playwright at
   `/opt/pw-browsers/chromium`) and screenshot. Make text edits as
   exact-string replacements that assert the source appears exactly once, so
   nothing silently corrupts.
8. Brand colors are CSS vars at the top (UTHealth palette): `--gulf` navy,
   `--enviro` teal, `--cardio` crimson, `--food` green, `--orange` terracotta.

## Content rules already established (don't undo without asking)

- Findings cards use **real** pilot/eval data (wearable-heat pilot, heat×ozone
  co-exposure pilot, Cultivating Health / USDA GusNIP). Effect estimates that
  are not statistically significant or are pre-publication were **deliberately
  left off** the public site.
- The AIM-AHEAD coma-recovery study is intentionally an **independent satellite**
  on the map, not inside any domain (it's acute ICU/AI work, not community
  health).
- Publications are real; article titles stay in their published language
  (English).

## Open threads (to-dos, not yet done)

- ~~The 12 project status labels were inferred~~ — **confirmed by the director
  2026-07-18**, with one correction applied: "Southwest Regional Food Business
  Center" is properly the **Rio Grande Colonias Regional Food Business Center**
  (USDA RFBC led by Texas A&M AgriLife El Paso; CHIP's center is a core
  partner). The federal program was terminated in 2025; the partnership
  continues and a paper is in preparation — status now "Publication in
  preparation." (Director described the termination as "by executive order";
  public sources say USDA announced the program's termination, so the site
  uses the neutral "federal program was terminated in 2025.")
- Decide whether the held-back co-exposure effect estimates ever go public.
- **Spanish page needs native-speaker review** — especially team role
  titles/gender (Abolore Idris, Colby Griffin flagged as guesses).
- Optional: strip the `?depth=` flags; consider a custom domain; project detail
  pages.

## How to work here (the standard this project was built to)

- Read what's actually being asked, beneath the literal words. A "let's discuss"
  is not "go build"; a "roll it back" means restore intent, not just revert bytes.
- Break changes into independently checkable pieces; prefer edits that fail loudly.
- Spend scrutiny where risk lives — irreversible/outward-facing (published
  claims) over reversible (layout). Verify the irreversible *before*, not after.
- Verify by re-deriving (run it, recheck the deployed SHA), not by trusting that
  output sounds right.
- Label guesses as guesses at the point you use them.
- Attack your own conclusion before shipping.
- Communicate answer first, then reasoning, then risk.
