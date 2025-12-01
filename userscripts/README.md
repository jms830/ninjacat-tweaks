# NinjaCat Seer Agent Tags & Filter

A powerful Tampermonkey userscript that adds tagging, filtering, and organization to the NinjaCat agents page.

**Current Version: v1.5.0**

---

## Quick Install (2 minutes)

### Step 1: Install Tampermonkey

| Browser | Link |
|---------|------|
| Chrome/Edge | [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Safari | [Install from App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089) |

### Step 2: Install the Script

**Click this link**: [Install NinjaCat Seer Tags](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js)

Tampermonkey will open an install dialog. Click **Install**.

### Step 3: Use It

Navigate to https://app.ninjacat.io/agency/data/agents - the filter bar appears automatically!

---

## Features Overview

### Automatic Tagging
Agents are automatically tagged based on keywords in their names:
- **SEO** - agents with "seo", "keyword", "organic", etc.
- **PDM** - agents with "paid", "ppc", "google ads", etc.
- **ANA** - agents with "analytics", "ga4", etc.
- And 7 more default categories...

### Filter Bar
<!-- Screenshot removed for public release -->

- **Division Filters** - Click to show only agents matching that division
- **Data Source Filters** - Filter by Google Analytics, GSC, Meta Ads, etc.
- **Untagged Filter** - Find agents that haven't been categorized yet
- **Multi-select** - Hold `Ctrl/Cmd` and click to select multiple filters
- **Result Count** - Shows "Showing X of Y agents" when filtering

### Manual Tagging
Not every agent gets auto-tagged correctly. For those:
1. Click the **🏷️** button next to any agent
2. Select the tags you want to assign
3. Click **Save**

Manual tags show with a **dashed border** to distinguish them from auto-detected tags.

### Add Pattern (Improve Auto-Detection)
When you find an agent that should be auto-tagged but isn't:
1. Click the **➕** button next to the agent
2. Enter a keyword pattern (e.g., `[keyword]` or `phrase`)
3. Select which filter to add it to
4. Click **Add Pattern**

Now all agents with that pattern will be auto-tagged!

### Full Customization
Click **⚙️ Settings** to:
- Add/edit/delete filters
- Change colors and icons
- Edit keyword patterns
- Drag to reorder filters
- Search through your filters

Data Sources are also fully customizable in the **Data Sources** tab.

### Team Sharing
Click **🔗 Share** to:
- **Export a share code** - Copy/paste to teammates via Slack/email
- **Import from code** - Paste a teammate's code to sync settings
- **Export/Import files** - For backup or larger configurations

This shares: all filters, data sources, patterns, AND manual agent tags.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close any open modal |
| `Ctrl/Cmd + Click` | Multi-select filters |

---

## Default Filters

| Filter | Icon | Keywords |
|--------|------|----------|
| ANA | 📈 | `[ana]`, `analytics`, `ga4`, `event drop`, `anomalie` |
| PDM | 💸 | `[pdm]`, `paid`, `ppc`, `google ads`, `meta ads`, `campaign` |
| SEO | 🔍 | `[seo]`, `keyword`, `organic`, `serp`, `content`, `backlink` |
| CE | 🤝 | `[ce]`, `client`, `call prep`, `qbr`, `engagement` |
| OPS | 🛠️ | `[ops]`, `taxonomy`, `operation`, `process`, `admin` |
| WIP | 🚧 | `[wip]`, `testing`, `test version` |
| DNU | ⛔ | `[dnu]`, `do not use`, `sandbox` |
| PROD | ✅ | `[prod]` |
| CLIENT | 👤 | `[client]`, `[acme]`, `[example]`, etc. |
| UTILITY | 🔧 | `[utility]`, `assistant`, `helper`, `api`, `connector` |

All filters are fully customizable in Settings!

---

## Default Data Sources

| Source | Icon | Detection Keywords |
|--------|------|-------------------|
| Google Analytics | 📊 | `google analytics`, `ga4`, `analytics` |
| Google Search Console | 🔎 | `search console`, `gsc` |
| Google Sheets | 📄 | `google sheets`, `sheet`, `spreadsheet` |
| Meta Ads | 📘 | `meta ads`, `facebook ads` |
| Google Ads | 💰 | `google ads`, `adwords` |

---

## Syncing with Your Team

### Option 1: Share Code (Easiest)

**To share your config:**
1. Click **🔗 Share**
2. Click **📋 Copy to Clipboard**
3. Send the code to your team via Slack/email

**To import a teammate's config:**
1. Click **🔗 Share**
2. Paste the code in the "Import from code" box
3. Click **📥 Import from Code**
4. Confirm the import

### Option 2: Share File

**To export:**
1. Click **🔗 Share**
2. Click **💾 Export as File**
3. Share the downloaded `.json` file

**To import:**
1. Click **🔗 Share**
2. Click **📂 Import from File**
3. Select the `.json` file

---

## Troubleshooting

### Script doesn't load
1. Make sure Tampermonkey is enabled (click the icon, check toggle)
2. Verify the script is enabled in Tampermonkey dashboard
3. Hard refresh the page: `Ctrl+Shift+R`

### Filter bar doesn't appear
1. Wait 2-3 seconds after page load (the script waits for the page to fully render)
2. Check the console (`F12` → Console) for errors
3. Look for: `[NinjaCat Seer Tags] Script loaded v1.5.0`

### Agents aren't getting tagged
1. Check if the agent name contains any of the keyword patterns
2. Use the **➕** button to add a new pattern
3. Or use **🏷️** to manually tag the agent

### Need to reset everything
1. Click **⚙️ Settings**
2. Click **↺ Reset All**
3. Confirm - this clears all custom settings and manual tags

### Still having issues?
1. Open Console (`F12`)
2. Look for any red errors
3. Check that version shows `v1.5.0`

---

## Updating the Script

Tampermonkey checks for updates automatically. To force an update:

1. Delete the current script from Tampermonkey
2. Reinstall from the [install link](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js)

Or add `?v=timestamp` to bypass GitHub's cache:
```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js?v=20241126
```

---

## Data Storage

All data is stored locally in your browser's localStorage:

| Key | Contents |
|-----|----------|
| `ninjacat-seer-tags-config` | Filter definitions and patterns |
| `ninjacat-seer-data-sources` | Data source definitions |
| `ninjacat-seer-agent-tags` | Manual agent tag assignments |
| `ninjacat-seer-filter-state` | Currently active filters |

To clear all data: Settings → Reset All

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.5.0 | 2024-11 | Team sharing, untagged filter, drag-drop, filter count, keyboard shortcuts, customizable data sources, add pattern button |
| v1.4.0 | 2024-11 | Full CRUD for filters, manual tagging, import/export |
| v1.3.0 | 2024-11 | Data source filters, multi-select UX |
| v1.2.0 | 2024-11 | Settings modal, pattern editing |
| v1.0.0 | 2024-11 | Initial release |

See [FIXES.md](FIXES.md) for detailed changelog.

---

## Contributing

Found a bug? Have a feature idea?
- Open an issue on [GitHub](https://github.com/jms830/ninjacat-tweaks/issues)
- Or submit a pull request!

---

## License

MIT License - feel free to use and modify!
