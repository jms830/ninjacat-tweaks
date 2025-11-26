# NinjaCat Tweaks

Browser userscripts and tools to enhance the [NinjaCat](https://ninjacat.io) experience for the Seer team.

---

## Available Tools

### NinjaCat Seer Agent Tags & Filter (v1.5.0)

Automatically tags and filters agents on the NinjaCat agents page, making it easy to find SEO agents, PDM agents, WIP agents, and more.

**Key Features:**
- Auto-tags agents based on name patterns (SEO, PDM, Analytics, etc.)
- Filter bar with multi-select and "Showing X of Y" count
- Manual tagging for agents that don't auto-detect
- Team sharing via copy/paste code or file export
- Fully customizable filters and data sources
- Persistent filter state across page refreshes

**[Install Now](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js)** | [Full Documentation](userscripts/README.md)

---

## Quick Start

### 1. Install Tampermonkey

| Browser | Install Link |
|---------|--------------|
| Chrome/Edge | [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Safari | [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089) |

### 2. Install the Script

Click: **[Install NinjaCat Seer Tags](https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js)**

### 3. Use It

Go to https://app.ninjacat.io/agency/data/agents - the filter bar appears automatically!

---

## Sharing with Your Team

### Share Your Config

1. Click **🔗 Share** in the filter bar
2. Click **📋 Copy to Clipboard**
3. Send the code to teammates via Slack/email

### Import a Teammate's Config

1. Click **🔗 Share**
2. Paste the code in the import box
3. Click **📥 Import from Code**

This syncs all filters, patterns, and manual tags!

---

## Documentation

| Document | Description |
|----------|-------------|
| [userscripts/README.md](userscripts/README.md) | Full feature documentation |
| [INSTALL-LATEST.md](INSTALL-LATEST.md) | Installation & update guide |
| [userscripts/FIXES.md](userscripts/FIXES.md) | Detailed changelog |
| [userscripts/TROUBLESHOOTING.md](userscripts/TROUBLESHOOTING.md) | Common issues & solutions |

---

## Feature Requests

Have an idea? Check [FEATURE_REQUESTS.md](FEATURE_REQUESTS.md) or open a GitHub issue.

---

## Repository Structure

```
ninjacat-tweaks/
├── userscripts/           # Tampermonkey scripts
│   ├── ninjacat-seer-tags.user.js   # Main script
│   ├── ninjacat-seer-tags.meta.js   # Update metadata
│   ├── README.md          # Full documentation
│   ├── FIXES.md           # Changelog
│   └── TROUBLESHOOTING.md # Help guide
├── specs/                 # Feature specifications
├── tests/                 # Screenshots & test assets
├── INSTALL-LATEST.md      # Quick install guide
├── FEATURE_REQUESTS.md    # Backlog
└── README.md              # This file
```

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test on the NinjaCat agents page
5. Submit a PR

---

## License

MIT License - use freely!
