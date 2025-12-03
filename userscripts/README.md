# NinjaCat Userscripts

Tampermonkey userscripts to enhance NinjaCat.

## Scripts Overview

| Script | Version | Install |
|--------|---------|---------|
| Seer Agent Tags & Filter | v2.5.4 | [Install](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-seer-tags.user.js) |
| Chat Export | v2.6.0 | [Install](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-export.user.js) |
| Chat UX Enhancements | v1.7.0 | [Install](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-ux.user.js) |

---

## 1. Seer Agent Tags & Filter (v2.5.4)

**File:** `ninjacat-seer-tags.user.js`  
**Works on:** `https://app.ninjacat.io/agency/data/agents`

### Complete Feature List

#### Tagging & Detection
- Auto-tag agents based on name patterns (10 default categories)
- Manual tagging via tag button (🏷️) on each agent
- Add pattern button (➕) to improve auto-detection
- Manual tags shown with dashed border to distinguish from auto-detected

#### Filtering
- Filter by division/tag (click to toggle, Ctrl+click for multi-select)
- Filter by data source (GA4, GSC, Sheets, Meta, Google Ads, SQL, BigQuery)
- Filter by owner (hide specific users' agents)
- Filter by time (all, 24h, 7d, 30d)
- "My Agents" quick filter
- "Untagged" filter to find uncategorized agents
- Exclude entire categories from view
- Active filter chips with one-click removal
- "Clear All" to reset filters
- Result count: "Showing X of Y agents"

#### Sorting & Grouping
- Sort by name (A-Z, Z-A) or date (newest, oldest)
- Group by division or owner

#### UI Enhancements
- Collapsible Favorites/All Agents sections
- Tags displayed inline on each agent card
- Data source badges on agents
- Filter bar pinned to top of page

#### Customization (Settings)
- Add/edit/delete tag categories
- Customize colors and icons (30 emoji options)
- Edit auto-detection patterns
- Drag to reorder categories
- Search through categories
- Customize data sources
- Reset to defaults

#### Team Sharing
- Export config as share code (copy to clipboard)
- Import from share code
- Export/import as JSON file
- Shares: categories, patterns, data sources, and manual tags

#### Technical
- SPA navigation cleanup (hides UI when leaving agents page)
- Debounced MutationObserver
- Caches DOM references
- Graceful degradation on errors

---

## 2. Chat Export (v2.6.0)

**File:** `ninjacat-chat-export.user.js`  
**Works on:** `https://app.ninjacat.io/agency/data/agents/*/chat/*`

### Complete Feature List

#### Export Formats
- **Print PDF** - Clean output optimized for printing/PDF export
- **Markdown** - Formatted markdown with code blocks preserved
- **Copy Text** - Plain text without formatting

#### Export Controls
- Floating blue export button (📄) in top-right corner
- Dropdown menu with all export options
- Expand All - Expand all collapsed task details
- Collapse All - Collapse all task details

#### PDF Optimization
- Hides sidebars, navigation, and input area
- Expands chat to full width
- Adds print header with agent name and date
- User/Agent labels for clarity
- Links shown in blue
- Page break handling for long conversations

#### Keyboard Shortcuts
- `Ctrl+Shift+M` - Export as Markdown
- `Ctrl+Shift+C` - Copy as plain text

#### Technical
- Injected print styles
- Clean markdown conversion
- SPA navigation aware

---

## 3. Chat UX Enhancements (v1.7.0)

**File:** `ninjacat-chat-ux.user.js`  
**Works on:** `https://app.ninjacat.io/*/chat/*` and `https://app.ninjacat.io/*/agents/*`

### Complete Feature List

#### File Handling
- Multi-file drag & drop anywhere on page
- Visual drop zone overlay with instructions
- Smart targeting (chat input vs. Knowledge tab)
- Supported: `.csv`, `.png`, `.jpg`, `.jpeg`, `.pdf`, `.txt`, `.md`, `.json`
- File type validation with error toast
- Success/error toast notifications

#### Message Queue
- Queue up to 3 messages while agent processes
- Visual queue display below input
- Edit queued messages
- Remove individual messages from queue
- Clear entire queue
- Pause/resume queue
- Auto-sends next message when agent finishes

#### Input Management
- Always-unlocked textarea (removes disabled state)
- Enter key interception for queueing
- Unlocks parent containers too
- Resets processing state on error/cancel

#### URL Handling
- Auto-linkify URLs in chat messages
- URL validation (only http/https)
- Debounced to prevent performance issues

#### Error Recovery
- Detects error state (ERROR conversation state, Resend button visible)
- Yellow warning banner when in error state
- **Injects "Edit last message" button** on cancelled runs (NinjaCat omits this)
- Nuclear state reset function clears all blocking state
- Clears stale streamingMessages, pendingMessages, isStreaming flags

#### Performance
- Throttled MutationObserver (200ms batches)
- Narrowed observer scope (#assistants-ui instead of body)
- Cached DOM references (2s TTL)
- Reduced attribute watching (no 'class' filter)
- Cache invalidation on SPA navigation

#### Debug API (Console)
```js
window._ncCheckProcessing()  // Is agent processing?
window._ncIsErrorState()     // Is conversation in error?
window._ncNuclearReset()     // Clear all blocking state
window._ncClearState()       // Alias for nuclear reset
window._ncDumpState()        // Dump Pinia store state
window._ncStores()           // Get Pinia store refs
window._ncSocket()           // Get WebSocket connection
window._ncGetContext()       // Get conversation context
window._ncClickResend()      // Click native Resend button
window._ncClickEdit()        // Click native Edit button
window._ncManualQueue()      // Queue current input
window._ncForceSend()        // Force send current input
window._ncClearQueue()       // Clear message queue
window._ncResumeQueue()      // Resume paused queue
```

#### Technical
- IIFE wrapper with strict mode
- Pinia store access for state management
- WebSocket instrumentation for debugging
- SPA navigation detection and re-initialization

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click the Install links above
3. Tampermonkey prompts you to install - click **Install**

## Updating

Tampermonkey auto-updates. To force update:
1. Tampermonkey dashboard > Utilities > Check for updates

Or reinstall with cache buster:
```
https://raw.githubusercontent.com/.../script.user.js?nocache=123
```

## Debug Mode (Chat UX)

```js
localStorage.setItem('ninjacat-chat-debug', 'true');
location.reload();
```

---

## Files

| File | Purpose |
|------|---------|
| `*.user.js` | Main script (IIFE, Tampermonkey metadata) |
| `*.meta.js` | Metadata-only for update checks (version must match) |
| `FIXES.md` | Changelog |
| `TROUBLESHOOTING.md` | Help guide |

---

## Code Conventions

- Vanilla JavaScript ES6+ (no npm, no build)
- IIFE wrapper: `(function() { 'use strict'; ... })();`
- Section headers: `// ---- Section Name ----`
- Debug logging: `debugLog()` with localStorage toggle
- Selectors: Centralized in `SELECTORS` object
- Error handling: Try-catch around Pinia/Vue access
- Version in 3 places: `@version`, `console.log`, and `.meta.js`

---

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.
