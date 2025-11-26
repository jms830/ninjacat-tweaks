# Install Latest Version - Bypass Cache

## Current Version: v1.2.0

**The fastest way to get the latest version** is to reinstall from scratch, not use "Check for updates".

---

## ⚡ Quick Install (30 seconds)

### Step 1: Delete Old Version
1. Open **Tampermonkey Dashboard** (click icon → Dashboard)
2. Find **"NinjaCat Seer Agent Tags & Filter"**
3. Click the **trash icon** 🗑️
4. Confirm deletion

### Step 2: Install Fresh
**Click this direct link**:

```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js?v=1.2.0
```

**Or manually**:
1. Copy the URL above
2. Paste in browser address bar
3. Press Enter
4. Tampermonkey install dialog appears
5. Click **"Install"**

### Step 3: Verify
Open the script in Tampermonkey and check line 4:
```javascript
// @version      1.2.0
```

Should say **1.2.0**, not 1.0.0 or 1.1.0

---

## 🐛 Why "Check for Updates" Doesn't Work

**Technical Issue**: GitHub caches raw files for 5 minutes
- When Tampermonkey checks for updates, it gets the cached old version
- Even after we push new code, GitHub serves stale cache
- The cache header: `cache-control: max-age=300` (5 minutes)

**Tampermonkey Issue**: Only checks every 24 hours
- Manual "Check for updates" still hits the cache
- No way to force cache bypass in Tampermonkey

**Solution**: Direct reinstall bypasses the update mechanism entirely

---

## 📋 What You Should See After Install

**In Console** (F12):
```
[NinjaCat Seer Tags] Script loaded v1.2.0
```

**On Agents Page**:
- Filter bar appears **below "All Agents" header** (not top right)
- Buttons are compact with gray background
- Clicking filters **actually filters agents**
- Settings has **Select All/Deselect All** buttons
- Settings has **pattern editing textareas**

---

## ✅ Quick Test

After installing v1.2.0:

1. **Navigate to**: https://app.ninjacat.io/agency/data/agents
2. **Look for filter bar** below "All Agents"
3. **Click PDM button** - should filter to only PDM agents
4. **Open Console** (F12) - should show "Button clicked: PDM"
5. **Click Settings** - should see pattern textareas
6. **Click Select All** - all checkboxes should enable

If any of these fail, you're still on an old version.

---

## 🔍 Troubleshooting

### "I installed but still see v1.0.0"

**Browser cached the raw file too**:
1. Add `?nocache=1` to the install URL:
   ```
   https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js?nocache=1
   ```
2. Or use the manual method below

### Manual Install (Always Works)

1. Go to: https://github.com/jms830/ninjacat-tweaks/blob/master/userscripts/ninjacat-seer-tags.user.js
2. Click **"Raw"** button (top right)
3. **Select all** (Ctrl+A)
4. **Copy** (Ctrl+C)
5. **Tampermonkey Dashboard** → + Create new script
6. **Select all** in editor (Ctrl+A)
7. **Paste** (Ctrl+V)
8. **Save** (Ctrl+S)
9. Delete the old version if it exists

### "Filter bar still off-screen"

You have the old version. Verify:
```javascript
// Line 4 should say:
// @version      1.2.0
```

If it says 1.0.0 or 1.1.0, reinstall using manual method above.

---

## 🎯 Version History

- **v1.0.0**: Initial release with basic filters
- **v1.1.0**: Added Settings modal (but had issues)
- **v1.2.0**: ✅ FIXED - Proper positioning, working filters, pattern editing

Make sure you're on **v1.2.0**!

---

## 💡 Pro Tip

**Bookmark this URL for future updates**:
```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js?t=[TIMESTAMP]
```

Adding `?t=123456` forces cache bypass. Change the timestamp each time.

---

## 📞 Still Having Issues?

1. **Check current version**: Tampermonkey → Edit script → Line 4
2. **Check console**: F12 → Console → Look for version number
3. **Hard refresh page**: Ctrl+Shift+R
4. **Try incognito mode**: Rules out all cache issues

If you're 100% sure you have v1.2.0 installed but features aren't working:
- Send me the **console output** (F12 → Console → Copy all)
- Send **screenshot** of filter bar location
- Tell me what **specific feature** isn't working
