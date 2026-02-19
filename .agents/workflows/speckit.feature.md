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

## 3. Planning (Speckit.Plan)
- **Goal**: Create a technical implementation plan.
- **Action**: 
  - Create `specs/[branch]/plan.md`.
  - Content should include:
    - Technical Context
    - Proposed Changes (files to modify/create)
    - Verification Plan

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
- **Goal**: Catch lint, formatting, type, and build errors BEFORE merging — mirroring the CI pipeline locally.
- **Trigger**: Only proceed after cross-artifact analysis passes.
- **Action**: Run the following checks sequentially. ALL must pass before merging.
  
  **1. Format Check**: `pnpm format:check` (or `npx prettier --check "src/**/*.{ts,tsx,css}"`)
     - If fails: Run `pnpm format` to auto-fix, then re-check. Commit the formatting fixes.
  
  **2. Lint**: `pnpm lint` (or `npx eslint .`)
     - If fails: Fix lint errors, then re-check. Commit the fixes.
  
  **3. Type Check**: `pnpm exec tsc --noEmit`
     - If fails: Fix type errors, then re-check. Commit the fixes.
  
  **4. Build**: `pnpm build`
     - If fails: Fix build errors, then re-check. Commit the fixes.
- **Gate**:
  - **If ANY check fails after fix attempts**: STOP. Report the failure and ask user to resolve.
  - **If ALL pass**: Proceed to merge.
- **Notify**: Report verification results to user, e.g. "✅ All local checks passed (format, lint, types, build)."

## 9. Merge to Pre-Prod
- **Goal**: Squash merge and cleanup.
- **Trigger**: Only proceed after local verification passes (Step 8).
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
