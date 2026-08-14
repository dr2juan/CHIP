# CHIP website agent instructions

These rules apply to every coding agent working in this repository.

## Production and branches

- The production website is https://chip-ep.com/ and deploys from `main`.
- Start work from the current `origin/main`, even if GitHub's configured
  default branch points somewhere else.
- Make changes on a task-specific branch and open a pull request into `main`.
  Never force-push or push directly to `main`.
- Preserve the root `CNAME` file. Removing it disconnects `chip-ep.com`.

## Editing safeguards

- This is a hand-written static site with no build step or runtime packages.
- `index.html` is English and `es/index.html` is its Spanish counterpart.
  Mirror relevant content and layout changes in both files. Spanish asset
  paths begin with `../assets/`.
- Never embed images as base64. Keep images in `assets/`, use WebP where
  appropriate, and retain useful alt text plus explicit dimensions.
- Preserve the `@media print` block. Without it, reveal-hidden content can
  disappear from printed pages and PDFs.
- Treat `CNAME`, `robots.txt`, `sitemap.xml`, canonical URLs, and language
  links as deployment infrastructure; change them only when the task requires
  it.
- Do not publish internal grant notes, client reports, participant quotations,
  unpublished effect estimates, or partner data without explicit approval.

## Required checks

- After changing the project constellation, update both desktop and mobile
  representations in both languages, then run
  `node tools/constellation-qa.js`. The script checks English and Spanish in
  every rotation state and discovers Chrome, Edge, or Playwright Chromium.
- Check both language pages for broken internal links, duplicate IDs, missing
  image alt text or dimensions, and heading-order regressions.
- Before claiming a change is live, verify that GitHub Pages deployed the
  exact `main` commit and check the public URL.

Read `CLAUDE.md` when it is present for additional project history and detailed
content guidance. The rules above remain valid if that internal context is
moved out of the public repository.
