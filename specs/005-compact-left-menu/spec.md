# Feature Specification: Compact Left Menu

**Feature Branch**: `005-compact-left-menu`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "make the left menu compact just displaying icons. This gives more real estate for the app. Expand it to to show text on mouse over. Add possiblity to keep it fully expanded using a pin. Ensure the pinned state is remembered when app is reloaded"

## User Scenarios & Testing

### User Story 1 - Compact Mode & Hover Expansion (Priority: P1)

As a user, I want the side menu to be compact (icons only) by default, expanding to show text when I hover over it, so that I have more screen real estate for my data while still easily navigating.

**Why this priority**: Core request to maximize real estate.

**Independent Test**: Can be tested by loading the app and hovering over the sidebar.

**Acceptance Scenarios**:
1. **Given** the sidebar is unpinned (collapsed), **When** the page loads, **Then** the sidebar displays only icons (compact width).
2. **Given** the sidebar is unpinned (collapsed), **When** I hover my mouse over the sidebar, **Then** it expands to full width, showing text labels.
3. **Given** the sidebar is expanded via hover, **When** I move my mouse away, **Then** it collapses back to icon-only mode.
4. **Given** the sidebar expands on hover, **Then** it should overlay the content (floating) rather than pushing the layout, to strictly preserve the "real estate" and avoid layout shifting.

---

### User Story 2 - Pinning the Sidebar (Priority: P2)

As a user, I want to be able to "pin" the sidebar so it stays expanded, and have this preference remembered, ensuring a consistent experience across sessions.

**Why this priority**: Provides user control/accessibility for those who prefer labels always visible.

**Independent Test**: Toggle the pin button and reload the page.

**Acceptance Scenarios**:
1. **Given** the sidebar is expanded (either via hover or default), **When** I click the "Pin" button, **Then** the sidebar stays expanded even when I move the mouse away.
2. **Given** the sidebar is pinned, **When** I click the "Unpin" button, **Then** it reverts to compact mode (collapsing when mouse leaves).
3. **Given** I have pinned the sidebar, **When** I reload the page, **Then** the sidebar remains pinned (expanded).
4. **Given** I have unpinned the sidebar, **When** I reload the page, **Then** the sidebar remains unpinned (compact).

## Requirements

### Functional Requirements
- **FR-001**: The sidebar MUST use `collapsible="icon"` mode to ensure it remains visible (compact) when collapsed, NOT hidden (`offcanvas`).
- **FR-002**: The sidebar MUST expand to full width on `mouseenter` when in compact state.
- **FR-003**: The sidebar MUST collapse to compact width on `mouseleave` when in compact state.
- **FR-004**: Hover expansion MUST NOT shift main usage area content (Floating behavior).
- **FR-005**: The sidebar MUST only be pinned/unpinned via the dedicated "Pin" toggle button. Clicking the sidebar body MUST NOT pin it.
- **FR-006**: The pinned state MUST be persisted across reloads (using cookies/localStorage).g., via cookies/localStorage) so it survives reloads.
- **FR-007**: When Pinned, the sidebar acts as a standard fixed sidebar (pushing content).

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+).
    - *Note*: On mobile, the sidebar behavior typically changes (sheets/drawers). This feature primarily targets Desktop. Mobile behavior should remain "Sheet" based or standard mobile drawer.
- **FR-STD-02**: Feature MUST support both Light and Dark modes.

### Component Impact
- **Modified Components**:
    - `src/components/ui/sidebar.tsx`: Update logic to handle hover states and "floating" expansion while keeping the "gap" collapsed.
    - `src/components/Layout.tsx`: Add the Pin toggle button.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Sidebar defaults to collapsed state for new users (or strictly follows the persisted state).
- **SC-002**: Mouse interaction (hover/leave) triggers expansion/collapse instantly (CSS transition).
- **SC-003**: Reloading the page restores the last Pinned state correctly.
