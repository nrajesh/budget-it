# Feature Specification: App Help Tour Module

**Feature Branch**: `027-app-help-tour-feature`  
**Status**: Draft  
**Input**: There are many modules in the app making it unclear for first time budgeting users. Provide on screen visuals or help module something like a question mark icon on top right. From the ledger selection screen onwards add this help menu everywhere and give simple to follow instructions on how to use the screen in the help tour. This needs to be kept updated if there are any changes to the screen or if a screen is added or deleted, so take into account to edit workflow. Consider open source tools like react-joyride, driverjs, or bootstraptour. Ensure theme (light/ dark) is accounted for when setting up the screen tour.

## User Scenarios & Testing

### User Story 1 - App Help Tour Initialization (Priority: P1)

As a first-time budgeting user, I want to see a help icon (question mark) on the top right of the screen starting from the ledger selection screen, so that I can initiate a guided tour of the current screen's features.

**Why this priority**: Discoverability of the help module is the primary entry point for users to understand the app's complex modules.

**Independent Test**: Can be tested by navigating to the ledger selection screen and verifying the presence and clickability of the help icon.

**Acceptance Scenarios**:
1. **Given** the user is on the ledger selection screen or any subsequent screen, **When** the screen loads, **Then** a help icon (question mark) should be visible on the top right.
2. **Given** the user clicks the help icon, **When** the help tour is not currently active, **Then** the help tour for the current screen should begin.

---

### User Story 2 - Guided Screen Tour (Priority: P1)

As a user, I want the help tour to provide simple, easy-to-follow step-by-step instructions highlighting key elements on the current screen, so that I can understand how to use the module.

**Why this priority**: The core value of the feature is to explain the screen's functionality clearly.

**Independent Test**: Can be tested by starting the tour on a specific screen and verifying that all configured steps are shown in order, highlighting the correct elements.

**Acceptance Scenarios**:
1. **Given** the tour is active, **When** the user progresses to the next step, **Then** the relevant UI element should be highlighted with a tooltip explaining its purpose.
2. **Given** the user is in dark or light mode, **When** the tour is displayed, **Then** the tour UI should match the current theme seamlessly.

---

### User Story 3 - Maintainable Tour Configuration (Priority: P2)

As a developer, I want the tour configurations to be centralized and easily maintainable, so that when screens are added, dropped, or modified, updating the tour is a straightforward part of the development workflow.

**Why this priority**: The user explicitly requested that the workflow for editing and maintaining the tour be simple because the app changes frequently.

**Independent Test**: Can be tested by reviewing the codebase to ensure tour steps are defined in an easily accessible configuration file or constant, rather than hardcoded deep within component logic.

**Acceptance Scenarios**:
1. **Given** a developer needs to update a tour step, **When** they modify the central configuration file, **Then** the tour on the respective screen updates automatically.

## Requirements

### Functional Requirements
- **FR-001**: System MUST display a help icon (e.g., Question Mark) on the top right of the application header, visible from the ledger selection screen onwards.
- **FR-002**: System MUST utilize a robust open-source library (e.g., `react-joyride` or `driver.js`) to power the guided tours.
- **FR-003**: System MUST provide specific, step-by-step guided tours for major screens in the application.
- **FR-004**: System MUST ensure the help tour UI responds to the active theme (light/dark mode) of the application.

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+) and desktop.
- **FR-STD-02**: Feature MUST support both Light and Dark modes using Tailwind CSS variables.
- **FR-STD-03**: Feature MUST work offline without any network dependency.
- **FR-STD-04**: Feature MUST be compatible with Web, Electron, and Capacitor environments.
- **FR-STD-05**: Feature MUST be mobile-friendly, ensuring tour tooltips and overlays are usable on small touchscreens (iOS/Android apps and mobile browsers).

### Component Impact
- **New Components**: `src/components/ui/help-tour.tsx` (or similar controller)
- **Modified Components**: `src/components/layout/header.tsx` (to add the help icon)
- **Context Updates**: `src/contexts/TourContext.tsx` (to manage active tour state across screens if needed)

## Success Criteria

### Measurable Outcomes
- **SC-001**: Users can successfully click the help icon and start a tour without errors.
- **SC-002**: Tour steps correctly highlight and explain the existing UI elements on the Ledger Selection screen and subsequent main screens.
- **SC-003**: Theme switching (light/dark) propagates correctly to the tour UI.
