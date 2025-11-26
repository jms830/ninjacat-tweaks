# Feature Specification: NinjaCat Seer Agent Tags & Filter

**Feature Branch**: `001-ninjacat-seer-division`  
**Created**: 2025-11-26  
**Status**: Draft  
**Input**: User description: "NinjaCat Seer division tags, filtering, and auto-expand for agents"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-categorize Agents with Division Tags (Priority: P1)

As a NinjaCat user, I want agents automatically tagged with their Seer division (SEO, PDM, Analytics, Creative, Ops, CE, PM) based on their name and description, so I can quickly identify which team each agent belongs to without reading through descriptions.

**Why this priority**: This is the core value proposition - automatic categorization saves time and provides immediate visual context. Without this, the other features (filtering) have no foundation.

**Independent Test**: Can be fully tested by loading the agents page and verifying that agents with keywords like "SEO", "paid media", "analytics" display colored badges with division icons. Delivers immediate value by making divisions visible.

**Acceptance Scenarios**:

1. **Given** an agent named "SEO Keyword Research Assistant", **When** the page loads, **Then** the agent displays an SEO tag (🔍 SEO badge with #F59E0B color)
2. **Given** an agent with description containing "paid search" or "Google Ads", **When** the page loads, **Then** the agent displays a PDM tag (💸 PDM badge with #3B82F6 color)
3. **Given** an agent description containing "analytics" and "GA4", **When** the page loads, **Then** the agent displays an Analytics tag (📈 Analytics badge with #10B981 color)
4. **Given** an agent with multiple matching keywords (e.g., "SEO" and "analytics"), **When** the page loads, **Then** the agent displays multiple division tags
5. **Given** an agent with no matching keywords, **When** the page loads, **Then** the agent displays no division tags

---

### User Story 2 - Filter Agents by Division (Priority: P2)

As a NinjaCat user managing multiple divisions, I want to filter the agent list by clicking division buttons, so I can focus on agents relevant to my current work without scrolling through irrelevant agents.

**Why this priority**: Filtering dramatically improves usability for users working with specific divisions, but requires the tagging system (P1) to work first.

**Independent Test**: Can be tested by clicking the "SEO" filter button and verifying only agents tagged with SEO remain visible. Delivers value by reducing cognitive load and scroll time.

**Acceptance Scenarios**:

1. **Given** I'm viewing the full agent list, **When** I click the "SEO" division button, **Then** only agents tagged with SEO are visible
2. **Given** I have a division filter active, **When** I click a different division button (e.g., "PDM"), **Then** the previous filter is replaced and only PDM agents are visible
3. **Given** I have a division filter active, **When** I click the "Reset" button, **Then** all agents become visible again
4. **Given** I click a division filter button, **When** the filter is applied, **Then** the selected button displays a visual indicator (box shadow)
5. **Given** agents are filtered, **When** new agents are dynamically loaded (SPA behavior), **Then** the filter remains applied to new agents

---

### User Story 3 - Auto-expand Agent List (Priority: P3)

As a NinjaCat user, I want the agent list to automatically show all agents without clicking "Show All", so I can immediately see and filter the complete list without extra clicks.

**Why this priority**: This is a convenience feature that improves UX but isn't essential for core functionality. Users can manually click "Show All" if this feature doesn't work.

**Independent Test**: Can be tested by loading the agents page and verifying the "Show All" button is automatically clicked, displaying all agents immediately. Delivers value by eliminating one manual step.

**Acceptance Scenarios**:

1. **Given** I navigate to the agents page, **When** the page loads, **Then** the "Show All" button is automatically clicked
2. **Given** the "Show All" button is hidden or already clicked, **When** the script runs, **Then** no errors occur and the page functions normally
3. **Given** the agents page uses SPA navigation, **When** I navigate away and back to the agents page, **Then** the "Show All" button is auto-clicked again

---

### User Story 4 - SPA-Compatible Dynamic Updates (Priority: P2)

As a NinjaCat user on a Single Page Application, I want division tags and filters to work correctly when the page content changes dynamically (SPA navigation, pagination, search), so the enhancement remains functional throughout my session.

**Why this priority**: NinjaCat uses SPA architecture, so without this the script would only work on initial page load. This is essential for production use but builds on P1 functionality.

**Independent Test**: Can be tested by navigating within NinjaCat (using SPA navigation), searching agents, or triggering pagination, then verifying tags and filters continue to work. Delivers persistent value across the user session.

**Acceptance Scenarios**:

1. **Given** I'm on the agents page with tags visible, **When** I use the search functionality, **Then** new/filtered agents display appropriate division tags
2. **Given** I navigate away from the agents page and back (SPA navigation), **When** the agents list reloads, **Then** tags are re-applied automatically
3. **Given** I have a division filter active, **When** new agents are dynamically loaded, **Then** the filter is automatically applied to the new agents
4. **Given** content updates multiple times rapidly, **When** the MutationObserver triggers, **Then** the script handles rapid updates without errors or performance degradation

---

### Edge Cases

- What happens when an agent matches no division patterns? (Agent displays without tags, can only be seen in "Reset" view)
- What happens when an agent matches multiple divisions? (Agent displays all matching division badges)
- What happens when the DOM structure changes in a NinjaCat update? (Script may fail to find elements; needs graceful degradation)
- What happens when the "Show All" button doesn't exist? (Script handles null check gracefully)
- What happens when the script runs before the agent list is loaded? (MutationObserver continues monitoring and applies tags when content appears)
- What happens on the mymarketingreports.com domain? (Script works identically - both domains are supported via @match)
- What happens when hovering over division filter buttons? (Button color darkens for visual feedback)
- What happens if two instances of the script run simultaneously? (Duplicate tags appear; script should add idempotency checks)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Script MUST automatically categorize agents into divisions (SEO, PDM, Analytics, Creative, Ops, CE, PM) based on keyword pattern matching in agent name and description
- **FR-002**: Script MUST display visual division badges with unique colors and emoji icons for each division category
- **FR-003**: Script MUST provide clickable filter buttons for each division that show/hide agents
- **FR-004**: Script MUST provide a "Reset" button that clears all filters and shows all agents
- **FR-005**: Script MUST automatically click the "Show All" pagination button when the agents page loads
- **FR-006**: Script MUST work on both app.ninjacat.io and app.mymarketingreports.com domains
- **FR-007**: Script MUST handle Single Page Application (SPA) behavior using MutationObserver to detect dynamic content changes
- **FR-008**: Script MUST prevent duplicate tagging when content updates multiple times
- **FR-009**: Script MUST provide hover effects on filter buttons for improved UX
- **FR-010**: Script MUST indicate which filter is currently active via visual styling

### Division Pattern Definitions

- **SEO Division** (🔍 #F59E0B): Keywords include "seo", "keyword", "organic", "serp", "search intent", "landing page", "content gap", "people also ask"
- **PDM Division** (💸 #3B82F6): Keywords include "paid", "ppc", "ad copy", "budget", "google ads", "media mix", "campaign", "spend", "paid search"
- **Analytics Division** (📈 #10B981): Keywords include "analytics", "anomalie", "ga4", "seer signals", "bq", "report", "data", "insights"
- **Creative Division** (🎨 #EC4899): Keywords include "creative", "design", "logo", "fatigue", "tiktok", "unique content"
- **Ops Division** (🛠️ #6B7280): Keywords include "calendar", "ops", "taxonomy", "operation", "process", "admin"
- **CE Division** (🤝 #8B5CF6): Keywords include "client", "call prep", "engagement"
- **PM Division** (📅 #F97316): Keywords include "project", "timeline", "manage", "schedule"

### Key Entities

- **Agent Card**: Represents a NinjaCat agent in the UI; contains name, description, and metadata; identified by `data-automation-id^="data-table-row"`
- **Division Tag**: Visual badge component displaying division name, icon, and color; attached to agent cards; stored as `data-seer-tags` attribute
- **Filter Bar**: UI component containing clickable division buttons and reset button; inserted above the agent list
- **Pattern Matcher**: Logic component that maps keywords to division categories; case-insensitive matching

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify agent divisions visually within 1 second of page load without reading descriptions
- **SC-002**: Users can filter to a specific division and see only relevant agents with one click (< 2 seconds)
- **SC-003**: Script successfully tags at least 80% of agents with at least one division (based on current NinjaCat agent naming conventions)
- **SC-004**: Script handles SPA navigation and content updates without requiring page refresh
- **SC-005**: Filter state is visually clear - users can tell which filter is active at a glance
- **SC-006**: Script works reliably on both ninjacat.io and mymarketingreports.com domains
- **SC-007**: No duplicate tags appear even after multiple SPA navigation cycles
