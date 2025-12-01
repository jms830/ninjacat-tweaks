# Feature Requests - NinjaCat Tweaks

## Queue Status
- **Completed**: 2
- **Backlog**: 0
- **Discussion Needed**: 0

---

## Completed

### FR-001: Seer Agent Tags & Filter Script
**Status**: Completed  
**Priority**: P0 (Critical)  
**Date Added**: 2025-11-26  

**Description**: Create a Seer division tagging and filtering script for the NinjaCat Agents page. Tags agents by division (ANA, PDM, SEO, CE, OPS, etc.) based on naming patterns, with filtering, manual tagging, and team sharing features.

**Implementation**: `userscripts/ninjacat-seer-tags.user.js`

---

### FR-002: NinjaCat Chat Export to Clean PDF
**Status**: Completed  
**Priority**: P1 (High - User Experience)  
**Date Added**: 2025-11-26  

**Description**: Add an "Export to PDF" feature for NinjaCat chat conversations that produces a clean, print-friendly PDF without sidebars, navigation, or other UI clutter.

**Implementation**: `userscripts/ninjacat-chat-export.user.js`

---

## Backlog

*No pending feature requests*

---

## Evaluation Criteria

When new feature requests come in, evaluate:

### Can it be done with a userscript?
- **Yes**: DOM manipulation, styling, UI injection, client-side logic
- **Maybe**: Requires external API calls, complex data processing, storage
- **No**: Server-side changes, database access, backend logic

### Does it align with constitution?
- Single file, vanilla JS, graceful degradation, manual testing
- Needs exception: External dependencies, non-graceful features
- Violates multiple principles: Complex build process, backend required

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
**Priority**: [P0/P1/P2/P3]
**Date**: YYYY-MM-DD

**Problem**: What issue does this solve?
**Proposed Solution**: How should it work?
**Expected Benefit**: What improves?
```

**Process**:
1. Add to "Backlog" section
2. Evaluate feasibility (userscript viable?)
3. Prioritize in backlog
4. Create spec when ready to implement
5. Move to "Completed" when done
