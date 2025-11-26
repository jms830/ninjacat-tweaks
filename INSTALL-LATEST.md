# Install Latest Version

## Current Version: v1.5.0

---

## Quick Install (30 seconds)

### Step 1: Install Tampermonkey (if you haven't)
- [Chrome/Edge](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Step 2: Install the Script

**Click this link**:
```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
```

Tampermonkey will open. Click **Install**.

### Step 3: Verify

1. Go to https://app.ninjacat.io/agency/data/agents
2. You should see a filter bar below "All Agents"
3. Open Console (F12) and look for: `[NinjaCat Seer Tags] Script loaded v1.5.0`

---

## Updating from an Older Version

If you have an older version installed:

### Method 1: Reinstall (Recommended)
1. Open Tampermonkey Dashboard
2. Delete "NinjaCat Seer Agent Tags & Filter"
3. Install fresh from the link above

### Method 2: Force Update
Add a cache-busting parameter:
```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js?v=1.5.0
```

---

## What's New in v1.5.0

- **Filter count**: "Showing X of Y agents"
- **Untagged filter**: Find agents with no tags
- **Team sharing**: Share config via code or file
- **Add pattern button**: Quickly improve auto-detection
- **Customizable data sources**: Full CRUD like filters
- **Drag-drop reorder**: Organize your filters
- **Persistent filters**: Survives page refresh
- **Keyboard shortcuts**: Esc closes modals
- **Settings search**: Find filters quickly
- **Delete warnings**: Warns if agents use the tag

---

## Troubleshooting

### "I still see an old version"

1. Check version in Tampermonkey: Dashboard → Edit script → Line 4
2. Should say `// @version 1.5.0`
3. If not, delete and reinstall

### "Script doesn't run"

1. Is Tampermonkey enabled? (Click icon, check toggle)
2. Is the script enabled? (Dashboard, check toggle)
3. Are you on the right URL? Must be `app.ninjacat.io/agency/data/agents*`

### "Filter bar doesn't appear"

1. Wait 2-3 seconds (script waits for page to load)
2. Open Console (F12) - any errors?
3. Try hard refresh: Ctrl+Shift+R

---

## Manual Install (Always Works)

If the automatic install doesn't work:

1. Go to: https://github.com/jms830/ninjacat-tweaks/blob/master/userscripts/ninjacat-seer-tags.user.js
2. Click **Raw** button
3. Select All (Ctrl+A), Copy (Ctrl+C)
4. Tampermonkey Dashboard → Create new script (+)
5. Select All (Ctrl+A), Paste (Ctrl+V)
6. Save (Ctrl+S)

---

## Version History

| Version | Key Features |
|---------|--------------|
| v1.5.0 | Team sharing, untagged filter, drag-drop, filter count |
| v1.4.0 | Manual tagging, import/export, full CRUD |
| v1.3.0 | Data source filters, multi-select |
| v1.2.0 | Settings modal, pattern editing |
| v1.0.0 | Initial release |

---

## Need Help?

1. Check the [full documentation](userscripts/README.md)
2. Open Console (F12) and share any errors
3. Create an issue on GitHub
