# How to Update the Script

## Why Updates Don't Show Immediately

1. **GitHub Cache**: Raw files are cached for 5 minutes
2. **Tampermonkey Check Frequency**: Only checks every 24 hours by default
3. **Manual Edits**: If you edited the script directly, auto-update may be disabled

---

## Method 1: Force Update (Fastest)

### Step 1: Uninstall Current Version
1. Open **Tampermonkey Dashboard**
2. Find "NinjaCat Seer Agent Tags & Filter"
3. Click **trash icon** 🗑️
4. Confirm deletion

### Step 2: Reinstall Fresh
1. Click this link: https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
2. Tampermonkey will open install dialog
3. Click **"Install"**
4. Verify version shows **1.1.0** in the metadata

### Step 3: Verify
1. Navigate to https://app.ninjacat.io/agency/data/agents
2. Look for **"⚙️ Settings"** button in filter bar
3. Click to test the new settings modal

---

## Method 2: Manual Update (Copy-Paste)

### Step 1: Get Latest Code
1. Go to: https://github.com/jms830/ninjacat-tweaks/blob/master/userscripts/ninjacat-seer-tags.user.js
2. Click **"Raw"** button
3. Select all (Ctrl+A) and copy (Ctrl+C)

### Step 2: Replace in Tampermonkey
1. Open **Tampermonkey Dashboard**
2. Click **"Edit"** on "NinjaCat Seer Agent Tags & Filter"
3. Select all existing code (Ctrl+A)
4. Paste new code (Ctrl+V)
5. Save (Ctrl+S)

### Step 3: Verify Version
Look for this line near the top:
```javascript
// @version      1.1.0
```

If it says `1.0.0`, you didn't get the latest code.

---

## Method 3: Wait for Auto-Update

**Not Recommended** - Takes up to 24 hours

Tampermonkey checks `@updateURL` once per day. If you can wait, it will eventually update automatically.

To force a check:
1. Tampermonkey Dashboard
2. Find the script
3. Click **"Last updated"** column → Shows update date
4. Try clicking the script name → Look for update notification

---

## Troubleshooting

### "I updated but don't see the Settings button"

**Check Version Number:**
1. Tampermonkey Dashboard
2. Click "Edit" on the script
3. Look at line 4: `// @version      1.1.0`
4. If it says `1.0.0`, you didn't get the update

**Check Console:**
1. Press F12 (Developer Tools)
2. Go to Console tab
3. Look for: `[NinjaCat Seer Tags] Script loaded v1.1.0`
4. If it says `v1.0.0`, hard refresh: Ctrl+Shift+R

### "Tampermonkey won't open install dialog"

**Possible causes:**
1. Browser blocked popup
2. Tampermonkey not properly installed
3. Clicked wrong link (use the raw.githubusercontent.com URL)

**Solution:**
- Use Method 2 (manual copy-paste)
- Check browser allows Tampermonkey popup permission

### "Settings button appears but modal doesn't open"

**Check Console for errors:**
1. Press F12
2. Console tab
3. Look for red errors
4. Report the error message

### "GitHub says 404 Not Found"

**Repository might be private or URL is wrong**

Verify you're using:
```
https://raw.githubusercontent.com/jms830/ninjacat-tweaks/master/userscripts/ninjacat-seer-tags.user.js
```

Not:
```
https://github.com/jms830/ninjacat-tweaks/blob/master/userscripts/ninjacat-seer-tags.user.js
```

The first is the RAW file, second is the GitHub UI.

---

## Quick Version Check

**In Browser Console** (F12 → Console):
```javascript
// Check what version is actually running
console.log(document.querySelector('script')?.textContent?.match(/version.*\d+\.\d+\.\d+/)?.[0])
```

**In Tampermonkey Dashboard**:
- Look at the script list
- Version should show next to script name
- Or click Edit and check line 4

---

## What's New in v1.1.0

✅ **Settings Modal** with ⚙️ button  
✅ **10 New Categories** (ANA, PDM, SEO, CE, OPS, WIP, DNU, PROD, CLIENT, UTILITY)  
✅ **Color Picker** for customization  
✅ **Toggle Categories** on/off  
✅ **localStorage** persistence  
✅ **Pattern Matching** for agent prefixes  

If you don't see these features, you're still on v1.0.0!

---

## Still Having Issues?

1. **Check you're on the right URL**: `app.ninjacat.io/agency/data/agents`
2. **Check script is enabled**: Toggle in Tampermonkey
3. **Check for console errors**: F12 → Console
4. **Hard refresh page**: Ctrl+Shift+R
5. **Try in incognito mode**: Rules out cache issues

---

## Contact

Report issues with:
- Exact error message from console
- Tampermonkey version
- Browser version
- Screenshot if helpful
