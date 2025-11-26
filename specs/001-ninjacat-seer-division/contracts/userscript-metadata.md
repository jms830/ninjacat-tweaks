# Userscript Metadata Contract

**Feature**: 001-ninjacat-seer-division  
**Type**: Configuration Contract  
**Version**: 1.0.0  
**Date**: 2025-11-26

## Overview

This contract defines the Tampermonkey userscript metadata block structure. The metadata block is critical for:
- Installation and distribution
- Automatic updates
- Browser permission management
- Script execution timing
- Version tracking

---

## Metadata Block Structure

```javascript
// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents (works with dynamic SPA)
// @match        https://app.ninjacat.io/agency/data/agents
// @match        https://app.mymarketingreports.com/agency/data/agents
// @grant        none
// @run-at       document-end
// @author       NinjaCat Tweaks
// @homepage     https://github.com/jordan/ninjacat-tweaks
// @updateURL    https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.meta.js
// @downloadURL  https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
// ==/UserScript==
```

---

## Required Fields

### @name

**Value**: `NinjaCat Seer Agent Tags & Filter`

**Purpose**: Display name in Tampermonkey dashboard

**Requirements**:
- Clear, descriptive name
- Includes product name (NinjaCat)
- Indicates main features (tags & filter)
- 50 characters or less for UI compatibility

**Validation**: Non-empty string

---

### @namespace

**Value**: `http://tampermonkey.net/`

**Purpose**: Prevents naming conflicts with other scripts

**Requirements**:
- Valid URL format
- Use project-specific namespace for production (e.g., `https://github.com/jordan/ninjacat-tweaks`)
- Default `http://tampermonkey.net/` acceptable for simple scripts

**Validation**: Valid URL

---

### @version

**Value**: `1.0.0`

**Purpose**: Track script versions for updates

**Format**: [Semantic Versioning](https://semver.org/) - `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (DOM selector overhaul, API changes)
- **MINOR**: New features (add new division, add multi-select)
- **PATCH**: Bug fixes (fix duplicate tags, fix filter edge case)

**Update Rules**:
- Increment PATCH for bug fixes
- Increment MINOR for new features (reset PATCH to 0)
- Increment MAJOR for breaking changes (reset MINOR and PATCH to 0)

**Examples**:
- `1.0.0` → `1.0.1` (fixed duplicate tag bug)
- `1.0.1` → `1.1.0` (added persistent filter state)
- `1.1.0` → `2.0.0` (rewrote with new DOM selectors)

**Validation**: Matches regex `^\d+\.\d+\.\d+$`

---

### @description

**Value**: `Seer division tags, filtering, and auto-expand for NinjaCat agents (works with dynamic SPA)`

**Purpose**: Brief summary of what the script does

**Requirements**:
- Clear benefit statement
- Mentions key features
- Indicates compatibility (SPA support)
- 200 characters or less

**Validation**: Non-empty string

---

### @match

**Values**:
```javascript
// @match        https://app.ninjacat.io/agency/data/agents
// @match        https://app.mymarketingreports.com/agency/data/agents
```

**Purpose**: Define which URLs the script runs on

**Format**: [Match Pattern](https://developer.chrome.com/docs/extensions/mv3/match_patterns/)
- Protocol: `https://` (not `http://` - both sites use HTTPS)
- Host: Exact domain (no wildcards needed here)
- Path: Specific page (`/agency/data/agents`)

**Why Two Domains**: NinjaCat has two branded domains:
- `app.ninjacat.io` - Primary domain
- `app.mymarketingreports.com` - White-label domain

**Security**: Specific paths reduce permission scope (only agents page, not entire site)

**Validation**: Valid match pattern syntax

---

### @grant

**Value**: `none`

**Purpose**: Declare special permissions needed

**Options**:
- `none` - No special APIs needed (our choice)
- `GM_getValue` / `GM_setValue` - Persistent storage
- `GM_xmlhttpRequest` - Cross-origin requests
- `unsafeWindow` - Access page's window object

**Rationale**: We use only standard DOM APIs, no special permissions needed

**Security**: `none` is safest - no elevated permissions

---

## Optional Recommended Fields

### @run-at

**Value**: `document-end`

**Purpose**: Control when script executes

**Options**:
- `document-start` - Before any page content loads
- `document-body` - When `<body>` exists (content may still be loading)
- `document-end` - After DOM is loaded (similar to DOMContentLoaded)
- `document-idle` - After page fully loads (similar to window.onload)

**Rationale**: `document-end` ensures DOM is ready but doesn't wait for all resources (images, etc.)

**Why Not Earlier**: Need agent cards to exist in DOM
**Why Not Later**: Want tags to appear as soon as possible

---

### @author

**Value**: `NinjaCat Tweaks`

**Purpose**: Attribution and contact info

**Format**: Name or GitHub username

**Optional but Recommended**: Helps users know who maintains the script

---

### @homepage

**Value**: `https://github.com/jordan/ninjacat-tweaks`

**Purpose**: Link to project repository

**Benefits**:
- Users can file issues
- Users can read documentation
- Users can see source code
- Users can contribute

---

### @updateURL

**Value**: `https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.meta.js`

**Purpose**: Enable automatic update checking

**Format**: URL to metadata-only file (`.meta.js`)

**How It Works**:
1. Tampermonkey periodically checks this URL
2. Compares version number to installed version
3. If newer version found, prompts user to update

**Metadata File Format**:
```javascript
// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// (only metadata, no actual script code)
// ==/UserScript==
```

---

### @downloadURL

**Value**: `https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js`

**Purpose**: Direct download link for updates and installation

**Format**: URL to full userscript file (`.user.js`)

**Installation Flow**:
1. User clicks GitHub raw file URL
2. Tampermonkey detects `.user.js` extension
3. Tampermonkey opens install dialog
4. User confirms installation

---

## Optional Advanced Fields

### @icon

**Value**: `data:image/svg+xml,...` or URL to icon image

**Purpose**: Visual identification in Tampermonkey dashboard

**Format**: Data URI or external image URL

**Example**:
```javascript
// @icon         data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🔍</text></svg>
```

**Benefits**: Easier to identify script in list of many userscripts

**Not Required**: Script works fine without icon

---

### @require

**Value**: URL(s) to external libraries

**Purpose**: Load external JavaScript libraries before script runs

**Example** (if we used jQuery):
```javascript
// @require      https://code.jquery.com/jquery-3.6.0.min.js
```

**Our Usage**: NONE - we use zero external dependencies

**Security Note**: Only use @require from trusted CDNs

---

### @resource

**Value**: Named resources (CSS files, images, etc.)

**Purpose**: Load external resources accessible via `GM_getResourceText`

**Example**:
```javascript
// @resource     customCSS https://example.com/style.css
```

**Our Usage**: NONE - we use inline styles

---

## Metadata Validation

### Validation Rules:

1. **Metadata block must start/end correctly**:
   - Start: `// ==UserScript==`
   - End: `// ==/UserScript==`

2. **Each field must start with `// @`**:
   - Correct: `// @name Value`
   - Incorrect: `//@name Value` (no space)

3. **Required fields must be present**:
   - @name, @namespace, @version, @match, @grant

4. **Version must be valid semver**:
   - Valid: `1.0.0`, `2.15.3`
   - Invalid: `1.0`, `v1.0.0`, `1.0.0-beta`

5. **Match patterns must be valid URLs**:
   - Valid: `https://app.ninjacat.io/*`
   - Invalid: `ninjacat.io`, `http://` (missing protocol)

6. **Grant values must be valid**:
   - Valid: `none`, `GM_getValue`, `GM_setValue`
   - Invalid: `all`, `full-access`

---

## Update Workflow

### Version Update Checklist:

When releasing a new version:

1. **Update @version** in metadata block
2. **Update version history** in CHANGELOG.md
3. **Commit changes** to git
4. **Create git tag**: `git tag v1.0.1`
5. **Push tag**: `git push origin v1.0.1`
6. **Update metadata file** (`.meta.js`) on GitHub
7. **Test auto-update** by changing installed version to older number

### Auto-Update Process:

```
User has v1.0.0 installed
        ↓
Tampermonkey checks @updateURL every 24 hours
        ↓
Finds v1.0.1 in .meta.js
        ↓
Prompts user: "Update available"
        ↓
User clicks "Update"
        ↓
Tampermonkey downloads from @downloadURL
        ↓
Script updated to v1.0.1
```

---

## Distribution Methods

### 1. GitHub Raw URL (Recommended)

**Installation URL**:
```
https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
```

**Benefits**:
- One-click install
- Automatic updates via @updateURL
- Version history via git
- Community contributions via pull requests

**User Instructions**:
1. Install Tampermonkey browser extension
2. Click the raw GitHub URL
3. Tampermonkey opens install dialog
4. Click "Install"

---

### 2. Greasyfork.org (Public Distribution)

**Benefits**:
- Searchable script directory
- User ratings and reviews
- Wider audience reach
- Moderation and safety checks

**Drawbacks**:
- Requires account creation
- Update approval process
- Additional maintenance overhead

**Recommended for**: Popular scripts with 100+ users

---

### 3. Copy-Paste (Simple Distribution)

**Benefits**:
- No GitHub account needed
- Works everywhere
- No dependencies

**Drawbacks**:
- No automatic updates
- Version tracking manual
- Harder to maintain

**User Instructions**:
1. Install Tampermonkey
2. Click Tampermonkey icon → Dashboard
3. Click "+" to create new script
4. Paste script code
5. Ctrl+S to save

---

## Testing Metadata

### Browser Console Test:

```javascript
// Check if script loaded
console.log('Seer Tags Script:', typeof observeAndRun === 'function');

// Check Tampermonkey API
console.log('GM info:', typeof GM_info !== 'undefined' ? GM_info.script : 'Not available');
```

### Expected Output:
```
Seer Tags Script: true
GM info: {
    name: "NinjaCat Seer Agent Tags & Filter",
    version: "1.0.0",
    ...
}
```

---

## Version History

| Version | Date | Changes | Migration Notes |
|---------|------|---------|----------------|
| 1.0.0 | 2025-11-26 | Initial metadata structure | N/A - First release |

---

## Related Contracts

- [dom-selectors.md](./dom-selectors.md) - DOM selector definitions
- [../data-model.md](../data-model.md) - Data structures and entities

---

## Appendix: Full Example

```javascript
// ==UserScript==
// @name         NinjaCat Seer Agent Tags & Filter
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Seer division tags, filtering, and auto-expand for NinjaCat agents (works with dynamic SPA)
// @match        https://app.ninjacat.io/agency/data/agents
// @match        https://app.mymarketingreports.com/agency/data/agents
// @grant        none
// @run-at       document-end
// @author       NinjaCat Tweaks
// @homepage     https://github.com/jordan/ninjacat-tweaks
// @updateURL    https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.meta.js
// @downloadURL  https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
// ==/UserScript==

(function() {
    'use strict';
    
    // Script implementation here...
    
})();
```
