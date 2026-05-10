# 9047 - Supposition Theory Tree

This repository contains a static, framework-free study site for exploring Peter of Spain's supposition theory. The app combines a tree image, a hoverable coordinate grid, simplified and English tree views, and explanatory term notes sourced from local JSON/text files.

## Project Layout

- `index.html` defines the single-page interface and view containers.
- `style.css` controls the dark/gold visual system, tree panels, grid overlay, and responsive layout.
- `script.js` loads content, renders the tree views, handles term highlighting, and manages the magnifier.
- `content.json` stores the Latin/English term labels and explanatory notes.
- `coords.json` maps term IDs to grid positions on the landing image.
- `connections.txt` lists parent-child relationships for the rendered tree views.
- `images/` contains the visual source assets used by the app.

## Local Preview

The app can be opened directly from `index.html`, but a local static server more closely matches the fetch behavior used for `content.json`, `coords.json`, and `connections.txt`:

```powershell
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Verification

For script-only changes, run:

```powershell
node --check .\script.js
```

For data or content changes, also confirm the page loads from a local server and that hovering terms updates the information panel without console errors.
