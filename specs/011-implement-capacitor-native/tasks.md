# Implementation Tasks: Implement Capacitor Native Mobile Wrapper

**Feature**: 011-implement-capacitor-native
**Spec**: `/specs/011-implement-capacitor-native/spec.md`
**Plan**: `/specs/011-implement-capacitor-native/plan.md`

## Summary
- **Total Tasks**: 7
- **Independent Test Criteria**: iOS Simulator verification as detailed in plan.md
- **Suggested MVP Scope**: Full Phase 3 (US1 & US2 combined due to overlap).

---

## Phase 1: Setup

Goal: Initialize the Capacitor infrastructure within the Vite project.

- [ ] T001 Install Capacitor core and CLI dependencies to `package.json`
- [ ] T002 Initialize Capacitor config (`npx cap init`) targeting `dist` folder
- [ ] T003 Install iOS and Android platforms and sync web build

---

## Phase 2: Foundational

Goal: Establish the new Capacitor filesystem adapter so it is ready for logical routing.

- [ ] T004 Implement `src/utils/fs-capacitor.ts` using `@capacitor/filesystem` for `Directory.Documents` read/write access.
- [ ] T005 Update `src/utils/fs-adapter.ts` to branch filesystem calls to `fs-capacitor.ts` when `Capacitor.isNativePlatform()` is true.

---

## Phase 3: Mobile Onboarding & Automated Background Sync (US1 & US2)

Goal: Wire the UI and application lifecycle to gracefully handle mobile contexts instead of web APIs.

- [ ] T006 Update `src/hooks/useSyncConfig.ts` to skip demanding permission toggles/errors when `Capacitor.isNativePlatform()` is true (since native handles permissions internally or via manifest).
- [ ] T007 Update `src/pages/SettingsPage.tsx` to hide the manual "Select Folder" UI complexity if on Capacitor, replacing it with an informative message that "Sync utilizes the App's native Documents folder".

---

## Phase 4: Polish & Cross-Cutting Concerns

Goal: Ensure zero regressions and formatting compliance.

- [ ] T008 Run lint, TypeScript verification (`tsc --noEmit`), and trigger a standard web build to confirm the web target was unharmed.
