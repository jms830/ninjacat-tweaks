# Data Model: NinjaCat Seer Agent Tags & Filter

**Feature**: 001-ninjacat-seer-division  
**Phase**: 1 - Design  
**Date**: 2025-11-26

## Overview

This document defines the data structures, entities, and relationships used in the Seer Agent Tags & Filter userscript. Since this is a client-side browser script with no backend or persistence, the "data model" consists of configuration objects, DOM element structures, and runtime state.

---

## Core Entities

### 1. Division Category

Represents a Seer division with visual styling and keyword patterns.

**Properties**:
- `key` (string): Internal identifier (e.g., 'seo', 'pdm')
- `name` (string): Display name (e.g., 'SEO', 'PDM')
- `color` (string): Hex color code for badge background
- `icon` (string): Emoji icon for visual identification

**Example**:
```javascript
{
    key: 'seo',
    name: 'SEO',
    color: '#F59E0B',
    icon: '🔍'
}
```

**Full Division Set**:
```javascript
const categories = {
    seo: {
        name: 'SEO',
        color: '#F59E0B',
        icon: '🔍'
    },
    pdm: {
        name: 'PDM',
        color: '#3B82F6',
        icon: '💸'
    },
    analytics: {
        name: 'Analytics',
        color: '#10B981',
        icon: '📈'
    },
    cre: {
        name: 'Creative',
        color: '#EC4899',
        icon: '🎨'
    },
    ops: {
        name: 'Ops',
        color: '#6B7280',
        icon: '🛠️'
    },
    ce: {
        name: 'CE',
        color: '#8B5CF6',
        icon: '🤝'
    },
    pm: {
        name: 'PM',
        color: '#F97316',
        icon: '📅'
    }
};
```

**Validation Rules**:
- All keys must be lowercase alphanumeric
- Colors must be valid hex codes (#RRGGBB)
- Icons should be single emoji characters
- Names should be 2-12 characters for UI consistency

---

### 2. Pattern Set

Defines keyword patterns for automatic division detection.

**Properties**:
- `divisionKey` (string): References a division category key
- `keywords` (string[]): Array of lowercase search terms

**Example**:
```javascript
const patterns = {
    seo: [
        'seo',
        'keyword',
        'organic',
        'serp',
        'search intent',
        'landing page',
        'content gap',
        'people also ask'
    ],
    pdm: [
        'paid',
        'ppc',
        'ad copy',
        'budget',
        'google ads',
        'media mix',
        'campaign',
        'spend',
        'paid search'
    ],
    // ... etc
};
```

**Pattern Matching Rules**:
- All keywords stored in lowercase
- Matching is case-insensitive substring search
- Multi-word phrases supported (e.g., "search intent")
- Order doesn't matter (any match triggers)
- Multiple divisions can match same agent

---

### 3. Agent Card (DOM Element)

Represents a NinjaCat agent in the UI. This is a DOM element we attach data to.

**DOM Structure** (NinjaCat native):
```html
<div data-automation-id="data-table-row-{id}">
    <div class="flex items-center">
        <div>
            <div>
                <p>{Agent Name}</p>
                <!-- Our tags insert here -->
            </div>
        </div>
    </div>
    <!-- More agent details -->
</div>
```

**Augmented Structure** (after script runs):
```html
<div data-automation-id="data-table-row-{id}" data-seer-tags="SEO,Analytics">
    <div class="flex items-center">
        <div>
            <div>
                <p>{Agent Name}</p>
                <div class="seer-tags">
                    <span>🔍 <span style="...">SEO</span></span>
                    <span>📈 <span style="...">Analytics</span></span>
                </div>
            </div>
        </div>
    </div>
</div>
```

**Custom Attributes**:
- `data-seer-tags` (string): Comma-separated list of matching division names
  - Used for filtering logic
  - Example: "SEO,Analytics" or "PDM" or ""
  - Empty string if no matches

**Custom Elements**:
- `.seer-tags` (div): Container for badge elements
  - Only added if agent has at least one tag
  - Prevents duplicate tagging via existence check

---

### 4. Division Badge (DOM Element)

Visual badge component representing a division tag.

**DOM Structure**:
```html
<div class="seer-tags" style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">
    <span style="margin-right:5px;">
        {icon}
        <span style="background:{color}; color:#fff; padding:2px 7px; border-radius:6px; font-size:12px;">
            {name}
        </span>
    </span>
</div>
```

**Properties** (inline styles):
- Container: `display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;`
- Badge wrapper: `margin-right:5px;`
- Badge pill: `background:{color}; color:#fff; padding:2px 7px; border-radius:6px; font-size:12px;`

**Visual Design**:
- Pills display inline with wrapping
- Icon precedes text label
- Color-coded by division
- 6px gap between multiple badges
- Inserted below agent name in card

---

### 5. Filter Bar (DOM Element)

UI component for division filtering.

**DOM Structure**:
```html
<div id="seer-tag-bar" style="display:flex; gap:12px; margin:18px 0 12px 0; flex-wrap:wrap; align-items:center;">
    <button data-tag="SEO" style="background:#F59E0B; color:#fff; ...">🔍 SEO</button>
    <button data-tag="PDM" style="background:#3B82F6; color:#fff; ...">💸 PDM</button>
    <!-- ... more division buttons ... -->
    <button style="background:#E5E7EB; color:#111; ...">Reset</button>
</div>
```

**Properties**:
- Container ID: `seer-tag-bar` (unique identifier, prevents duplicates)
- Layout: Flexbox with wrapping
- Placement: Inserted before `.flex.flex-col.gap-4` (main agent container)

**Button Styles**:
```javascript
// Division buttons
`
    background:{color};
    color:#fff;
    border:none;
    border-radius:9px;
    padding:7px 15px;
    font-size:15px;
    font-weight:600;
    letter-spacing:0.5px;
    cursor:pointer;
    transition:background 0.2s;
`

// Reset button
`
    margin-left:12px;
    background:#E5E7EB;
    color:#111;
    border:none;
    border-radius:7px;
    padding:7px 16px;
    font-size:15px;
    font-weight:600;
    cursor:pointer;
`
```

**Interactive States**:
- Hover: Background darkens by 15% (factor 0.85)
- Active filter: `box-shadow: 0 0 0 3px #000`
- Reset selected: `box-shadow: 0 0 0 2px #3B82F6`

---

## State Management

### Filter State

**Type**: Transient (not persisted)

**Storage**: None - reconstructed on each filter action

**Current Filter**:
- Determined by which button has active styling
- Applied by reading `data-seer-tags` from each card
- Reset by showing all cards (display: '')

**Flow**:
1. User clicks division button (e.g., "SEO")
2. `filterByTag('SEO')` is called
3. Script iterates all agent cards
4. Reads `data-seer-tags` attribute
5. Shows cards if tags include 'SEO', hides otherwise
6. Updates button visual state

---

## Relationships

```
Division Category (1) ----< (N) Pattern Set
                                   |
                                   | (matches)
                                   v
                              Agent Card (DOM)
                                   |
                                   | (has many)
                                   v
                             Division Badge (DOM)


Filter Bar (1) ----< (N) Division Buttons
                                   |
                                   | (filters)
                                   v
                              Agent Card (DOM)
                              [reads data-seer-tags]
```

---

## Data Flow

### 1. Page Load / SPA Navigation

```
1. MutationObserver detects DOM change
2. After debounce delay (1100ms)
3. runAll() executes
   └─> tagAgentCards()
       ├─> Find all [data-automation-id^="data-table-row"]
       ├─> For each card:
       │   ├─> Extract text content (name + description)
       │   ├─> Check for existing .seer-tags (skip if present)
       │   ├─> Match against pattern sets
       │   ├─> Store results in data-seer-tags attribute
       │   └─> Create and append badge DOM elements
       └─> addTagFilterBar()
           ├─> Check for existing #seer-tag-bar (skip if present)
           ├─> Create filter bar DOM
           ├─> Create button for each division
           ├─> Attach click handlers
           └─> Insert before agent list
```

### 2. Filter Interaction

```
1. User clicks division button (e.g., "PDM")
2. filterByTag('PDM') called
3. Query all [data-automation-id^="data-table-row"]
4. For each card:
   ├─> Read data-seer-tags attribute
   ├─> Split by comma to get array
   ├─> Check if 'PDM' is in array
   ├─> Set display: '' (show) or 'none' (hide)
5. Update button styling:
   ├─> Add box-shadow to clicked button
   └─> Remove box-shadow from others
```

### 3. Reset Filter

```
1. User clicks "Reset" button
2. filterByTag(null) called
3. Set all cards to display: ''
4. Update button styling:
   ├─> Remove box-shadow from division buttons
   └─> Add box-shadow to Reset button
```

---

## Extensibility

### Adding New Divisions

To add a new division (e.g., "Social Media"):

1. Add to `categories` object:
```javascript
social: {
    name: 'Social',
    color: '#14B8A6',
    icon: '📱'
}
```

2. Add to `patterns` object:
```javascript
social: ['social media', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
```

3. No code changes needed - filter bar and tagging logic are data-driven

### Customizing Keywords

Edit the `patterns` object:
```javascript
patterns.seo.push('meta description', 'schema markup');
```

### Customizing Colors

Edit the `categories` object:
```javascript
categories.seo.color = '#FF6600'; // New orange
```

---

## Performance Characteristics

### Memory Footprint
- **Categories object**: ~500 bytes
- **Patterns object**: ~1 KB
- **DOM elements per agent**: ~300-500 bytes (badge elements)
- **Total for 100 agents**: ~30-50 KB additional DOM

### Computation Complexity
- **Tag matching**: O(keywords × divisions × agents) = ~50 × 7 × 100 = 35,000 operations
- **Per agent**: 50-70 substring checks (< 1ms per agent)
- **Total tagging time**: 50-100ms for 100 agents
- **Filter application**: O(agents) = 100 checks (< 5ms)

### DOM Operations
- **Initial render**: N agent cards × M tags per card ≈ 100-200 DOM insertions
- **Filter toggle**: N agent cards × 1 style update = 100 style changes
- **MutationObserver**: Fires on every DOM change, debounced to ~1/second

---

## Validation & Error Handling

### Pattern Matching
- **Invalid patterns**: Gracefully ignored (no matches)
- **Missing keywords**: Agent gets no tags (valid state)
- **Duplicate keywords**: Acceptable (no impact)

### DOM Operations
- **Element not found**: Null checks prevent errors
- **Structure changes**: Selectors may fail gracefully
- **Duplicate tagging**: Prevented by `.seer-tags` existence check
- **Duplicate filter bar**: Prevented by `#seer-tag-bar` existence check

### User Input
- **No user input**: System is fully automated
- **Filter clicks**: Validated by button existence
- **Tag names**: Validated against category keys

---

## Future Data Model Extensions

### Phase 2+ Considerations:

1. **Persistent Filter State**:
```javascript
{
    lastSelectedDivision: 'SEO',
    timestamp: 1732635600000
}
// Stored in localStorage
```

2. **Custom Categories**:
```javascript
{
    userId: 'user@example.com',
    customCategories: [
        { name: 'My Team', keywords: [...], color: '#...', icon: '...' }
    ]
}
// Stored in localStorage or synced via Tampermonkey storage API
```

3. **Multi-Select Filters**:
```javascript
{
    activeFilters: ['SEO', 'Analytics'],
    filterMode: 'AND' | 'OR' // Show agents matching all or any
}
```

4. **Agent Metadata Caching**:
```javascript
{
    agentId: '12345',
    detectedTags: ['SEO', 'Analytics'],
    lastUpdated: 1732635600000
}
// Cache to avoid re-running pattern matching on every SPA navigation
```

---

## Summary

The data model for this userscript is deliberately simple:
- **Configuration objects** define divisions and patterns
- **DOM attributes** store runtime state (`data-seer-tags`)
- **No persistence** - everything recalculated on each page load
- **Extensible** - new divisions and keywords can be added without code changes
- **Performant** - designed for 100-200 agents with negligible overhead

This stateless approach aligns with Tampermonkey best practices and keeps the script simple, maintainable, and easy to customize.
