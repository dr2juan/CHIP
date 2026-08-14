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
   Positions are % coords.

   **Do not hand-check this. Run `node tools/constellation-qa.js`** (needs
   `npm install --no-save playwright-core`; dev-only, the site still has no
   deps). It measures both languages × all four rotation states and exits
   non-zero on a real collision. Every rule below is already encoded in it —
   they are written out here because each one cost a shipped regression, and
   because a future change may need the reasoning, not just the pass/fail.

   - **Checking overlap at rest is NOT enough — that claim used to live here
     and it is wrong** (corrected 2026-08-01 after a node landed on the "Food
     systems & nutrition" label). The three pillar labels sit at *fixed*
     positions (enviro 50,16 / cardio 20,72 / food 80,72) and do **not**
     rotate with the nodes, and the tilted camera projection changes relative
     node spacing per state, so even node-vs-node gaps shift.
   - **The centre core is an obstacle too.** It is neither an `.eco-node` nor
     an `.eco-pillar`, so an obstacle list built from those two selectors
     silently omits it — which is exactly how Taster Space ended up sitting on
     the hub (2026-08-02). `.eco-core` is a fixed ~150px circle at 50,52 in
     every state.
   - **Test Spanish separately.** ES labels are longer and wrap to more lines,
     so a position that clears in English can crowd in Spanish (that is how
     `proj-coma-ai` ended up 7px from "Mapeo SIG de asma"). The rotation
     buttons are `[aria-label^="Bring …"]` in EN and `[aria-label^="Llevar …"]`
     in ES — a script that greps only "Bring" runs zero ES states and reports
     a cheerful pass.
   - **Boxes aren't the whole story: check the connecting lines.** A node on
     the same bearing as another node in the same domain draws two
     near-collinear lines into the shared pillar (2026-08-01, Taster Space vs
     "Protein in school meals" — both ~x:80 feeding the food pillar at 80,72).
     Also keep nodes off the dashed core→pillar connectors: a node at the
     midpoint between 50,52 and a pillar lands exactly on one.
     Note the fan-in angles are **not** roomy by design — the environmental
     pillar takes six lines and legitimately runs 10–18°. The QA script fails
     under 8°, which is the "indistinguishable" floor, not a comfort target.
   - **Labels spilling past the `.eco-canvas` box are fine.** There is no
     `overflow:hidden`, so they render normally on the page; the QA script
     warns rather than fails. An element-only screenshot *makes them look
     chopped off* — take a viewport screenshot before "fixing" one.

   **Two things to keep in sync by hand:** the `.eco-mobile`
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
9. **The `@media print` block at the end of the stylesheet is load-bearing —
   don't delete it.** Scroll-reveal parks ~83 elements at `opacity:0` until the
   IntersectionObserver fires; printing never scrolls, so without it the site
   prints/PDFs blank (verified 2026-07-27: 83 hidden → 0 after the fix). It
   also unfolds the hidden publications, swaps `.eco-canvas` for `.eco-mobile`,
   and flips the dark hero/footer to dark-on-white (browsers drop backgrounds
   when printing). **If you add a new section that hides content behind a
   toggle, add a print rule that unfolds it.** Test with Playwright
   `emulateMedia({media:'print'})`, not by eye.
10. **Metric-strip images double-crop.** `.metric-map .media` is a *fixed*
   132px-tall box with `object-fit:cover`, so its aspect ratio swings from
   1.25 (390px viewport) to 2.57 (760px) — anything you drop in gets cropped
   again on top of however the file was already cropped. That's how the
   cohort map ended up a narrow band that didn't match the full map in the
   cardiometabolic section (fixed 2026-07-31: `map-strip-v2.webp`, cropped
   from `map-cohort.webp` at ratio 1.8 centred on the dot centroid, keeping
   ~91% of cohort points). Crop new strip images near ratio 1.8 and check
   them at 390/760/1440px.
11. Wayfinding: `.nav-cta` on the Partner nav link (the site's primary action —
   grants/collaborators are the top-priority audience) and `.scroll-progress`,
   a 2px reading-position bar in the sticky header. The footer's Partner link
   stays a plain link; only the nav one carries `.nav-cta`.

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
- **Client evaluation reports are not publishable content.** CHIP writes
  evaluations *for* partner organizations (e.g. the Taster Space report
  prepared for Desert Spoon Food Hub, Sept 2025). Those reports are drafts
  and the client's data: the *existence* of the engagement is fine for the
  project list, but participant quotes, outcome percentages, and named
  barriers must NOT go on the public site without that partner's written
  sign-off. When handed such a report, add the project entry and stop there.
- `proj-taster` (added 2026-07-30 from the Taster Space draft report):
  Desert Spoon Food Hub's space-themed family nutrition program; CHIP has
  been evaluation partner since 2020, moving to qualitative methods + force
  field analysis in 2025. **Food only** (`p:['food']`), `collab:true`, map
  position (88,62). It was briefly tagged food × cardio — wrong, and worth
  remembering as a tagging rule: **domain tags follow measured outcomes, not
  the background framing.** The report's obesity/chronic-disease context
  invites a cardio tag, but Appendix B's four objectives are all nutrition
  (FV availability/consumption, child food-prep self-efficacy, mealtime
  experience, partner capacity), and the report contains zero BMI, blood
  pressure, A1c, lipid, or waist measures — Veggie Meter data wasn't even
  collected in 2025. Contrast `proj-cultivating`, which legitimately carries
  cardio because it measures cardiovascular outcomes.
  Desert Spoon Food Hub is now in the acknowledgment list ("Local &
  community", alongside La Semilla). Status label "Evaluation underway" is
  still **inferred** — confirm with the director.

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
- **`evidence-library/` is publicly reachable** on the live site (everything on
  `main` is served by Pages, e.g. `/CHIP/evidence-library/full-tracker.md`).
  `robots.txt` can't help while on github.io (project pages don't control the
  domain root). Decide: either that's acceptable, or move the folder to a
  non-deployed branch.
- SEO files added 2026-07-18: `sitemap.xml` (submit to Google Search Console
  for indexing — robots.txt discovery doesn't work on a project page),
  `404.html` (bilingual), `robots.txt` (dormant until a custom domain).
  **If a custom domain is ever added:** update absolute URLs in `sitemap.xml`,
  `robots.txt`, the canonical/hreflang/og tags in both `index.html` files,
  and the `/CHIP/`-rooted links in `404.html`.

## News section workflow (added 2026-07-18)

`#news` ("News & field updates") sits between the Featured Study and Projects
sections in both files. Current cards are **photo cards** (`.card.top-rule
.news-card`: a `.news-photo` figure with a lazy WebP, then a `.news-body` with
a `.tag` eyebrow of the form `Type · date`, an `h3`, and 1–2 sentences).
Types used so far: Field note, Recognition, Program milestone, Partnership,
Conference, Award, Field research, Community engagement, Policy engagement
(plus older: Program
update, Field milestone, Publications, Now in the field, New book). The section
currently holds **fifteen cards, newest-first, with the first eight shown and
the rest behind a "Show N more updates" fold** (`.news-extra.folded` +
`.news-toggle`, mirroring the Publications pattern). **Keep the visible count
at a multiple of four** — the grid is 4-up on desktop, 2-up at ≤900px, 1-up at
≤680px, so 8 fills clean rows at every breakpoint while 9 leaves an orphan.
When adding a card: put it first, add `news-extra folded` to it if that pushes
a visible card past eight, and update the button count in **both** places (the
button text and the JS reset string). The `@media print` block unfolds these —
don't drop that rule. Translate for `es/index.html`
(Spanish `img src` uses `../assets/`). **Search the names before writing the
card** — a forwarded post gives them casually and they are often not what they
look like. "the Border Latch" is not an organization: it is the Binational
Breastfeeding Coalition's annual event (15th edition, 2026-08-08, Bassett
Place), and the venue banner in the supplied photo confirmed it.
Content rules apply: real, verifiable
claims only. Cards can feature **any CHIP team member**, not just the director
(the heat/ozone pilot and APHA-2024 cards feature Dr. Idris).

Source: **LinkedIn exports** the director/team provide (`.docx` with post text +
images) — e.g. the director's own (2026-07-18), Dr. Idris's (2026-07-21), and a
Karen Del Rio PhD + GIS-book export (2026-07-21).
That is the practical pipeline: someone forwards a post (screenshot, pasted
text, or a LinkedIn data export) and a session turns it into a bilingual card,
adding the photo to `assets/` as right-sized WebP (news photos: ~760px long
side, q80; see the `news-*.webp` files). **Automated feed-pulling from
LinkedIn/Facebook is not possible** (personal-profile APIs are closed, profile +
post permalinks return HTTP 403 to anonymous fetchers, scraping is against ToS)
— verified 2026-07-18; don't re-attempt it. The section CTA links to the
director's LinkedIn profile for the live feed. Per-card deep links aren't stored
(exports don't carry post permalinks); add them only if given a real URL.

The **Publications section** is now CHIP-team-wide (not director-only): it
carries Dr. Idris's occupational-heat papers too, with `.me` bolding whichever
CHIP author appears (Idris and/or Aguilera). The closing note was changed from
Aguilera's "Selected from 24…" to a neutral team line, and the Scholar button
relabeled "Dr. Aguilera on Google Scholar" (his profile won't list team-mates'
papers). Titles stay in their published language (English). If a paper has no
verifiable DOI (e.g. the JEOH systematic review), list it **without** a link —
there is precedent (the Texas Public Health Journal entry). The `.pub-toggle`
label text lives in **two** places that must stay in sync: the button and the
JS reset string near the bottom of each file.

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
