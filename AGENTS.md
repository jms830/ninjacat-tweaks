# ninjacat-tweaks Development Guidelines

## Overview
Tampermonkey userscripts for NinjaCat (app.ninjacat.io). Vanilla JavaScript ES6+, no build system or npm.

## Commands
```bash
node --check userscripts/*.user.js        # Syntax check all scripts
node --check userscripts/FILE.user.js     # Check single file
```

## Structure
- `userscripts/*.user.js` - Main scripts (IIFE, Tampermonkey metadata block)
- `userscripts/*.meta.js` - Metadata-only for updates (version must match .user.js)

## Code Style
- **Pattern**: `(function() { 'use strict'; ... })();` IIFE wrapper
- **Sections**: `// ---- Section Name ----` headers
- **Selectors**: Centralize in `SELECTORS` object with fallbacks
- **Debug**: `debugLog()` gated by localStorage flag
- **Naming**: camelCase functions, JSDoc for `window._nc*` exports
- **Errors**: Try-catch Pinia/Vue access, graceful degradation
- **Security**: `escapeHtml()` for innerHTML, validate URLs before `<a>` injection
- **Performance**: Debounce/throttle MutationObserver callbacks
- **Versions**: Update in 3 places: `@version`, `console.log`, `.meta.js`
