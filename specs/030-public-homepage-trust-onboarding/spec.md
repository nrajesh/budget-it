# Feature Specification: Public Homepage Trust Onboarding

**Feature Branch**: `030-public-homepage-trust-onboarding`
**Created**: 2026-04-27
**Input**: User description: "Use home pages like https://apfel.franzai.com as an example to construct a home page that adheres to current UI standards. Retain the light/ dark switcher i.e. similar coloring standards & language switcher. The user should be able to find the commands that either helps them to quickly install this app using commands or quickly visit /ledgers page to begin using the app. Ensure the user is also alerted on fundamentals of app usage like uploading csv/ importance of automated backups (so that they don't lose data when cache is cleared or in a private window). Purpose will be to convey that this app is Privacy-first, Data local & Open sourced. The page should convey a sense of trust & what a complete money management/ account tracker this app is, to any new user"

## User Scenarios and Testing

### User Story 1 - New visitor understands the product (Priority: P1)

As a first-time visitor, I want the root page to explain Vaulted Money's privacy-first, local data, open-source stance and the breadth of money-management features, so that I can decide whether to trust and try the app.

**Acceptance Criteria**:

1. Given a visitor opens `/`, when the page loads, then the first viewport clearly shows "Vaulted Money", privacy/local/open-source trust signals, and a product-style preview.
2. Given a visitor scans the page, when they reach the trust and workflow sections, then they can see that the app covers ledgers, CSV imports, accounts, budgets, reports, scheduled transactions, and backups.

### User Story 2 - Visitor can start quickly (Priority: P1)

As a visitor ready to use the app, I want a direct `/ledgers` path and local install commands, so that I can either start in the hosted app flow or run the app myself.

**Acceptance Criteria**:

1. Given a visitor is on `/`, when they choose the primary action, then they navigate to `/ledgers`.
2. Given a visitor wants to self-host or run locally, when they view the install section, then web and desktop command blocks are visible and copyable.

### User Story 3 - Visitor receives data safety guidance (Priority: P1)

As a privacy-conscious user, I want clear warnings about CSV imports and backups, so that I do not confuse local-first storage with permanent cloud storage.

**Acceptance Criteria**:

1. Given a visitor reads the fundamentals section, then they see guidance to import CSV data after creating a ledger.
2. Given a visitor reads the fundamentals section, then they see that private windows, browser resets, or clearing site data can remove local storage and backups matter.

## Requirements

- **FR-001**: The app MUST expose a public home page at `/` that does not require an active ledger.
- **FR-002**: The existing authenticated dashboard MUST remain reachable after a ledger is selected.
- **FR-003**: The home page MUST retain the existing language switcher and light/dark toggle behavior.
- **FR-004**: The home page MUST include direct navigation to `/ledgers`.
- **FR-005**: The home page MUST include local install commands for web and desktop usage.
- **FR-006**: The home page MUST explain CSV import and backup fundamentals.
- **FR-007**: The home page MUST communicate "Privacy-first", "Data local", and "Open sourced" as primary trust messages.
- **FR-008**: The design MUST work in light and dark themes and be responsive across mobile and desktop widths.

## Success Criteria

- **SC-001**: A new visitor can reach `/` without being redirected to `/ledgers`.
- **SC-002**: A user can reach `/ledgers` from the first viewport and the install section.
- **SC-003**: A selected ledger opens into the dashboard route instead of the public homepage.
- **SC-004**: The project builds successfully after the routing and homepage changes.
