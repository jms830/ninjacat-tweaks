# Feature Specification: NinjaCat Chat UX Enhancements

**Feature Branch**: `002-ninjacat-chat-ux`  
**Created**: 2025-12-02  
**Status**: Draft  
**Input**: User feedback and feature requests for improved chat experience

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-file Drag & Drop Upload (Priority: P1)

As a NinjaCat user, I want to drag and drop multiple files onto the chat area, so I can quickly attach several files without clicking through the file picker multiple times.

**Why this priority**: File handling is a common friction point. The hidden input already supports `multiple=""`, so this is mostly UI enhancement with low risk.

**Independent Test**: Drag multiple files onto chat area, verify all files are added to the upload queue.

**Acceptance Scenarios**:

1. **Given** I'm on the chat page, **When** I drag files over the chat area, **Then** a visual drop zone overlay appears
2. **Given** the drop zone is visible, **When** I drop multiple files, **Then** all valid files are queued for upload
3. **Given** I drop files with invalid extensions, **When** the drop completes, **Then** invalid files are rejected with a brief toast/message
4. **Given** files are queued, **When** I view the input area, **Then** I see a count/preview of attached files
5. **Given** the native file picker opens, **When** I select multiple files, **Then** all selected files are attached (existing behavior, verify it works)

---

### User Story 2 - Message Queue with Visible Pending UI (Priority: P2)

As a NinjaCat user, I want to queue up to 3 messages while the agent is running, so I can capture my thoughts without waiting and see what's pending.

**Why this priority**: Improves workflow significantly but requires careful state management. Depends on always-unlocked input (P2).

**Independent Test**: While agent is running, type and send 3 messages, verify they appear in a pending queue UI.

**Acceptance Scenarios**:

1. **Given** the agent is processing, **When** I type a message and press send, **Then** the message is added to a visible pending queue
2. **Given** I have messages in queue, **When** I view the chat, **Then** I see my pending messages with "Pending" indicator
3. **Given** I have 3 messages queued, **When** I try to send a 4th, **Then** I see a message that the queue is full
4. **Given** messages are queued, **When** the agent finishes, **Then** the first queued message is automatically sent
5. **Given** messages are queued, **When** I click a pending message, **Then** I can edit or cancel it

---

### User Story 3 - Always Unlocked Input (Priority: P2)

As a NinjaCat user, I want the chat input to never be locked/disabled, so I can always type even while the agent is processing.

**Why this priority**: Core enabler for message queue. Must work reliably to avoid user frustration.

**Independent Test**: While agent is running, verify textarea remains editable and send button works (queues message).

**Acceptance Scenarios**:

1. **Given** the agent is processing a request, **When** I click the textarea, **Then** I can type normally
2. **Given** the agent is running, **When** I type and press Enter, **Then** my message is queued (not blocked)
3. **Given** the input would normally be disabled, **When** the script runs, **Then** disabled state is overridden
4. **Given** rapid agent state changes, **When** I'm typing, **Then** my input is not interrupted or cleared

---

### User Story 4 - Cancel Chat with Partial Response Preservation (Priority: P3)

As a NinjaCat user, I want to cancel an in-progress agent response and keep what was generated, so I can stop runaway responses without losing partial output.

**Why this priority**: Nice-to-have that requires identifying/intercepting cancel mechanism. Lower risk but lower priority.

**Independent Test**: While agent is responding, click cancel, verify partial response is preserved in chat.

**Acceptance Scenarios**:

1. **Given** the agent is generating a response, **When** I click the cancel button, **Then** a confirmation dialog appears (if simple to implement)
2. **Given** I confirm cancellation, **When** the agent stops, **Then** the partial response remains visible in chat
3. **Given** I cancel, **When** viewing the chat, **Then** the partial response is marked as "[Cancelled]" or similar
4. **Given** no cancel button exists natively, **When** the script runs, **Then** a cancel button is added to the UI

---

### User Story 5 - Error Recovery with Queue Pause (Priority: P2)

As a NinjaCat user, when an error occurs I want the input unlocked and queued messages paused (not auto-sent), so I can decide how to recover without losing my queued thoughts.

**Why this priority**: Critical for trust - auto-sending after errors would be frustrating. Pairs with queue feature.

**Independent Test**: Trigger an error state, verify input is unlocked and queue is paused with user prompt.

**Acceptance Scenarios**:

1. **Given** an agent error occurs, **When** the error is detected, **Then** the input is immediately unlocked
2. **Given** I have queued messages and an error occurs, **When** viewing the queue, **Then** queued messages are paused (not auto-sent)
3. **Given** queue is paused after error, **When** I click "Resume Queue", **Then** queued messages begin sending
4. **Given** queue is paused, **When** I click "Clear Queue", **Then** all pending messages are discarded
5. **Given** an error state, **When** I type a new message, **Then** I can send it immediately (bypasses queue)

---

### Edge Cases

- What if the DOM structure changes in a NinjaCat update? (Graceful degradation - features fail silently)
- What if files exceed size limits? (Show error toast, don't crash)
- What if agent state detection fails? (Default to unlocked input, no queue auto-send)
- What if user navigates away with queued messages? (Clear queue, no persistence needed)
- What if multiple rapid sends happen? (Debounce, enforce queue limit)
- What if the cancel button doesn't exist natively? (Add our own, or skip feature)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Script MUST add a visible drag-drop zone overlay when files are dragged over the chat area
- **FR-002**: Script MUST allow multiple files to be dropped and attached to the chat
- **FR-003**: Script MUST reject files that don't match accepted extensions with user feedback
- **FR-004**: Script MUST keep the chat input (`#autoselect-experience`) always editable
- **FR-005**: Script MUST provide a message queue (max 3 messages) when agent is processing
- **FR-006**: Script MUST display pending messages in a visible UI element
- **FR-007**: Script MUST allow editing/cancelling of queued messages
- **FR-008**: Script MUST auto-send queued messages when agent completes (unless paused)
- **FR-009**: Script MUST pause queue and unlock input on error states
- **FR-010**: Script MUST work on both app.ninjacat.io and app.mymarketingreports.com domains
- **FR-011**: Script SHOULD add a cancel button if one doesn't exist natively
- **FR-012**: Script SHOULD preserve partial responses when cancelled

### Non-Functional Requirements

- **NFR-001**: Script MUST NOT break existing chat functionality
- **NFR-002**: Script MUST fail gracefully if DOM selectors change
- **NFR-003**: Script SHOULD have minimal visual impact (blend with existing UI)
- **NFR-004**: Script MUST handle SPA navigation without requiring page refresh

### Key DOM Selectors

| Element | Selector | Purpose |
|---------|----------|---------|
| Chat textarea | `#autoselect-experience` | Main input field |
| File input | `input[type="file"].hidden` | Hidden file picker (has `multiple=""`) |
| Input container | `.border.rounded-3xl.bg-white` | Visual input box for styling |
| Attach icon | First `<svg>` in `.flex.items-center` | Trigger for file picker |

*See `contracts/dom-selectors.md` for full details*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can drag-drop multiple files without using the file picker
- **SC-002**: Users can type and queue messages while agent is running
- **SC-003**: Input is never locked/disabled during normal operation
- **SC-004**: Queued messages are visible and can be edited/cancelled
- **SC-005**: Error states unlock input and pause queue (don't auto-send)
- **SC-006**: Script works on both ninjacat.io and mymarketingreports.com
- **SC-007**: No regressions to existing chat functionality

## Implementation Notes

### Phase 1 (MVP)
1. Drag-drop overlay + multi-file handling
2. Always-unlocked input (override disabled state)

### Phase 2
3. Message queue with visible pending UI
4. Error recovery (unlock + pause queue)

### Phase 3
5. Cancel button + partial response preservation

### Technical Approach

- Use MutationObserver to detect agent state changes
- Override `disabled` attribute on textarea via observer
- Intercept send button click to queue vs send based on agent state
- Store queue in memory (no persistence needed)
- Add CSS for drop zone, pending message UI
