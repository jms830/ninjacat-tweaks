# Quickstart Guide: NinjaCat Seer Agent Tags & Filter

**Feature**: 001-ninjacat-seer-division  
**Version**: 1.0.0  
**Last Updated**: 2025-11-26

## Overview

This userscript enhances the NinjaCat agents page by automatically tagging agents with their Seer division (SEO, PDM, Analytics, Creative, Ops, CE, PM) and providing a filtering interface to quickly find agents by division.

**What it does**:
- 🏷️ **Auto-tags agents** with colored division badges based on keywords
- 🔍 **Provides division filters** to show/hide agents by category
- ⚡ **Auto-expands** the agent list on page load
- 🔄 **Works with SPA navigation** - tags persist when navigating within NinjaCat

---

## Installation

### Prerequisites

You need a userscript manager extension installed in your browser:

- **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
- **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)
- **Opera**: [Tampermonkey](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)

### Installation Methods

#### Method 1: GitHub Raw URL (Recommended)

**Easiest method with automatic updates**:

1. Install Tampermonkey extension (see prerequisites above)
2. Click this link: [Install NinjaCat Seer Tags](https://raw.githubusercontent.com/jordan/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js)
3. Tampermonkey will open an install dialog
4. Click **"Install"**
5. Navigate to NinjaCat agents page: https://app.ninjacat.io/agency/data/agents
6. Tags should appear automatically!

**Benefits**: Automatic updates, one-click install

---

#### Method 2: Manual Copy-Paste

**Works when GitHub is blocked or unavailable**:

1. Install Tampermonkey extension
2. Click the Tampermonkey icon in your browser toolbar
3. Select **"Dashboard"**
4. Click the **"+"** button (Create new script)
5. Delete the default template
6. Copy the full script code from `userscripts/ninjacat-seer-tags.user.js`
7. Paste into the editor
8. Press **Ctrl+S** (or Cmd+S on Mac) to save
9. Navigate to NinjaCat agents page

**Drawback**: No automatic updates - you'll need to manually replace the code when updates are released

---

## Usage

### Basic Usage

Once installed, the script runs automatically when you visit the NinjaCat agents page.

**What you'll see**:

1. **Division filter bar** appears at the top of the agent list:
   ```
   🔍 SEO | 💸 PDM | 📈 Analytics | 🎨 Creative | 🛠️ Ops | 🤝 CE | 📅 PM | Reset
   ```

2. **Colored badges** appear below each agent name:
   ```
   Agent Name: SEO Keyword Research Assistant
   🔍 SEO
   ```

3. **Agent list auto-expands** (no need to click "Show All")

---

### Filtering Agents

**To filter by division**:
1. Click a division button (e.g., **🔍 SEO**)
2. Only agents tagged with that division will be visible
3. The selected button will have a black outline

**To clear filter**:
1. Click the **"Reset"** button
2. All agents become visible again

**Filter behavior**:
- Only one filter active at a time
- Filter persists when you scroll
- Filter reapplies automatically if new agents load (search, pagination)

---

### Division Categories

| Division | Icon | Color | Keywords Matched |
|----------|------|-------|------------------|
| **SEO** | 🔍 | Orange | seo, keyword, organic, serp, search intent, landing page, content gap, people also ask |
| **PDM** | 💸 | Blue | paid, ppc, ad copy, budget, google ads, media mix, campaign, spend, paid search |
| **Analytics** | 📈 | Green | analytics, anomalie, ga4, seer signals, bq, report, data, insights |
| **Creative** | 🎨 | Pink | creative, design, logo, fatigue, tiktok, unique content |
| **Ops** | 🛠️ | Gray | calendar, ops, taxonomy, operation, process, admin |
| **CE** | 🤝 | Purple | client, call prep, engagement |
| **PM** | 📅 | Orange | project, timeline, manage, schedule |

**Note**: An agent can have multiple tags if it matches keywords from multiple divisions.

---

## Supported Pages

The script runs on:
- ✅ https://app.ninjacat.io/agency/data/agents
- ✅ https://app.mymarketingreports.com/agency/data/agents

The script **does not** run on:
- ❌ Other NinjaCat pages (dashboard, reports, etc.)
- ❌ Agent detail pages

This is intentional - the script only enhances the main agents list page.

---

## Troubleshooting

### Tags not appearing

**Possible causes**:
1. **Script not installed**: Check Tampermonkey dashboard, ensure script is enabled
2. **Wrong page**: Script only works on `/agency/data/agents` pages
3. **DOM structure changed**: NinjaCat may have updated their UI - check for script updates

**Debug steps**:
1. Open browser console (F12 → Console tab)
2. Look for errors related to "seer" or "tag"
3. Run: `console.log('Seer script loaded:', typeof observeAndRun)`
4. Should output: `Seer script loaded: function`

---

### Filter bar not appearing

**Possible causes**:
1. Agent list empty (no agents to filter)
2. Filter bar placement failed (DOM structure changed)
3. Script loaded before page content

**Debug steps**:
1. Check if `#seer-tag-bar` element exists: `document.getElementById('seer-tag-bar')`
2. If null, the bar wasn't created
3. Refresh the page - MutationObserver should retry

---

### Tags in wrong location

**Possible cause**: NinjaCat updated their agent card HTML structure

**Temporary fix**: Tags will still appear (fallback to card root) but may look misplaced

**Permanent fix**: Wait for script update with new DOM selectors

---

### Script not working after NinjaCat update

**NinjaCat occasionally updates their UI**, which can break DOM selectors.

**What to do**:
1. Check GitHub repository for updates
2. Update script via Tampermonkey (if using GitHub installation method)
3. Or reinstall manually if using copy-paste method
4. Report the issue on GitHub if no update is available

---

## Customization

### Adding Custom Keywords

**To add keywords to an existing division**:

1. Open Tampermonkey dashboard
2. Click "Edit" on the NinjaCat Seer Tags script
3. Find the `patterns` object (around line 30)
4. Add your keyword to the appropriate array:

```javascript
const patterns = {
    seo: [
        'seo',
        'keyword',
        'my-custom-keyword'  // ← Add here
    ],
    // ...
};
```

5. Save (Ctrl+S)
6. Refresh NinjaCat page

---

### Changing Division Colors

**To change a division's color**:

1. Open Tampermonkey dashboard
2. Click "Edit" on the NinjaCat Seer Tags script
3. Find the `categories` object (around line 15)
4. Change the color hex code:

```javascript
const categories = {
    seo: {
        name: 'SEO',
        color: '#FF6600',  // ← Change this (was #F59E0B)
        icon: '🔍'
    },
    // ...
};
```

5. Save and refresh

**Tip**: Use [HTML Color Picker](https://htmlcolorcodes.com/color-picker/) to find hex codes

---

### Adding a New Division

**To add a completely new division** (e.g., "Social Media"):

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
social: ['social media', 'facebook', 'instagram', 'twitter', 'linkedin']
```

3. Save and refresh - the new division will automatically appear in the filter bar!

---

## Uninstallation

**To remove the script**:

1. Click Tampermonkey icon in browser toolbar
2. Select **"Dashboard"**
3. Find "NinjaCat Seer Agent Tags & Filter"
4. Click the **trash icon** on the right
5. Confirm deletion

**To temporarily disable** (without uninstalling):
1. Click Tampermonkey icon
2. Toggle the script off (click the switch next to the script name)

---

## Performance

### Expected Performance:

- **Tag application**: < 100ms for 100 agents
- **Filter toggle**: < 50ms (instant)
- **Memory usage**: ~30-50 KB additional DOM elements
- **CPU impact**: Negligible (runs once per page load + SPA navigation)

### Performance Tips:

- Script only runs on agents page (not entire NinjaCat site)
- MutationObserver is debounced to prevent excessive re-runs
- Filtering uses CSS display property (no DOM manipulation)

---

## Updates

### Automatic Updates (GitHub Installation)

If you installed via the GitHub raw URL:
- Tampermonkey checks for updates every 24 hours
- You'll see a notification when an update is available
- Click "Update" to install the latest version

### Manual Updates (Copy-Paste Installation)

If you installed via copy-paste:
1. Check the [GitHub repository](https://github.com/jordan/ninjacat-tweaks) for updates
2. Open Tampermonkey dashboard
3. Click "Edit" on the script
4. Replace all code with the new version
5. Save (Ctrl+S)

### Version History

Check [CHANGELOG.md](../../userscripts/CHANGELOG.md) for version history and release notes.

---

## Support

### Need Help?

- **GitHub Issues**: [Report a bug or request a feature](https://github.com/jordan/ninjacat-tweaks/issues)
- **Email**: [Your contact email]
- **Slack**: #ninjacat-tweaks (if internal Seer channel exists)

### Common Questions

**Q: Does this work on mobile?**  
A: Partially. Mobile browsers don't support Tampermonkey well. Desktop browser recommended.

**Q: Will this break NinjaCat?**  
A: No. The script only adds visual elements. If it fails, NinjaCat continues to work normally.

**Q: Can I share this with my team?**  
A: Yes! Share the GitHub installation link or this quickstart guide.

**Q: Does this send data to external servers?**  
A: No. Everything runs locally in your browser. Zero external requests.

**Q: Can I customize the divisions?**  
A: Yes! See the Customization section above.

---

## Screenshots

### Before (NinjaCat Default)
```
┌─────────────────────────────────────┐
│ Agent Name                          │
│ Description text here...            │
└─────────────────────────────────────┘
```

### After (With Script)
```
┌─────────────────────────────────────┐
│ Filter: 🔍 SEO | 💸 PDM | Reset     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Agent Name                          │
│ 🔍 SEO  📈 Analytics                │
│ Description text here...            │
└─────────────────────────────────────┘
```

---

## Privacy & Security

### What the script accesses:
- ✅ NinjaCat agents page DOM (read and modify)
- ✅ Agent names and descriptions (for keyword matching)

### What the script does NOT access:
- ❌ No external servers
- ❌ No user credentials
- ❌ No analytics or tracking
- ❌ No data sent outside your browser
- ❌ No access to other browser tabs

### Permissions:
- `@grant none` - No special browser permissions needed
- `@match` - Only runs on NinjaCat agents pages (not entire site)

**Open source**: Full code is available on GitHub for audit

---

## Contributing

Want to improve the script?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on NinjaCat
5. Submit a pull request

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.

---

## License

[Include your license here, e.g., MIT License]

---

## Credits

**Created by**: NinjaCat Tweaks Team  
**Maintained by**: [Your Name/Team]  
**Repository**: https://github.com/jordan/ninjacat-tweaks

**Thanks to**: Seer Interactive team for the division categories and keyword patterns

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│ NinjaCat Seer Agent Tags - Quick Reference             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ DIVISIONS:                                              │
│   🔍 SEO      💸 PDM      📈 Analytics  🎨 Creative    │
│   🛠️ Ops      🤝 CE       📅 PM                        │
│                                                         │
│ FILTERING:                                              │
│   • Click division button to filter                     │
│   • Click "Reset" to show all                           │
│   • One filter active at a time                         │
│                                                         │
│ TROUBLESHOOTING:                                        │
│   • F12 → Console → Check for errors                    │
│   • Tampermonkey dashboard → Enable script              │
│   • Refresh page if tags missing                        │
│                                                         │
│ CUSTOMIZATION:                                          │
│   • Edit script in Tampermonkey dashboard               │
│   • Modify 'patterns' object to add keywords            │
│   • Modify 'categories' object to change colors         │
│                                                         │
│ SUPPORT:                                                │
│   • GitHub: github.com/jordan/ninjacat-tweaks           │
│   • Issues: Report bugs via GitHub Issues               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Happy filtering! 🚀**
