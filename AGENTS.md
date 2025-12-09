# Repository Guidelines

## Project Structure & Module Organization
The site is a single-page app served directly from `index.html`, with styling in `style.css` and interactive behavior in `script.js`. Content lives in `content.json` (term metadata) and `coords.json` (grid placements); when adding terms ensure the IDs match across both files. Images and design references stay under `images/`, while supporting briefs (e.g., `design_choices.md`, `brainstorm.md`) capture research context—consult them before changing UX flows so narrative choices remain consistent.

## Build, Test, and Development Commands
- `open index.html` (macOS) or `start index.html` (Windows): launch the static page directly in your browser for quick sanity checks.
- `python -m http.server 8000` from the repo root: serves the site with correct relative paths, mirroring production hosting; visit `http://localhost:8000`.
- `npx serve .` (if Node is available): lightweight static server useful when testing CORS-dependent fetches of `content.json`.
When modifying data, reload with cache disabled so the browser repulls JSON.

## Coding Style & Naming Conventions
Use four-space indentation for HTML, CSS, and JavaScript to match the existing files. Prefer descriptive camelCase for JS variables (`gridContainer`, `termLocations`) and kebab-case for CSS classes (`grid-cell`, `tree-node`). Keep scripts framework-free and rely on modern vanilla DOM APIs; if you must add tooling, document it in GEMINI.md first. Assets should use lowercase, dash-separated filenames, and new views should follow the `view*` ID pattern so they slot into the `views` array in `script.js`.

## Testing Guidelines
There is no automated test harness; rely on manual verification across the three view states. Before opening a PR, confirm the following: JSON fetches succeed from a local server, hovering grid cells updates `alphaContent`, the simplified tree draws nodes and SVG lines without console errors, and mobile layouts remain legible at 375 px width. If you introduce logic-heavy code, add lightweight assertions via a browser console snippet or document a reproducible manual test script in `GEMINI.md`.

## Commit & Pull Request Guidelines
Git history favors short, imperative subjects (`grid`, `lines v3`). Follow that format, keeping bodies optional but focused on rationale or follow-up steps. Group related changes—data updates, styling, and script logic—into separate commits for easier review. Pull requests should include: a one-paragraph summary, screenshots or GIFs when altering visuals, clear testing notes (commands + browsers), and links to any planning documents touched. Flag breaking changes in bold at the top of the PR description and request review from at least one maintainer familiar with the tree visualization before merging.
