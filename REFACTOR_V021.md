# GRIMPATH v0.21 Refactor

This branch is the staging branch for the modular GRIMPATH build. `main` remains the playable v0.20.1 build until this branch passes validation.

## Target runtime structure

- `index.html` — page shell only; no document.write hotfix injection
- `css/game.css` — world/map/base UI styles
- `css/combat.css` — combat/inventory/VFX styles
- `js/data.js` — constants, weapons, supports, skills, monsters, asset registry
- `js/world.js` — seeded world generation, organic roads, encounters, Game state
- `js/ui.js` — map Canvas rendering and HUD/UI rendering
- `js/combat.js` — combat replay, player VFX, monster-specific VFX
- `js/events.js` — chest, smith, POI, input and bootstrap
- `assets/maptiles/` — road and terrain art
- `assets/decors/` — non-interactive world decoration art
- `assets/monsters/` — monster illustrations

## Rules after v0.21

1. Do not add new `hotfix*.js` loaders.
2. Update the relevant module directly.
3. Assets stay outside gameplay source code.
4. Validate JS syntax and asset paths before merging to `main`.
5. Keep the current live build untouched until the refactor branch is verified.

## Content preserved

The refactor is intended to preserve the current random map, organic roads, road-only POIs, decorations, day/night, chest 3-choice reward flow, smith, PoE-style supports, monster art, player VFX and monster-specific VFX.
