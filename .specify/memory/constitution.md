<!--
SYNC IMPACT REPORT - Constitution Update

Version Change: INITIAL → 1.0.0
Rationale: Initial constitution ratification for ninjacat-tweaks project

Modified Principles: N/A (Initial creation)
Added Sections:
  - I. Single-File Simplicity
  - II. Zero External Dependencies
  - III. Graceful Degradation (NON-NEGOTIABLE)
  - IV. Manual Testing First
  - V. Semantic Versioning
  - Browser Compatibility Standards
  - Distribution & User Experience

Removed Sections: N/A (Initial creation)

Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check section aligns with principles
  ✅ spec-template.md - No changes needed (technology-agnostic)
  ✅ tasks-template.md - No changes needed (flexible testing approach)
  ⚠️  No commands directory exists - skip command file updates

Follow-up TODOs:
  - None - all placeholders resolved

Date: 2025-11-26
-->

# NinjaCat Tweaks Constitution

## Core Principles

### I. Single-File Simplicity

Every userscript MUST be a single, self-contained `.user.js` file that can be distributed via direct URL or copy-paste installation.

**Rationale**: Tampermonkey users expect simple, portable scripts. Single-file distribution enables:
- One-click installation from GitHub raw URLs
- Copy-paste installation without build tools
- Zero configuration for end users
- Easy auditing of complete script source

**Rules**:
- No build process or transpilation required
- All logic self-contained within IIFE closure
- No external file dependencies (CSS, images, etc.)
- Inline styles and data only

**Exceptions**: Metadata-only `.meta.js` files for update checking are permitted and encouraged for GitHub distribution.

---

### II. Zero External Dependencies

Scripts MUST NOT depend on external JavaScript libraries, CDNs, or third-party services.

**Rationale**: External dependencies introduce:
- Security risks (compromised CDNs)
- Availability risks (CDN downtime)
- Performance overhead (additional HTTP requests)
- Content Security Policy conflicts
- Complexity in offline/airgapped environments

**Rules**:
- Pure vanilla JavaScript (ES6+ browser APIs only)
- No jQuery, React, Vue, or other frameworks
- No `@require` directives (except in extraordinary, justified cases)
- No external API calls for script functionality
- No analytics or tracking services

**Permitted**: Browser-native APIs (MutationObserver, fetch for target site data, localStorage, etc.)

---

### III. Graceful Degradation (NON-NEGOTIABLE)

Scripts MUST NOT break or interfere with the host site's functionality if the script fails or encounters errors.

**Rationale**: User trust is paramount. A broken enhancement script must not prevent users from accessing core functionality of the target site (NinjaCat, etc.).

**Rules**:
- All DOM queries MUST check for null/undefined before access
- All operations wrapped in try-catch where appropriate
- Fail silently with console logging (not user-facing alerts)
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Element existence checks before manipulation
- Selector failures degrade gracefully (use fallbacks or skip)

**Testing**: Every script MUST be tested with:
- Empty/missing target elements
- Rapid DOM changes (SPA stress testing)
- Console cleared of uncaught errors

**Violation Example**: `document.querySelector('.agent').textContent = 'foo'` (crashes if null)  
**Correct**: `const el = document.querySelector('.agent'); if (el) el.textContent = 'foo';`

---

### IV. Manual Testing First

Testing strategy MUST prioritize structured manual testing over automated unit tests.

**Rationale**: Tampermonkey scripts run in live browser environments that are difficult to mock accurately. Manual testing against real target sites provides:
- Real DOM structures and timing
- Actual SPA navigation behavior
- True browser API behavior
- User-facing validation

**Rules**:
- Document manual test scenarios for each user story in spec.md
- Test on live target sites (e.g., app.ninjacat.io)
- Test on ALL specified domains (@match URLs)
- Test SPA navigation and dynamic content loading
- Test edge cases (empty lists, rapid updates, missing elements)
- Record test evidence (screenshots/videos for complex flows)

**Optional Enhancements**:
- Browser automation (Puppeteer/Playwright) for regression testing
- Console testing scripts for selector validation
- Performance profiling for DOM-heavy operations

**Not Required**: Unit tests with JSDOM/Jest (but acceptable if beneficial)

---

### V. Semantic Versioning

All scripts MUST follow semantic versioning (MAJOR.MINOR.PATCH) in the `@version` metadata field.

**Format**: `X.Y.Z` where:
- **MAJOR (X)**: Breaking changes
  - DOM selector overhaul (requires user intervention)
  - Metadata changes that break auto-updates
  - Feature removal
  - Incompatible behavior changes
- **MINOR (Y)**: New features (backward compatible)
  - New divisions/categories
  - New filter modes
  - Additional UI enhancements
  - New configuration options
- **PATCH (Z)**: Bug fixes and refinements
  - Fix duplicate tags
  - Fix selector edge cases
  - Performance improvements
  - Documentation updates

**Update Workflow**:
1. Increment version in `@version` field
2. Update CHANGELOG.md with changes
3. Update `.meta.js` file (if using GitHub updates)
4. Git tag: `git tag vX.Y.Z`
5. Push tag: `git push origin vX.Y.Z`

**Example Progression**:
- `1.0.0` - Initial release
- `1.0.1` - Fixed duplicate tag bug
- `1.1.0` - Added persistent filter state
- `2.0.0` - Rewrote with new DOM selectors (breaking)

---

## Browser Compatibility Standards

Scripts MUST support modern browsers with Tampermonkey/Greasemonkey extensions.

### Minimum Supported Versions

- **Chrome/Edge**: 90+ (ES6+ support)
- **Firefox**: 88+ (ES6+ support)
- **Safari**: 14+ (with Tampermonkey)
- **Opera**: 76+ (Chromium-based)

### Required Browser APIs

Scripts MAY use these APIs without fallbacks:
- ES6+ syntax (arrow functions, const/let, template literals, destructuring)
- `querySelector` / `querySelectorAll`
- `MutationObserver`
- `Array.prototype` methods (map, filter, forEach, some, etc.)
- `Promise` and `async`/`await`
- `fetch` API
- `localStorage` / `sessionStorage`

### Forbidden APIs (Unreliable in Tampermonkey)

- `eval()` and `Function()` constructor (security risk)
- `document.write()` (conflicts with SPA behavior)
- `alert()` / `confirm()` / `prompt()` (poor UX, use DOM modals)
- Synchronous XHR (deprecated, use fetch)

### Mobile Support

Mobile browser support is **OPTIONAL** - Tampermonkey has limited mobile support. Desktop browser experience is primary focus.

---

## Distribution & User Experience

### Installation Methods

Scripts MUST support at least TWO installation methods:

1. **GitHub Raw URL** (Preferred)
   - Enables one-click installation
   - Supports automatic updates via `@updateURL`
   - Example: `https://raw.githubusercontent.com/user/repo/master/script.user.js`

2. **Copy-Paste Installation**
   - For users without GitHub access
   - Copy full script source → Tampermonkey dashboard → Paste → Save
   - No dependencies or external files required

**Optional**: Greasyfork.org publication for wider reach

### Documentation Requirements

Every userscript MUST include:

- **Inline metadata block** (`// ==UserScript==`)
  - Clear `@name` and `@description`
  - All target URLs in `@match` directives
  - Correct `@grant` permissions (prefer `none`)
  - `@run-at document-end` (or justified alternative)

- **Quickstart guide** (quickstart.md in specs/)
  - Installation instructions (both methods)
  - Usage examples with screenshots
  - Troubleshooting common issues
  - Customization guide (if applicable)

- **Inline comments** in script code
  - Function purpose and behavior
  - Complex logic explanations
  - Edge case handling notes
  - DOM selector stability warnings

### User Communication

- Use `console.log()` for debug information (prefixed with script name)
- Use `console.error()` for failures (not user-facing alerts)
- Visual feedback via DOM manipulation (not intrusive popups)
- Performance targets:
  - Page load impact: < 100ms
  - Filter/interaction response: < 50ms
  - Memory footprint: < 5MB additional DOM

---

## Governance

### Constitutional Authority

This constitution supersedes all other development practices and guidelines. All feature specifications, implementation plans, and code reviews MUST verify compliance with these principles.

### Amendment Process

1. **Proposal**: Document proposed change with rationale
2. **Impact Analysis**: Identify affected scripts and migration effort
3. **Review**: Team/maintainer approval required
4. **Version Bump**: Increment constitution version semantically
5. **Migration Plan**: Update affected scripts and documentation
6. **Ratification**: Update LAST_AMENDED_DATE, log change in Sync Impact Report

### Compliance Verification

- All PRs/reviews MUST verify constitutional compliance
- Constitution Check in plan.md template enforces pre-implementation gates
- Violations MUST be justified in Complexity Tracking section
- Unjustified violations MUST be resolved before merge

### Principle Violations

Violations are permitted ONLY when:
1. Justified in plan.md Complexity Tracking table
2. Simpler compliant alternatives documented as rejected
3. Specific, measurable benefit articulated
4. Migration/removal plan exists for future compliance

### Development Guidance

- **Active Technologies**: See AGENTS.md for current tech stack
- **Project Structure**: See individual feature plan.md files
- **Testing Strategy**: See feature spec.md acceptance scenarios

---

**Version**: 1.0.0 | **Ratified**: 2025-11-26 | **Last Amended**: 2025-11-26
