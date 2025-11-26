# DOM Selectors Contract

**Feature**: 001-ninjacat-seer-division  
**Type**: Interface Contract  
**Version**: 1.0.0  
**Date**: 2025-11-26

## Overview

This contract defines the DOM selectors used to interact with the NinjaCat UI. These selectors are the **interface boundary** between our userscript and the NinjaCat application.

**Critical Note**: These selectors are based on NinjaCat's current DOM structure. If NinjaCat updates their UI, these selectors may break. This document serves as a reference for maintaining the script.

---

## Primary Selectors

### Agent Card Container

**Selector**: `[data-automation-id^="data-table-row"]`

**Purpose**: Identifies individual agent cards in the list

**Returns**: NodeList of all visible agent cards

**Stability**: HIGH - `data-automation-id` is typically used for testing and is more stable than class names

**Structure**:
```html
<div data-automation-id="data-table-row-{unique-id}">
    <!-- Agent card content -->
</div>
```

**Usage**:
```javascript
const agentCards = document.querySelectorAll('[data-automation-id^="data-table-row"]');
```

**Fallback Strategy**: If this selector fails, look for:
1. `[data-testid^="agent-card"]` (if test IDs are used)
2. `.agent-card` or similar semantic class name
3. Parent container with known structure

---

### Show All Button

**Selector**: `[data-automation-id="data-table-pagination-show-all"]`

**Purpose**: Auto-expands the agent list to show all agents

**Returns**: Single button element or null

**Stability**: HIGH - Automation ID for testing

**Structure**:
```html
<button data-automation-id="data-table-pagination-show-all">
    Show All
</button>
```

**Usage**:
```javascript
const showAllBtn = document.querySelector('[data-automation-id="data-table-pagination-show-all"]');
if (showAllBtn && showAllBtn.offsetParent !== null) {
    showAllBtn.click();
}
```

**Visibility Check**: `offsetParent !== null` ensures button is actually visible (not hidden by CSS)

**Fallback Strategy**: If button doesn't exist, feature gracefully degrades (user can still manually click "Show All")

---

### Agent Name Element

**Selector**: `div.flex.items-center > div > div > p` (within agent card)

**Purpose**: Locate the agent name paragraph to insert tags below it

**Returns**: Paragraph element containing agent name

**Stability**: MEDIUM - Based on Tailwind utility classes which may change

**Structure**:
```html
<div class="flex items-center">
    <div>
        <div>
            <p>{Agent Name}</p>
            <!-- Tags inserted here -->
        </div>
    </div>
</div>
```

**Usage**:
```javascript
const nameDiv = card.querySelector('div.flex.items-center > div > div > p');
if (nameDiv && nameDiv.parentElement) {
    nameDiv.parentElement.appendChild(tagDiv);
}
```

**Fallback Strategy**:
```javascript
// If specific selector fails, append to card root
card.appendChild(tagDiv);
```

---

### Main Content Container

**Selector**: `.flex.flex-col.gap-4`

**Purpose**: Identify main agent list container to insert filter bar above it

**Returns**: Main content column element

**Stability**: MEDIUM - Tailwind utility classes

**Structure**:
```html
<div class="flex flex-col gap-4">
    <!-- Agent cards rendered here -->
</div>
```

**Usage**:
```javascript
const main = document.querySelector('.flex.flex-col.gap-4');
if (main && main.parentNode) {
    main.parentNode.insertBefore(bar, main);
}
```

**Fallback Strategy**:
```javascript
// Fallback to body if main container not found
document.body.insertBefore(bar, document.body.firstChild);
```

---

## Script-Generated Selectors

These selectors identify elements created by our script.

### Seer Tags Container

**Selector**: `.seer-tags`

**Purpose**: Identify existing tag container to prevent duplicate tagging

**Created By**: `tagAgentCards()` function

**Structure**:
```html
<div class="seer-tags" style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">
    <!-- Badge elements -->
</div>
```

**Usage**:
```javascript
if (card.querySelector('.seer-tags')) return; // Skip if already tagged
```

---

### Filter Bar

**Selector**: `#seer-tag-bar`

**Purpose**: Identify existing filter bar to prevent duplicates

**Created By**: `addTagFilterBar()` function

**Structure**:
```html
<div id="seer-tag-bar" style="display:flex; gap:12px; margin:18px 0 12px 0;">
    <!-- Filter buttons -->
</div>
```

**Usage**:
```javascript
if (document.getElementById('seer-tag-bar')) return; // Skip if already exists
```

---

## Data Attributes

Custom data attributes used for state management.

### data-seer-tags

**Attribute**: `data-seer-tags`

**Purpose**: Store matched division names for filtering

**Format**: Comma-separated string (e.g., `"SEO,Analytics"` or `""`)

**Attached To**: Agent card elements (`[data-automation-id^="data-table-row"]`)

**Usage**:
```javascript
// Set tags
card.setAttribute('data-seer-tags', tags.map(t => t.name).join(','));

// Read tags for filtering
const tags = card.getAttribute('data-seer-tags').split(',');
```

**Validation**: Empty string if no tags match (not null/undefined)

---

### data-tag

**Attribute**: `data-tag`

**Purpose**: Associate filter button with division name

**Format**: String matching division name (e.g., `"SEO"`, `"PDM"`)

**Attached To**: Filter bar buttons

**Usage**:
```javascript
btn.setAttribute('data-tag', tag.name);
btn.onclick = () => filterByTag(tag.name);
```

---

## Selector Stability Matrix

| Selector | Type | Stability | Break Risk | Mitigation |
|----------|------|-----------|------------|------------|
| `[data-automation-id^="data-table-row"]` | Test ID | HIGH | Low | Used for automated testing |
| `[data-automation-id="...show-all"]` | Test ID | HIGH | Low | Test infrastructure |
| `div.flex.items-center > div > div > p` | Tailwind | MEDIUM | Medium | Fallback to card root |
| `.flex.flex-col.gap-4` | Tailwind | MEDIUM | Medium | Fallback to body |
| `.seer-tags` | Custom | HIGH | None | We control this |
| `#seer-tag-bar` | Custom | HIGH | None | We control this |

---

## Breaking Change Detection

### Signs a Selector is Broken:

1. **Agent cards not found**: `querySelectorAll('[data-automation-id^="data-table-row"]')` returns empty NodeList
   - Symptom: No tags appear on any agents
   - Debug: Check browser console for errors, inspect agent card HTML

2. **Show All button not found**: `querySelector('[data-automation-id="...show-all"]')` returns null
   - Symptom: Agent list not auto-expanded
   - Impact: MINOR - user can manually click button

3. **Name element not found**: Tag insertion point missing
   - Symptom: Tags appear in wrong location or not at all
   - Fallback: Tags appended to card root (still visible but misplaced)

4. **Main container not found**: Filter bar insertion point missing
   - Symptom: Filter bar appears at top of page instead of above agent list
   - Fallback: Inserted at body top (still functional but misplaced)

---

## Maintenance Guide

### When NinjaCat Updates Break Selectors:

1. **Open browser DevTools** on NinjaCat agents page
2. **Inspect agent card structure** to find new selectors
3. **Priority**: Look for `data-automation-id` or `data-testid` attributes first
4. **Update selectors** in this contract document
5. **Update script code** with new selectors
6. **Test thoroughly** on both ninjacat.io and mymarketingreports.com
7. **Version bump** the userscript

### Selector Update Checklist:

- [ ] New selector tested in browser console
- [ ] Fallback strategy defined
- [ ] Contract document updated
- [ ] Script code updated
- [ ] Both domains tested (ninjacat.io + mymarketingreports.com)
- [ ] Edge cases tested (empty list, single agent, 100+ agents)
- [ ] Version number incremented

---

## Testing Selectors

### Browser Console Test Script:

```javascript
// Test agent cards
console.log('Agent cards:', document.querySelectorAll('[data-automation-id^="data-table-row"]').length);

// Test show all button
console.log('Show All button:', document.querySelector('[data-automation-id="data-table-pagination-show-all"]'));

// Test main container
console.log('Main container:', document.querySelector('.flex.flex-col.gap-4'));

// Test name elements
const cards = document.querySelectorAll('[data-automation-id^="data-table-row"]');
cards.forEach((card, i) => {
    const name = card.querySelector('div.flex.items-center > div > div > p');
    console.log(`Card ${i} name element:`, name ? name.textContent : 'NOT FOUND');
});
```

### Expected Output:
```
Agent cards: 50-200 (depending on list size)
Show All button: <button> or null (if already expanded)
Main container: <div class="flex flex-col gap-4">
Card 0 name element: "SEO Keyword Research"
Card 1 name element: "Paid Media Optimizer"
...
```

---

## Version History

| Version | Date | Changes | Reason |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-26 | Initial contract | Feature launch |

---

## Related Contracts

- [userscript-metadata.md](./userscript-metadata.md) - Tampermonkey metadata block
- [../data-model.md](../data-model.md) - Division categories and patterns

