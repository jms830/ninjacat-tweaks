# ninjacat-tweaks Development Guidelines

## Project Overview
Tampermonkey userscripts for NinjaCat (app.ninjacat.io). Vanilla JavaScript ES6+, no build system.

## Commands
```bash
node --check userscripts/*.user.js   # Syntax check (no npm/test framework)
```

## Project Structure
- `userscripts/*.user.js` - Main scripts (IIFE pattern, Tampermonkey metadata block)
- `userscripts/*.meta.js` - Metadata-only files for update checks (keep version in sync)
- `specs/` - Feature specifications and DOM selector contracts

## Code Style
- **IIFE wrapper**: `(function() { 'use strict'; ... })();`
- **Sections**: Use `// ---- Section Name ----` comment headers
- **Debug logging**: `debugLog()` with localStorage toggle (`ninjacat-chat-debug`)
- **DOM selectors**: Centralize in `SELECTORS` object, use multiple fallbacks
- **State**: Module-level `let` variables at top of IIFE
- **Functions**: camelCase, JSDoc for exported `window._nc*` debug functions
- **Error handling**: Try-catch around Pinia/Vue access, graceful degradation
- **No external deps**: Vanilla JS only, no libraries

## Conventions
- Version in 3 places: `@version`, `console.log`, and `.meta.js` (keep in sync)
- Debounce MutationObserver callbacks that do DOM queries
- Validate URLs before injecting `<a>` elements
- Use `escapeHtml()` for user content in innerHTML
