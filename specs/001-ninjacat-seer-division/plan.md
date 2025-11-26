# Implementation Plan: NinjaCat Seer Agent Tags & Filter

**Branch**: `001-ninjacat-seer-division` | **Date**: 2025-11-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ninjacat-seer-division/spec.md`

## Summary

Build a Tampermonkey userscript that automatically categorizes NinjaCat agents by Seer division (SEO, PDM, Analytics, Creative, Ops, CE, PM) using pattern matching, displays visual division badges, and provides filtering UI. The script must handle SPA behavior using MutationObserver and work on both ninjacat.io and mymarketingreports.com domains.

## Technical Context

**Language/Version**: JavaScript ES6+ (Tampermonkey environment, modern browser support)  
**Primary Dependencies**: None (vanilla JavaScript, no external libraries)  
**Storage**: N/A (stateless, no persistence required)  
**Testing**: Manual testing on live NinjaCat environment (automated testing via NEEDS CLARIFICATION: Tampermonkey testing framework or browser automation)  
**Target Platform**: Modern browsers (Chrome, Firefox, Edge, Safari) with Tampermonkey/Greasemonkey/Violentmonkey extensions  
**Project Type**: Single userscript file (browser extension)  
**Performance Goals**: <100ms tag application per page load, <50ms filter response time, no visible lag on SPA transitions  
**Constraints**: Must not interfere with NinjaCat's native functionality, must handle DOM structure changes gracefully, must work without external CDN dependencies  
**Scale/Scope**: ~50-200 agents per page view, pattern matching across 7 divisions with 5-10 keywords each, continuous DOM monitoring via MutationObserver

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution Version**: 1.0.0 (Ratified: 2025-11-26)

### Phase 0 Assessment (Pre-Research): ✅ PASSED

✅ **I. Single-File Simplicity**: Single `.user.js` file architecture chosen (see Project Structure)
✅ **II. Zero External Dependencies**: Vanilla JavaScript only, no external libraries or CDNs
✅ **III. Graceful Degradation**: All DOM queries include null checks, fallback selectors defined in contracts/dom-selectors.md
✅ **IV. Manual Testing First**: Structured test scenarios in spec.md, manual testing on live NinjaCat environment
✅ **V. Semantic Versioning**: Version 1.0.0 in userscript metadata, semantic versioning workflow documented in contracts/userscript-metadata.md

### Phase 1 Re-Assessment (Post-Design): ✅ PASSED

✅ **Browser Compatibility**: ES6+ targeting modern browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
✅ **Distribution Methods**: GitHub raw URL (primary) + copy-paste installation (fallback) per quickstart.md
✅ **Documentation**: Complete quickstart.md, inline metadata block, DOM selector contracts, data model documentation
✅ **Performance**: Debounced MutationObserver (<100ms tag application), inline styles, no external requests

**Result**: All constitutional principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-ninjacat-seer-division/
├── plan.md              # This file
├── research.md          # Phase 0 output - Tampermonkey best practices
├── data-model.md        # Phase 1 output - Division categories and patterns
├── quickstart.md        # Phase 1 output - Installation and usage guide
└── contracts/           # Phase 1 output - DOM selectors and userscript metadata
```

### Source Code (repository root)

```text
userscripts/
├── ninjacat-seer-tags.user.js    # Main userscript file
├── README.md                      # Installation instructions
└── CHANGELOG.md                   # Version history

tests/
└── manual/
    └── test-scenarios.md          # Manual test cases for each user story

docs/
├── installation.md                # How to install Tampermonkey and load script
├── customization.md               # How to customize divisions and patterns
└── troubleshooting.md             # Common issues and solutions
```

**Structure Decision**: Single userscript architecture chosen because:
- Tampermonkey best practice is one file per script for easy distribution
- No build process needed - users can directly install from GitHub raw URL
- Simple copy-paste installation for users without GitHub
- All logic self-contained in closure for namespace isolation

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitutional violations to justify (constitution pending definition, but architecture aligns with userscript best practices).
