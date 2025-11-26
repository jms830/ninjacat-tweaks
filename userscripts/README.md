# NinjaCat Tweaks - Userscripts

Browser userscripts to enhance the NinjaCat experience.

## Available Scripts

### 1. NinjaCat Seer Agent Tags & Filter (v1.4.0)

**File**: `ninjacat-seer-tags.user.js`

**What it does**:
- 🏷️ Automatically tags agents with division badges (SEO, PDM, Analytics, CE, Ops, WIP, DNU, PROD, CLIENT, UTILITY)
- 📊 Detects data source icons (Google Analytics, GSC, Sheets, Meta Ads, Google Ads) and exposes matching filters
- 🔍 Provides multi-select filters (Ctrl/Cmd-click) with visual states and Reset button
- ⚙️ **Full division management**: Add, rename, delete, change colors/icons, edit patterns
- 🏷️ **Manual agent tagging**: Click the tag button on any agent to assign custom divisions
- 📤 **Import/Export**: Backup and restore your entire configuration including manual tags
- ⚡ Auto-expands the "Show All" button on page load and re-runs on SPA navigation

**Quick Install**:
1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click: [Install Script](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js)
   - If GitHub caches an older version, append `?v=TIMESTAMP` (see `INSTALL-LATEST.md`)
3. Navigate to https://app.ninjacat.io/agency/data/agents

**Detailed Guide**: See `specs/001-ninjacat-seer-division/quickstart.md`

**Changes from Original**: See `FIXES.md` for complete list of improvements

---

## Installation

### Prerequisites

Install a userscript manager:
- **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Method 1: GitHub Raw URL (Recommended)

Click the raw GitHub link for any script above. Tampermonkey will prompt you to install.

**Benefits**: Automatic updates via `@updateURL`

### Method 2: Manual Copy-Paste

1. Open Tampermonkey dashboard
2. Click "+" to create new script
3. Copy script contents and paste
4. Save (Ctrl+S)

---

## Contributing

See the main repository README for contribution guidelines.

## License

[Your License Here]
