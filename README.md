# NinjaCat Tweaks

Browser userscripts to enhance the [NinjaCat](https://ninjacat.io) experience.

## Available Scripts

| Script | Version | Description |
|--------|---------|-------------|
| [Seer Agent Tags & Filter](#1-seer-agent-tags--filter) | v2.5.2 | Tag, filter, and organize agents on the Agents page |
| [Chat Export](#2-chat-export) | v2.6.0 | Export chat conversations to PDF or Markdown |
| [Chat UX Enhancements](#3-chat-ux-enhancements) | v1.0.0 | Drag-drop files, message queue, always-unlocked input |

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

**Works on**: `https://app.ninjacat.io/agency/data/agents*`

Automatically tags and filters agents on the NinjaCat Agents page.

### Features
- **Auto-tagging** - Tags agents based on name patterns (SEO, PDM, ANA, CE, OPS, WIP, etc.)
- **Filter bar** - Filter by tag, data source, or show untagged agents
- **Manual tagging** - Click the tag button to manually assign tags
- **My Agents** - Quick filter to show only your agents
- **Collapsible sections** - Collapse Favorites and All Agents sections
- **Team sharing** - Export/import configurations via share code
- **Fully customizable** - Add your own tags, patterns, colors, and icons

### Usage
1. Navigate to the NinjaCat Agents page
2. The filter bar appears automatically above the agent list
3. Click tags to filter, use Settings to customize

### Screenshots
The filter bar appears above your agents list with tag filters, data source filters, and a settings button.

---

## 2. Chat Export

**Works on**: `https://app.ninjacat.io/agency/data/agents/*/chat/*`

Export NinjaCat agent chat conversations to PDF or Markdown.

### Features
- **Export to PDF** - Clean, print-friendly output without sidebars
- **Export to Markdown** - Copy conversation as formatted markdown
- **Expand/Collapse All** - Quickly expand or collapse all task details
- **Print optimization** - Hides UI clutter, adds header with agent name and date

### Usage
1. Open any agent chat conversation
2. Click the **Export** button in the top-right
3. Choose **PDF** (opens print dialog) or **Markdown** (copies to clipboard)

---

## 3. Chat UX Enhancements

**Works on**: `https://app.ninjacat.io/*/chat/*` (all chat pages)

Improves the NinjaCat chat experience with better file handling, message queuing, and input management.

### Features
- **Multi-file Drag & Drop** - Drag multiple files onto the chat area to attach them
- **Always-unlocked Input** - Chat input stays editable even while agent is processing
- **Message Queue** - Queue up to 3 messages while waiting for agent response
- **Queue Management** - Edit, cancel, or clear queued messages
- **Error Recovery** - Automatically unlocks input and pauses queue on errors

### Usage
1. Open any agent chat conversation
2. **Drag files** onto the chat area - drop zone appears automatically
3. **Type while agent runs** - messages are queued and sent when ready
4. **Manage queue** - click Edit/Cancel on pending messages

### Debug Mode
Enable debug logging in browser console:
```js
localStorage.setItem('ninjacat-chat-debug', 'true');
location.reload();
```

---

## Updating Scripts

Tampermonkey checks for updates automatically. To force an update:

1. Open Tampermonkey dashboard
2. Go to the **Utilities** tab
3. Click **Check for userscript updates**

Or reinstall from the links above.

---

## Configuration & Data

All data is stored locally in your browser's localStorage:

| Key | Description |
|-----|-------------|
| `ninjacat-seer-tags-config` | Tag definitions and patterns |
| `ninjacat-seer-data-sources` | Data source definitions |
| `ninjacat-seer-agent-tags` | Manual tag assignments |
| `ninjacat-seer-filter-state` | Active filter state |

To reset: Settings > Reset All

---

## Sharing Configurations

### Export your config
1. Click **Share** in the filter bar
2. Click **Copy to Clipboard**
3. Send the code to teammates

### Import a config
1. Click **Share**
2. Paste the code
3. Click **Import from Code**

---

## Troubleshooting

### Script doesn't load
- Verify Tampermonkey is enabled
- Check the script is enabled in Tampermonkey dashboard
- Hard refresh: `Ctrl+Shift+R`

### Filter bar doesn't appear
- Wait 2-3 seconds for page to fully load
- Check console (`F12`) for errors
- Look for `[NinjaCat Seer Tags] Script loaded` message

### Need help?
- [Open an issue](https://github.com/jms830/ninjacat-tweaks/issues)
- Check [TROUBLESHOOTING.md](userscripts/TROUBLESHOOTING.md)

---

## Repository Structure

```
ninjacat-tweaks/
├── userscripts/
│   ├── ninjacat-seer-tags.user.js    # Agent tagging script
│   ├── ninjacat-seer-tags.meta.js    # Update metadata
│   ├── ninjacat-chat-export.user.js  # Chat export script
│   ├── ninjacat-chat-export.meta.js  # Update metadata
│   ├── ninjacat-chat-ux.user.js      # Chat UX enhancements
│   ├── ninjacat-chat-ux.meta.js      # Update metadata
│   ├── README.md                     # Detailed documentation
│   ├── FIXES.md                      # Changelog
│   └── TROUBLESHOOTING.md            # Help guide
├── specs/                            # Feature specifications
├── FEATURE_REQUESTS.md               # Feature backlog
└── README.md                         # This file
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
