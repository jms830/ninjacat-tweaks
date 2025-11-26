# Research: NinjaCat Seer Agent Tags & Filter

**Feature**: 001-ninjacat-seer-division  
**Phase**: 0 - Research & Technical Decisions  
**Date**: 2025-11-26

## Overview

This document resolves all NEEDS CLARIFICATION items from the Technical Context and documents technology choices, best practices, and architectural decisions for building a Tampermonkey userscript.

---

## Research Areas

### 1. Tampermonkey Testing Strategy

**Decision**: Manual testing with structured test scenarios + optional Puppeteer integration

**Rationale**:
- Tampermonkey scripts run in a sandboxed browser environment that's difficult to unit test
- Most Tampermonkey developers use manual testing with documented test cases
- For this specific use case, manual testing against live NinjaCat environment is most practical
- Puppeteer can be added later for regression testing if needed

**Alternatives Considered**:
- **Jest + JSDOM**: Rejected - doesn't accurately simulate Tampermonkey environment or real DOM behavior
- **Selenium/Puppeteer with Tampermonkey**: Viable but complex setup for initial development
- **Browser automation tools**: Too heavyweight for current scope

**Implementation Approach**:
- Create detailed manual test scenarios matching each user story
- Document test steps with expected outcomes
- Use browser DevTools console for debugging
- Consider Puppeteer for automated regression tests in future iterations

---

### 2. MutationObserver Best Practices

**Decision**: Debounced MutationObserver with idempotency checks

**Rationale**:
- MutationObserver can fire many times during rapid DOM changes
- Without debouncing, we risk duplicate tag application and performance issues
- Idempotency checks (e.g., checking for existing `.seer-tags` class) prevent duplicate work
- Timeouts of 1000-1600ms balance responsiveness with performance

**Best Practices Identified**:
1. **Observe body with subtree: true** - Catches all SPA navigation changes
2. **Debounce with setTimeout** - Batch rapid changes together
3. **Check for existing elements** - Prevent duplicate tag application
4. **Disconnect/reconnect pattern** - For major DOM rebuilds (not needed here)
5. **Use data attributes for state** - Track which cards have been processed

**Implementation Pattern**:
```javascript
const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runAll, 1100);
});
observer.observe(document.body, { childList: true, subtree: true });
```

**Performance Considerations**:
- Limit observer scope if possible (but SPA requires body observation)
- Early return if no relevant changes detected
- Use querySelectorAll efficiently (cache selectors)

---

### 3. Tampermonkey Metadata Block Requirements

**Decision**: Comprehensive metadata with version control and update URL

**Required Fields**:
- `@name` - Clear, descriptive name
- `@namespace` - Prevents naming conflicts
- `@version` - Semantic versioning (MAJOR.MINOR.PATCH)
- `@description` - Brief feature summary
- `@match` - URL patterns (both ninjacat.io and mymarketingreports.com)
- `@grant` - Permissions (use `none` for this script - no special APIs needed)

**Optional but Recommended**:
- `@author` - Attribution
- `@updateURL` - Auto-update from GitHub
- `@downloadURL` - Installation URL
- `@icon` - Visual identification in Tampermonkey dashboard
- `@run-at` - Document load timing (use `document-end` for DOM availability)

**Implementation Example**:
```javascript
// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents
// @match        https://app.ninjacat.io/agency/data/agents
// @match        https://app.mymarketingreports.com/agency/data/agents
// @grant        none
// @run-at       document-end
// ==/UserScript==
```

---

### 4. DOM Selector Strategy for SPA Resilience

**Decision**: Use data-automation-id attributes as primary selectors with graceful fallbacks

**Rationale**:
- NinjaCat uses `data-automation-id` attributes for testing - these are most stable
- Class names and structure may change with UI updates
- Defensive selectors with null checks prevent script breakage

**Selector Hierarchy** (order of preference):
1. **data-automation-id** - Most stable (test infrastructure)
2. **data-testid** - Also stable if present
3. **Semantic structure** - (e.g., `div.flex.flex-col.gap-4`)
4. **Class names** - Least stable (may change with CSS updates)

**Implementation Pattern**:
```javascript
// Good - resilient to UI changes
const agentCards = document.querySelectorAll('[data-automation-id^="data-table-row"]');
const showAllBtn = document.querySelector('[data-automation-id="data-table-pagination-show-all"]');

// With null checks
if (showAllBtn && showAllBtn.offsetParent !== null) {
    showAllBtn.click();
}
```

**Fallback Strategy**:
- Check for null before accessing elements
- Use optional chaining (`?.`) where appropriate
- Log errors to console for debugging without breaking functionality
- Consider fallback selectors for critical elements

---

### 5. Styling Approach - Inline vs. Stylesheet Injection

**Decision**: Inline styles for simplicity and portability

**Rationale**:
- Inline styles work everywhere without CSP issues
- No additional DOM manipulation needed for `<style>` tags
- Easier to maintain in single-file userscript
- No CSS class naming conflicts with NinjaCat

**Alternatives Considered**:
- **Injected `<style>` tag**: More organized but adds complexity
- **External CSS file**: Not supported in standard Tampermonkey distribution
- **CSS-in-JS library**: Violates zero-dependency principle

**Implementation Approach**:
- Use inline `style` attributes on elements
- Define color constants at top of script for easy customization
- Provide hover effects via `onmouseenter`/`onmouseleave` for interactivity

**Example**:
```javascript
const badge = document.createElement('span');
badge.style = 'background:#F59E0B; color:#fff; padding:2px 7px; border-radius:6px;';
```

---

### 6. Pattern Matching Strategy

**Decision**: Case-insensitive substring matching with priority system

**Rationale**:
- Simple and performant (no regex overhead for basic matching)
- Case-insensitive covers variations (SEO, seo, Seo)
- Multiple tags per agent supported naturally
- Easy to extend with new keywords

**Pattern Structure**:
```javascript
const patterns = {
    seo: ['seo', 'keyword', 'organic', 'serp'],
    pdm: ['paid', 'ppc', 'ad copy', 'google ads'],
    // ... etc
};
```

**Matching Algorithm**:
1. Combine agent name + description into single lowercase string
2. Check each division's keywords with `Array.some()`
3. Add all matching divisions (not just first match)
4. Store matches in `data-seer-tags` attribute for filtering

**Performance**: O(keywords × divisions) per agent = ~50-70 checks per agent, negligible with modern browsers

---

### 7. Filter State Management

**Decision**: Stateless filtering via CSS display property

**Rationale**:
- No state to manage or persist
- Simple show/hide via `element.style.display`
- Filter reapplies automatically when new content loads (via MutationObserver)
- No localStorage needed (user preference not persisted across sessions)

**Implementation**:
```javascript
function filterByTag(tagName) {
    const agentCards = document.querySelectorAll('[data-automation-id^="data-table-row"]');
    agentCards.forEach(card => {
        const tags = card.getAttribute('data-seer-tags').split(',');
        card.style.display = (!tagName || tags.includes(tagName)) ? '' : 'none';
    });
}
```

**Future Enhancement Consideration**:
- Could add localStorage to persist last selected filter
- Could add multi-select filtering (show SEO + PDM)
- Could add "exclude" mode (show all except Creative)

---

### 8. Auto-Expand "Show All" Strategy

**Decision**: Automatic click with visibility check and graceful failure

**Rationale**:
- Simple user convenience feature
- Null check prevents errors if button doesn't exist
- `offsetParent !== null` checks if element is actually visible
- Fails silently without breaking other features

**Implementation**:
```javascript
function expandShowAll() {
    const showAllBtn = document.querySelector('[data-automation-id="data-table-pagination-show-all"]');
    if (showAllBtn && showAllBtn.offsetParent !== null) {
        showAllBtn.click();
    }
}
```

**Edge Cases Handled**:
- Button doesn't exist (new NinjaCat version)
- Button already clicked (pagination disabled)
- Button hidden by CSS
- SPA navigation (re-run on each page load)

---

## Technical Decisions Summary

| Decision Area | Chosen Approach | Key Rationale |
|---------------|----------------|---------------|
| Testing | Manual + documented scenarios | Most practical for Tampermonkey environment |
| DOM Monitoring | Debounced MutationObserver | Handles SPA, prevents duplicate work |
| Selectors | data-automation-id primary | Most stable, least likely to break |
| Styling | Inline styles | Simple, portable, no CSP issues |
| Pattern Matching | Case-insensitive substring | Fast, simple, extensible |
| Filter State | Stateless CSS display | Simple, no persistence complexity |
| Dependencies | Zero external libs | Tampermonkey best practice |

---

## Open Questions / Future Considerations

### Resolved:
- ✅ Testing approach defined (manual with structured scenarios)
- ✅ MutationObserver strategy decided (debounced with idempotency)
- ✅ Selector strategy decided (data-automation-id primary)

### Future Enhancements (Post-MVP):
- **Persistent filter state**: Use localStorage to remember last selected division
- **Multi-select filtering**: Allow showing multiple divisions simultaneously
- **Custom categories**: Let users define their own divisions and keywords
- **Exclude mode**: Filter to hide specific divisions instead of show
- **Export configuration**: Share division/keyword configurations between users
- **Performance metrics**: Add console timing to measure tag application speed

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     NinjaCat Page Load                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  observeAndRun()        │
         │  - Initial setTimeout   │
         │  - Start MutationObs    │
         └──────────┬──────────────┘
                    │
                    ▼
         ┌─────────────────────────┐
         │  runAll() [debounced]   │
         └──────────┬──────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐      ┌────────────────┐
│expandShowAll()│      │ tagAgentCards()│
│- Click button │      │- Find cards    │
└───────────────┘      │- Match patterns│
                       │- Add badges    │
                       │- Set data-attr │
                       └────────┬───────┘
                                │
                                ▼
                       ┌────────────────┐
                       │addTagFilterBar()│
                       │- Create buttons│
                       │- Add handlers  │
                       └────────┬───────┘
                                │
                    [User clicks filter]
                                │
                                ▼
                       ┌────────────────┐
                       │ filterByTag()  │
                       │- Read data-attr│
                       │- Show/hide     │
                       └────────────────┘
```

---

## Dependencies & Environment

### Runtime Environment:
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Extension**: Tampermonkey 4.13+, Greasemonkey 4.0+, or Violentmonkey 2.12+
- **JavaScript**: ES6+ (arrow functions, const/let, template literals, Array methods)

### No External Dependencies:
- ✅ Pure vanilla JavaScript
- ✅ No jQuery, React, or other frameworks
- ✅ No CSS frameworks
- ✅ No build process required

### Browser APIs Used:
- `MutationObserver` - DOM change detection
- `querySelector/querySelectorAll` - Element selection
- `setTimeout/clearTimeout` - Debouncing
- `createElement` - Dynamic UI generation
- `Array.prototype.*` - Iteration and filtering

---

## Next Steps (Phase 1)

1. ✅ Research complete - all technical decisions documented
2. → Create `data-model.md` - Document division categories, pattern structure, and DOM element mappings
3. → Create `contracts/` - Document DOM selectors and userscript metadata contract
4. → Create `quickstart.md` - Installation and usage guide for end users
5. → Update agent context with new technology decisions

