# NinjaCat Tweaks

Browser userscripts to enhance the [NinjaCat](https://ninjacat.io) experience.

## Available Scripts

| Script | Version | Description |
|--------|---------|-------------|
| [Seer Agent Tags & Filter](#1-seer-agent-tags--filter) | v2.5.4 | Tag, filter, and organize agents on the Agents page |
| [Chat Export](#2-chat-export) | v2.6.0 | Export chat conversations to PDF or Markdown |
| [Chat UX Enhancements](#3-chat-ux-enhancements) | v1.7.0 | Drag-drop files, message queue, error recovery, and more |

---

## Quick Install

### Prerequisites
Install [Tampermonkey](https://www.tampermonkey.net/) for your browser:

| Browser | Install Link |
|---------|--------------|
| Chrome/Edge | [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Safari | [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089) |

### Install Scripts

Click the links below - Tampermonkey will prompt you to install:

1. **[Install Seer Agent Tags & Filter](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-seer-tags.user.js)**
2. **[Install Chat Export](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-export.user.js)**
3. **[Install Chat UX Enhancements](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/ninjacat-chat-ux.user.js)**

---

## 1. Seer Agent Tags & Filter

**Version:** v2.5.4  
**Works on:** `https://app.ninjacat.io/agency/data/agents`

Automatically tags and filters agents on the NinjaCat Agents page by division, data source, and custom criteria.

### Features

| Feature | Description |
|---------|-------------|
| **Auto-tagging** | Tags agents based on name patterns (SEO, PDM, ANA, CE, OPS, WIP, DNU, PROD, CLIENT, UTILITY) |
| **Filter bar** | Filter agents by tag, data source, owner, or time period |
| **Manual tagging** | Click the tag button to manually assign/override tags |
| **My Agents filter** | Quick filter to show only agents you own |
| **Hide by owner** | Exclude specific team members' agents from view |
| **Data source filters** | Filter by GA4, Search Console, Google Sheets, Meta Ads, Google Ads, SQL, BigQuery |
| **Time filters** | Filter by recently updated (24h, 7d, 30d) |
| **Sort & Group** | Sort by name/date, group by division/owner |
| **Exclude categories** | Hide entire tag categories from view |
| **Collapsible sections** | Collapse Favorites and All Agents sections |
| **Team sharing** | Export/import configurations via share code or file |
| **Full customization** | Add your own tags, patterns, colors, and icons via Settings |
| **Add pattern button** | Quickly add new auto-detection patterns from any agent |
| **Result count** | Shows "Showing X of Y agents" when filtering |
| **SPA navigation cleanup** | Automatically hides UI when navigating away from agents list |

### Default Tag Categories

| Tag | Icon | Auto-detection patterns |
|-----|------|------------------------|
| ANA | 📈 | `[ana]`, `analytics`, `ga4`, `event drop`, `anomalie`, `drop-off` |
| PDM | 💸 | `[pdm]`, `paid`, `ppc`, `ad copy`, `google ads`, `meta ads`, `campaign`, `spend`, `budget` |
| SEO | 🔍 | `[seo]`, `keyword`, `organic`, `serp`, `search intent`, `landing page`, `content`, `backlink`, `rankings` |
| CE | 🤝 | `[ce]`, `client`, `call prep`, `qbr`, `engagement`, `horizon` |
| OPS | 🛠️ | `[ops]`, `taxonomy`, `operation`, `process`, `admin`, `calendar` |
| WIP | 🚧 | `[wip]`, `testing`, `test version` |
| DNU | ⛔ | `[dnu]`, `[do not use]`, `sandbox` |
| PROD | ✅ | `[prod]`, `production`, `live`, `approved` |
| CLIENT | 👤 | `[client]`, `[acme]`, `[example]` |
| UTILITY | 🔧 | `[utility]`, `assistant`, `helper`, `api`, `connector`, `builder`, `retriever`, `extractor`, `scraper` |

### Usage
1. Navigate to the NinjaCat Agents page
2. The filter bar appears automatically above the agent list
3. Click tags to filter, use Settings (⚙️) to customize
4. Use Share (🔗) to sync settings with teammates

---

## 2. Chat Export

**Version:** v2.6.0  
**Works on:** `https://app.ninjacat.io/agency/data/agents/*/chat/*`

Export NinjaCat agent chat conversations to PDF, Markdown, or plain text.

### Features

| Feature | Description |
|---------|-------------|
| **Export to PDF** | Clean, print-friendly output without sidebars or UI clutter |
| **Export to Markdown** | Copy conversation as formatted markdown with code blocks preserved |
| **Copy as plain text** | Copy conversation without formatting |
| **Expand All** | Expand all collapsed task details before export |
| **Collapse All** | Collapse all task details |
| **Print header** | Adds agent name and export date to PDF output |
| **User/Agent labels** | Clearly labels who said what in exports |
| **Keyboard shortcuts** | `Ctrl+Shift+M` for Markdown, `Ctrl+Shift+C` for Copy |

### Usage
1. Open any agent chat conversation
2. Click the blue **Export** button (📄) in the top-right
3. Choose your export format from the dropdown:
   - **Print PDF** - Opens print dialog for PDF export
   - **Markdown** - Copies formatted markdown to clipboard
   - **Copy Text** - Copies plain text to clipboard
4. Use **Expand All / Collapse All** to control task detail visibility

---

## 3. Chat UX Enhancements

**Version:** v1.7.0  
**Works on:** `https://app.ninjacat.io/*/chat/*` and `https://app.ninjacat.io/*/agents/*`

Improves the NinjaCat chat experience with better file handling, message queuing, error recovery, and input management.

### Features

| Feature | Description |
|---------|-------------|
| **Multi-file drag & drop** | Drag multiple files onto the chat area to attach them |
| **Smart drop targeting** | Automatically finds the correct file input (chat vs. Knowledge tab) |
| **Always-unlocked input** | Chat input stays editable even while agent is processing |
| **Message queue** | Queue up to 3 messages while waiting for agent response |
| **Queue management** | Edit, reorder, or cancel queued messages |
| **Auto-linkify URLs** | URLs in chat messages become clickable links |
| **URL validation** | Only valid http/https URLs are converted to links |
| **Error state warning** | Yellow banner alerts you when conversation is in error state |
| **Edit button injection** | Adds missing "Edit last message" button when agent run is cancelled |
| **Error recovery helpers** | Debug functions to clear stale state and recover from errors |
| **Performance optimized** | Throttled MutationObserver, cached DOM refs, narrow observation scope |
| **SPA navigation support** | Reinitializes on client-side navigation |

### Error Recovery

When NinjaCat gets stuck in an error state:
- A yellow warning banner appears above the input
- On cancelled runs, an "Edit last message" button is injected (NinjaCat only shows this on errors, not cancels)
- Use the native Resend/Edit buttons to recover

### Supported File Types
`.csv`, `.png`, `.jpg`, `.jpeg`, `.pdf`, `.txt`, `.md`, `.json`

### Usage
1. Open any agent chat conversation
2. **Drag files** onto the chat area - drop zone appears automatically
3. **Type while agent runs** - messages are queued and sent when ready
4. **Manage queue** - click Edit/Cancel on pending messages
5. If stuck in error state, use the Resend or Edit buttons shown

### Debug Mode
Enable debug logging in browser console:
```js
localStorage.setItem('ninjacat-chat-debug', 'true');
location.reload();
```

### Debug Functions (Console)
```js
window._ncCheckProcessing()  // Check if agent is processing
window._ncIsErrorState()     // Check if in error state
window._ncNuclearReset()     // Clear all blocking state
window._ncDumpState()        // Dump Pinia store state
window._ncStores()           // Get Pinia store references
```

---

## Updating Scripts

Tampermonkey checks for updates automatically. To force an update:

1. Open Tampermonkey dashboard
2. Go to the **Utilities** tab
3. Click **Check for userscript updates**

Or reinstall from the links above with a cache buster:
```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/main/userscripts/SCRIPT_NAME.user.js?nocache=123
```

---

## Configuration & Data

All data is stored locally in your browser's localStorage:

### Seer Tags Storage
| Key | Description |
|-----|-------------|
| `ninjacat-seer-tags-config` | Tag definitions and patterns |
| `ninjacat-seer-data-sources` | Data source definitions |
| `ninjacat-seer-agent-tags` | Manual tag assignments |
| `ninjacat-seer-filter-state` | Active filters, excludes, sort/group settings |

### Chat UX Storage
| Key | Description |
|-----|-------------|
| `ninjacat-chat-debug` | Enable debug logging (`'true'` / `'false'`) |

To reset Seer Tags: Settings > Reset All

---

## Sharing Configurations (Seer Tags)

### Export your config
1. Click **Share** (🔗) in the filter bar
2. Click **Copy to Clipboard**
3. Send the code to teammates

### Import a config
1. Click **Share** (🔗)
2. Paste the code
3. Click **Import from Code**

---

## Troubleshooting

### Script doesn't load
- Verify Tampermonkey is enabled
- Check the script is enabled in Tampermonkey dashboard
- Hard refresh: `Ctrl+Shift+R`

### Filter bar doesn't appear (Seer Tags)
- Wait 2-3 seconds for page to fully load
- Check console (`F12`) for errors
- Look for `[NinjaCat Seer Tags] Script loaded` message

### Chat input is locked
- The Chat UX script should auto-unlock it
- Check for `[NinjaCat Chat UX] Script loaded` in console
- Try `window._ncNuclearReset()` in console to clear state

### Export button doesn't appear
- Make sure you're on a chat page (`/chat/` in URL)
- Check for `[NinjaCat Chat Export] Script loaded` in console

### Need help?
- [Open an issue](https://github.com/jms830/ninjacat-tweaks/issues)
- Check [TROUBLESHOOTING.md](userscripts/TROUBLESHOOTING.md)

---

## Repository Structure

```
ninjacat-tweaks/
├── userscripts/
│   ├── ninjacat-seer-tags.user.js    # Agent tagging & filtering
│   ├── ninjacat-seer-tags.meta.js    # Update metadata
│   ├── ninjacat-chat-export.user.js  # Chat export to PDF/MD
│   ├── ninjacat-chat-export.meta.js  # Update metadata
│   ├── ninjacat-chat-ux.user.js      # Chat UX enhancements
│   ├── ninjacat-chat-ux.meta.js      # Update metadata
│   ├── README.md                     # Detailed Seer Tags docs
│   ├── FIXES.md                      # Changelog
│   └── TROUBLESHOOTING.md            # Help guide
├── specs/                            # Feature specifications
├── FEATURE_REQUESTS.md               # Feature backlog
├── AGENTS.md                         # Development guidelines
└── README.md                         # This file
```

---

## Development

### Code Style
- Vanilla JavaScript ES6+ (no build system)
- IIFE wrapper with `'use strict'`
- Section headers: `// ---- Section Name ----`
- Debug logging via `debugLog()` with localStorage toggle
- Centralized selectors in `SELECTORS` object
- JSDoc comments for exported debug functions

### Testing
```bash
node --check userscripts/*.user.js   # Syntax check
```

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes and test on NinjaCat
4. Submit a PR

---

## License

MIT License - free to use and modify!
