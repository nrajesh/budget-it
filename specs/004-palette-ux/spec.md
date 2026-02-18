# 🎨 Palette UX Enhancement: Add aria-labels to Icon-Only Buttons

## Problem Statement

Many interactive icon-only buttons across the application lack `aria-label` attributes or screen-reader-only text. This means screen readers announce them as unlabelled buttons, making the app inaccessible to visually impaired users. Some files (`Layout.tsx`, `TransactionActions.tsx`) already follow good patterns with `sr-only` spans, but the majority of icon-only buttons do not.

## Goals

- Add `aria-label` attributes to all icon-only `<Button size="icon">` instances missing accessible labels
- Ensure screen readers announce meaningful action names (e.g., "Edit budget", "Delete", "Previous month")
- Follow existing patterns already used in the codebase

## Non-Goals

- No visual changes — this is purely an accessibility enhancement
- No new dependencies
- No backend logic changes
- No page redesigns or component restructuring

## Accessibility Impact

**High.** Icon-only buttons are among the most common WCAG 2.1 violations. Without labels, screen readers announce them as "button" with no context, making the app unusable for keyboard-only and screen reader users.

## User Stories

### Before
A screen reader user navigating the budget cards footer hears: "button… button…" with no indication of what each button does.

### After
The same user hears: "Edit budget, button… Delete budget, button…" — immediately clear and actionable.

## Functional Requirements

1. Every `<Button size="icon">` must have an `aria-label` attribute describing the action
2. Labels should be concise and action-oriented (e.g., "Edit", "Delete", "Previous month", "Next month")
3. Follow existing patterns from `Layout.tsx` (`sr-only` spans) or direct `aria-label` attributes

## Non-Functional Requirements

1. No visual changes to the UI
2. Total changes must stay under 50 lines
3. Must pass existing lint, type-check, and build gates
