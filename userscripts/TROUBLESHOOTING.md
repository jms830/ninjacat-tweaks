# Troubleshooting - NinjaCat Seer Tags

## Script Not Showing in Tampermonkey

### Issue: "No scripts running" on NinjaCat agents page

**Symptoms**:
- Tampermonkey icon shows "0" or no badge
- Script appears in dashboard but isn't active
- You're definitely on the correct URL

**Causes & Solutions**:

#### 1. URL Pattern Mismatch (Most Common)

**Problem**: The `@match` pattern doesn't match your exact URL

**Check**:
1. Look at your browser's address bar
2. Copy the EXACT URL you're on
3. Check if it has query parameters or extra path segments

**Examples**:
- ✅ Works: `https://app.ninjacat.io/agency/data/agents`
- ✅ Works: `https://app.ninjacat.io/agency/data/agents?tab=active`
- ✅ Works: `https://app.ninjacat.io/agency/data/agents/123`
- ❌ Doesn't work (old pattern): Anything with `?` or additional `/`

**Solution**: The script now uses `@match` with wildcard `*`:
```javascript
// @match        https://app.ninjacat.io/agency/data/agents*
```

This matches:
- `/agency/data/agents` (exact)
- `/agency/data/agents?anything` (with query params)
- `/agency/data/agents/anything` (with subpaths)

**Fix Steps**:
1. Open Tampermonkey dashboard
2. Click "Edit" on the script
3. Find the `@match` lines (around line 7-8)
4. Make sure they end with `*` like this:
   ```javascript
   // @match        https://app.ninjacat.io/agency/data/agents*
   // @match        https://app.mymarketingreports.com/agency/data/agents*
   ```
5. Save (Ctrl+S)
6. Refresh NinjaCat page

---

#### 2. Script Not Enabled

**Check**:
1. Open Tampermonkey dashboard
2. Look for the script in the list
3. Check if the toggle switch is ON (enabled)

**Fix**:
- Click the toggle to enable the script
- Refresh the page

---

#### 3. Browser Extension Permissions

**Check**:
1. Browser settings → Extensions
2. Find Tampermonkey
3. Verify it has permission to access the site

**Fix**:
- Grant site access permissions
- Some browsers require explicit permission for each domain

---

#### 4. Script Syntax Error

**Check**:
1. Open Tampermonkey dashboard
2. Click "Edit" on the script
3. Look for any error indicators (red underlines, warnings)

**Fix**:
- Make sure you copied the ENTIRE script including the first and last lines
- The script should start with `// ==UserScript==`
- The script should end with `})();`

---

#### 5. Conflicting Scripts

**Check**:
1. Tampermonkey dashboard
2. Look for other scripts that match `ninjacat.io`
3. Check if any are causing conflicts

**Fix**:
- Temporarily disable other NinjaCat scripts
- Test if this script works alone
- Re-enable one by one to find conflicts

---

## Script Runs But Features Don't Work

### Tags Not Appearing

**Check Console**:
1. Press F12 (Developer Tools)
2. Go to "Console" tab
3. Look for `[NinjaCat Seer Tags]` messages

**Expected Output**:
```
[NinjaCat Seer Tags] Script loaded v1.0.0
[NinjaCat Seer Tags] Initial run scheduled
[NinjaCat Seer Tags] Running main logic
[NinjaCat Seer Tags] Tagging X agent cards
```

**If you see "No agent cards found"**:
- DOM structure may have changed
- Try waiting longer (agents still loading)
- Check if you're on the correct page view

**If you see errors**:
- Copy the error message
- Report as an issue (include full console output)

---

### Filter Bar Not Appearing

**Possible Causes**:
1. Agent list container selector changed
2. Script inserted bar but it's hidden by CSS
3. Error occurred before bar creation

**Debug**:
1. Open Console (F12)
2. Run: `document.getElementById('seer-tag-bar')`
3. If `null`: Bar wasn't created (check for errors)
4. If element returned: Bar exists but may be hidden

**Temporary Fix**:
1. Check console for insertion errors
2. Try refreshing the page
3. Try disabling/enabling script

---

### Duplicate Tags

**Symptom**: Same tag appears multiple times on one agent

**Cause**: Script ran multiple times without proper idempotency check

**Fix**:
1. Refresh the page
2. If persists, report as bug (script should prevent this)

---

## Testing Checklist

If script installation is working, verify:

- [ ] **Script shows in Tampermonkey**: Dashboard shows script listed
- [ ] **Script is enabled**: Toggle switch is ON
- [ ] **URL matches**: Address bar shows `app.ninjacat.io/agency/data/agents`
- [ ] **Console shows load**: F12 → Console → See "[NinjaCat Seer Tags] Script loaded"
- [ ] **Tags appear**: Agent cards show colored badges
- [ ] **Filter bar appears**: Buttons shown above agent list
- [ ] **Filters work**: Clicking button filters agents
- [ ] **No errors**: Console is clear of red errors

---

## Quick Diagnostic Script

**Paste this in the console** (F12 → Console tab) to diagnose issues:

```javascript
console.log('=== NinjaCat Seer Tags Diagnostic ===');
console.log('URL:', window.location.href);
console.log('Agent cards found:', document.querySelectorAll('[data-automation-id^="data-table-row"]').length);
console.log('Filter bar exists:', !!document.getElementById('seer-tag-bar'));
console.log('Tampermonkey GM_info:', typeof GM_info !== 'undefined' ? 'Available' : 'Not available');
console.log('Script running:', typeof observeAndRun !== 'undefined' ? 'Yes' : 'No (not loaded)');
```

**Expected Output**:
```
=== NinjaCat Seer Tags Diagnostic ===
URL: https://app.ninjacat.io/agency/data/agents
Agent cards found: 47
Filter bar exists: true
Tampermonkey GM_info: Available
Script running: Yes
```

**If "Agent cards found: 0"**:
- Wrong page or agents haven't loaded yet
- DOM structure changed (report as issue)

**If "Script running: No"**:
- Script not loaded/enabled
- Check Tampermonkey dashboard

---

## Still Not Working?

1. **Verify exact URL**: Copy-paste your browser address bar URL
2. **Check console output**: Copy ALL console messages (F12 → Console)
3. **Export script**: Tampermonkey dashboard → Script → Export
4. **Report issue** with:
   - Exact URL you're on
   - Console output
   - Tampermonkey version
   - Browser version
   - Screenshot if helpful

---

## Nuclear Option: Clean Reinstall

If nothing works:

1. **Uninstall Script**:
   - Tampermonkey dashboard
   - Find script
   - Click trash icon
   - Confirm deletion

2. **Refresh Tampermonkey**:
   - Disable and re-enable Tampermonkey extension
   - Or restart browser

3. **Reinstall Script**:
   - Copy FRESH script from repository
   - Paste into new script slot
   - Verify `@match` patterns have `*` at end
   - Save

4. **Test**:
   - Navigate to NinjaCat agents page
   - Hard refresh (Ctrl+Shift+R)
   - Check Tampermonkey icon (should show badge)
