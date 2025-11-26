# Feature Requests - NinjaCat Tweaks

## Queue Status
- 🎯 **In Progress**: 1
- 📋 **Backlog**: 1
- 💬 **Discussion Needed**: 0

---

## 🎯 In Progress

### FR-001: Refine Seer Agent Tags & Filter Script
**Status**: ✅ COMPLETED  
**Priority**: P0 (Critical - Fixing existing script)  
**Requester**: Jordan  
**Date Added**: 2025-11-26  

**Description**: Refine the existing incomplete Seer agent tagging script to work reliably with graceful degradation, proper error handling, and constitutional compliance.

**Scope**:
- Fix null checks and error handling
- Improve debouncing for SPA compatibility
- Add comprehensive logging
- Enhance metadata block for auto-updates
- Document all fixes

**Feasibility**: ✅ Achievable with userscript  
**Implementation**: `userscripts/ninjacat-seer-tags.user.js`  
**Branch**: `001-ninjacat-seer-division`  
**Status**: COMPLETED - Ready for testing

---

## 📋 Backlog (Confirmed Viable)

### FR-002: NinjaCat Chat Export to Clean PDF
**Status**: 📋 Backlog  
**Priority**: P1 (High - User Experience)  
**Requester**: Jordan  
**Date Added**: 2025-11-26  

**Description**: Add an "Export to PDF" feature for NinjaCat chat conversations that produces a clean, print-friendly PDF without sidebars, navigation, or other UI clutter.

**User Problem**:
- Current print-to-PDF includes sidebar and navigation elements
- Output looks unprofessional and wastes space
- Hard to share clean chat transcripts with clients/team

**Proposed Solution**:
- Add "Export Chat" button to chat interface
- Generate clean HTML view with only chat messages
- Trigger browser print dialog with CSS that hides UI elements
- OR: Generate downloadable PDF directly via client-side library

**Feasibility Analysis**:
- ✅ **Achievable with userscript**: Yes
- ✅ **DOM Access**: Can access chat messages via selectors
- ✅ **Print Styling**: Can inject CSS with `@media print` rules
- ✅ **Button Injection**: Can add custom button to UI
- ⚠️ **PDF Generation**: Client-side PDF generation possible but adds complexity (jsPDF library would violate zero-dependency principle)

**Implementation Options**:

**Option A: Print Styling (Recommended)**
- Inject `@media print` CSS to hide sidebars/navigation
- Add "Print Clean" button that triggers `window.print()`
- Simplest, no dependencies, constitutional compliance
- User controls PDF output via browser print dialog

**Option B: Clean HTML View**
- Create new window with only chat content
- Style for readability
- User prints from clean view
- Still constitutional compliant

**Option C: Client-side PDF Generation** ⚠️
- Use jsPDF library to generate PDF
- Requires `@require` directive (violates zero-dependency principle)
- Would need constitutional exception justification
- More control over output but adds complexity

**Recommendation**: Start with Option A (print styling), evaluate if Option B needed

**Next Steps**:
1. Analyze NinjaCat chat page DOM structure
2. Identify chat message selectors
3. Design print-friendly CSS
4. Create spec document
5. Implement userscript

---

## 💬 Pending Team Input

*Waiting for team feature requests from Jordan*

---

## 🎲 Future Considerations (Not Yet Analyzed)

*None yet*

---

## ❌ Rejected / Not Viable

*None yet*

---

## Evaluation Criteria

When new feature requests come in, evaluate:

### Can it be done with a userscript?
- ✅ **Yes**: DOM manipulation, styling, UI injection, client-side logic
- ⚠️ **Maybe**: Requires external API calls, complex data processing, storage
- ❌ **No**: Server-side changes, database access, backend logic

### Does it align with constitution?
- ✅ Single file, vanilla JS, graceful degradation, manual testing
- ⚠️ Needs exception: External dependencies, non-graceful features
- ❌ Violates multiple principles: Complex build process, backend required

### Priority Assessment
- **P0 (Critical)**: Broken existing functionality, urgent fixes
- **P1 (High)**: Significant UX improvement, frequently requested
- **P2 (Medium)**: Nice-to-have, moderate impact
- **P3 (Low)**: Minor enhancement, low demand

---

## Submitting Feature Requests

**Format**:
```markdown
### FR-XXX: [Title]
**Requester**: [Name]
**Priority**: [P0/P1/P2/P3]
**Date**: YYYY-MM-DD

**Problem**: What issue does this solve?
**Proposed Solution**: How should it work?
**Expected Benefit**: What improves?
```

**Process**:
1. Add to "Pending Team Input" section
2. Evaluate feasibility (userscript viable?)
3. Move to Backlog (viable) or Rejected (not viable)
4. Prioritize in backlog
5. Create spec when ready to implement
6. Move to "In Progress" during development
7. Archive when completed
