---
description: "End-to-end feature development workflow: from branch creation to squash merge."
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: Manage the complete feature development lifecycle from initialization to merge.

Execution steps:

1. **Initialize Feature**:
   - **Input**: `$ARGUMENTS` (Feature Description)
   - **Action**: Run `.specify/scripts/bash/create-new-feature.sh "Feature Description"`.
   - **Validation**: Ensure the script switches to the new branch successfully.

## 2. Specification (Speckit.Specify)
- **Goal**: Create a detailed `spec.md`.
- **Action**: 
  - Analyze the feature description.
  - If ambiguous, ask up to 3 clarification questions.
  - Create or update `specs/[branch]/spec.md` with:
    - Problem Statement
    - Goals / Non-Goals
    - User Stories
    - Functional Requirements
    - Non-Functional Requirements
    - Localization Strategy (required when UI text changes), including:
      - Supported locales and market priority (minimum: `en` + at least 2 non-English locales for budgeting parity).
      - Translation quality bar (tone, financial terminology consistency, and UX parity expectations).
      - Message catalog ownership model and fallback behavior.
      - Automation expectations (extract, validate, sync, and release workflow).
      - Seamless runtime language switching requirements:
        - Language can be changed from any screen without full-page refresh/navigation reset.
        - All rendered UI surfaces must update instantly (pages, help text, workflows, modal windows, popovers, toasts/tooltips).
        - Switching language MUST preserve in-progress user input and unsaved draft state.
      - Data integrity guarantees:
        - Locale changes must not mutate business data values, IDs, or persisted records.
        - Numeric, currency, and date formatting may change presentation only; stored canonical values remain unchanged.

## 3. Planning (Speckit.Plan)
- **Goal**: Create a technical implementation plan.
- **Action**: 
  - Create `specs/[branch]/plan.md`.
  - Content should include:
    - Technical Context
    - Proposed Changes (files to modify/create)
    - Verification Plan
    - i18n Design (when any user-facing text is introduced/changed):
      - Translation key strategy (stable keys, namespace conventions, no hardcoded strings).
      - Tooling automation (`extract` + `validate` + `sync` scripts).
      - Upgrade and maintainability plan (how new locales and keys are added safely).
      - Runtime fallback and missing-key monitoring behavior.
      - Runtime switching architecture:
        - Locale state managed centrally (context/store) and consumed reactively by all view layers.
        - No `window.location.reload()` or equivalent refresh-based language switching allowed.
        - UI state boundaries defined so dialogs/forms remain mounted or state is preserved during locale updates.
      - Data safety architecture:
        - Strong separation between localized display strings and persisted domain models.
        - Regression protections for form state, draft transactions, and pending workflow operations during locale change.

## 4. Checklist (Speckit.Checklist)
- **Goal**: Quality assurance before coding.
- **Action**: 
  - Create `specs/[branch]/checklists/quality.md`.
  - Verify the spec and plan against project principles.

## 5. Implementation Tasks (Speckit.Tasks)
- **Goal**: Break down work into actionable steps.
- **Action**: 
  - Create `specs/[branch]/tasks.md`.
  - List tasks in execution order (Start with "Phase 1: Setup", etc.).
  - If UI text is changed, tasks MUST include:
    - Add/update translation keys for all supported locales.
    - Run translation extraction + sync automation.
    - Validate no missing or orphaned keys.
    - Verify UI copy and number/currency/date localization behavior.
    - Add tests for in-place locale switching from at least one page, one modal, one help/workflow UI, and one popup surface.
    - Add tests proving no data loss/corruption of unsaved form inputs, draft entities, and persisted records after locale switch.

## 6. Implementation (Speckit.Implement)
- **Goal**: Write the code.
- **Action**: 
  - Execute tasks from `tasks.md` one by one.
  - Mark tasks as `[x]` upon completion.
  - Check off items in `task.md` (the main agent task tracker) as you progress.
- **Validation**: Verify each step.

## 7. Cross-Artifact Analysis (Speckit.Analyze)
- **Goal**: Validate consistency and quality before merging.
- **Trigger**: Only proceed after all implementation tasks are verified complete.
- **Action**:
  - Run non-destructive cross-artifact consistency and quality analysis.
  - Check `spec.md`, `plan.md`, and `tasks.md` for inconsistencies, duplications, ambiguities, and coverage gaps.
  - Validate against project constitution (`.specify/memory/constitution.md`).
  - Produce a structured analysis report with severity ratings.
- **Gate**:
  - **If CRITICAL issues found**: STOP. Report issues and ask user to resolve before merging.
  - **If only LOW/MEDIUM issues**: Warn user but allow proceeding to merge.
  - **If all clear**: Automatically proceed to verify step.

## 8. Local Verification Gate (NON-NEGOTIABLE)
- **Goal**: Catch lint, formatting, type, and build errors BEFORE merging - mirroring the CI pipeline locally.
- **Trigger**: Only proceed after cross-artifact analysis passes.
- **Action**: Run the following checks sequentially. ALL must pass before merging.

  **0. One-shot (recommended)**: `pnpm validate` — runs TypeScript, ESLint, and Prettier **check** on `src` (same combination as a healthy pre-push run). If Prettier fails, run `pnpm format`, re-run `pnpm validate`, then commit formatting.

  **1. Format Check**: `pnpm format:check` (or `npx prettier --check "src/**/*.{ts,tsx,css}"`)
     - If fails: Run `pnpm format` to auto-fix, then re-check. Commit the formatting fixes.
  
  **2. Lint**: `pnpm lint` (or `npx eslint .`)
     - If fails: Fix lint errors, then re-check. Commit the fixes.
  
  **3. Type Check**: `pnpm exec tsc --noEmit`
     - If fails: Fix type errors, then re-check. Commit the fixes.
  
  **4. Build**: `pnpm build`
     - If fails: Fix build errors, then re-check. Commit the fixes.

  **5. Translation Coverage + Sync (required for any UI copy change)**:
     - Run project i18n automation before merge:
       - `pnpm i18n:extract` (or project equivalent) to collect keys from source.
       - `pnpm i18n:sync` (or project equivalent) to propagate keys to locale catalogs.
       - `pnpm i18n:check` (or project equivalent) to fail on missing/invalid keys.
     - If any command fails:
       - Fix missing keys, schema/format errors, and fallback gaps.
       - Re-run until all commands pass.
     - Commit translation catalog updates in the feature branch.

  **6. Runtime Locale-Switch Integrity (required for localization work)**:
     - Run automated tests that verify language switching happens without refresh and without state loss.
     - Required checks:
       - Page-level content updates live after locale switch.
       - Modal/popover/help/workflow UI updates live after locale switch.
       - In-progress form values and unsaved drafts remain intact after locale switch.
       - Domain data remains unchanged (only localized presentation changes).
     - If any check fails:
       - Fix state management or i18n boundaries.
       - Re-run tests until all pass.
- **Gate**:
  - **If ANY check fails after fix attempts**: STOP. Report the failure and ask user to resolve.
  - **If ALL pass**: Proceed to merge.
- **Notify**: Report verification results to user, e.g. "✅ All local checks passed (format, lint, types, build, i18n, runtime locale-switch integrity)."

## 9. Build-Time Translation Refresh (RECOMMENDED DEFAULT)
- **Goal**: Keep translation catalogs in lockstep with every local/CI build.
- **Trigger**: Whenever build scripts are updated or any UI text changes.
- **Action**:
  - Ensure `pnpm build` (and CI build) includes a pre-build i18n sync/check stage.
  - Preferred flow:
    ```bash
    pnpm i18n:extract
    pnpm i18n:sync
    pnpm i18n:check
    pnpm build
    ```
  - If this automation is not yet wired into build scripts, create a follow-up task in `specs/[branch]/tasks.md` and DO NOT mark the feature complete until added.
- **Gate**:
  - **If translations are not synced/validated as part of build path**: STOP and report a workflow gap.

## 10. Mobile Sync (iOS & Android) - REQUIRED before merge
- **Goal**: Ensure iOS and Android Capacitor bundles include the latest web assets.
- **Trigger**: Only after Step 8 and Step 9 pass.
- **Action**:
  ```bash
  pnpm build              # Compile latest web assets → dist/
  npx cap sync ios        # Copy dist/ → ios/App/App/public/
  npx cap sync android    # Copy dist/ → android/app/src/main/assets/public/
  ```
- **Commit the sync**:
  ```bash
  git add ios/ android/
  git commit -m "chore: sync web build to iOS and Android"
  ```
- **Note**: After merging to pre-prod or main, the user must do a **clean build in Xcode / Android Studio** to pick up the updated assets.

## 11. Merge to Pre-Prod
- **Goal**: Squash merge and cleanup.
- **Trigger**: Only proceed after local verification passes (Step 8), translation build-refresh gate passes (Step 9), and mobile sync is complete (Step 10).
- **Action**:
  - **Ask User**: "Feature complete and all checks passed. Ready to squash merge to `pre-prod`? (y/n)"
  - **If Yes**:
    ```bash
    git add . && git commit -m "feat: [feature name] implementation"
    git checkout pre-prod
    git merge --squash [feature-branch]
    git commit -m "feat: [feature name]"
    git branch -D [feature-branch]
    ```
  - **Notify**: "Feature merged to pre-prod and local branch deleted."
