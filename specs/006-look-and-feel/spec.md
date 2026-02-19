# Feature Specification: Insights UI Consistency

**Feature Branch**: `006-look-and-feel`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "Look and feel of insights is not matching other screens. Correct the header, section borders etc to be uniform with other modules"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent UI Experience (Priority: P1)

As a user, I want the Insights page to look and feel like the rest of the application (Analytics, Transactions) so that I have a consistent visual experience.

**Why this priority**: The current Insights page looks disjointed from the rest of the application, lowering the perceived quality/polish.

**Independent Test**: Navigate between Analytics, Transactions, and Insights. The background, header styling, and general spacing/containers should feel identical.

**Acceptance Scenarios**:

1. **Given** I am on the Insights page, **When** I look at the header, **Then** it should match the Analytics header (Gradient text, 4xl font, specific font weight).
2. **Given** I am on the Insights page, **When** I look at the background, **Then** it should have the same slate/dark gradient background as Analytics/Transactions.
3. **Given** I am on the Insights page, **When** I look at the content sections (Budget Analysis, Trends), **Then** they should be contained/styled consistently with other modules (using cards or consistent borders/spacing).

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The `Insights` page main container MUST match the styling of `Analytics` and `Transactions` pages (background color, rounded corners, min-height, transition).
- **FR-002**: The `Insights` page header MUST use the shared gradient styling found in `Analytics`.
- **FR-003**: The "Budget Analysis" and "Trends" sections MUST be visually separated in a way that aligns with the app's design language (currently `Analytics` uses Cards for charts, `Transactions` uses a bordered container for the table).

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+) and desktop.
- **FR-STD-02**: Feature MUST support both Light and Dark modes using Tailwind CSS variables.

### Component Impact
- **Modified Components**: `src/pages/Insights.tsx`

### Key Entities (Budget It Core)
- **Budget**: Displayed in the Budget Analysis section.
- **Transaction**: Used to calculate trends.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Visual regression testing (manual) verifies that Insights Header matches Analytics Header.
- **SC-002**: Visual regression testing (manual) verifies the background and container match.
