# Implementation Plan: Public Homepage Trust Onboarding

**Branch**: `030-public-homepage-trust-onboarding`
**Date**: 2026-04-27
**Spec**: [spec.md](./spec.md)

## Summary

Create a public homepage inspired by command-forward product pages such as apfel.franzai.com, while preserving Vaulted Money's local-first finance-app tone. Move the existing app dashboard from `/` to `/dashboard` so `/` can serve new visitors without requiring an active ledger.

## Technical Context

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI primitives
- **Routing**: `react-router-dom`
- **Theme**: `next-themes` with existing `LanguageSwitcher`
- **Data model**: No data-model changes
- **Privacy**: No analytics, telemetry, remote storage, or new network calls

## Implementation Steps

1. Add `src/pages/HomePage.tsx` with public landing content, language switcher, theme toggle, `/ledgers` calls to action, install commands, and backup/CSV guidance.
2. Register `/` as the public home route in `src/App.tsx`.
3. Move the existing dashboard route to `/dashboard`.
4. Update the sidebar dashboard link and page title handling.
5. Update ledger selection to hard reload into `/dashboard`.
6. Move dashboard help-tour routing from `/` to `/dashboard`.
7. Verify formatting, type checking, build, and visual behavior.

## Risks and Mitigations

- **Risk**: Existing tests or navigation references assume `/` is the dashboard.
  **Mitigation**: Update route references and tour test coverage to use `/dashboard`.
- **Risk**: The public homepage might accidentally trigger the active-ledger redirect.
  **Mitigation**: Keep the homepage outside the authenticated `Layout` route.
- **Risk**: Local-first copy may imply data is permanently safe.
  **Mitigation**: Include explicit backup guidance about cache clearing and private windows.
