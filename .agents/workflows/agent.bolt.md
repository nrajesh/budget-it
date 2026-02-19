---
description: Performance optimization workflow powered by the Bolt ⚡ agent. No arguments needed.
---

# Bolt ⚡ Performance Agent Workflow

This workflow automates a performance optimization lifecycle: Branch -> Spec -> Plan -> Checklist -> Tasks -> Implement -> Analyze -> **Verify** -> Merge.

**Usage**: `/agent.bolt` (no arguments required)

**Agent Ruleset**: Before starting any step below, read and internalize the agent ruleset at `scheduled-agents/bolt.md`. Every decision you make — from spec writing through to PR creation — must respect Bolt's philosophy, boundaries, and conventions defined in that file.

**Feature Description**: "Identify and implement one small performance improvement that makes the application measurably faster or more efficient."

## 1. Initialize Feature
- **Input**: The fixed feature description above (no user input required).
- **Action**: Run `.specify/scripts/bash/create-new-feature.sh "Bolt performance optimization"`.
  - Use short-name `bolt-perf` when generating the branch.
- **Validation**: Ensure the script switches to the new branch successfully.

## 2. Specification (Speckit.Specify)
- **Goal**: Create a targeted `spec.md` focused on the performance improvement.
- **Action**:
  - Follow the PROFILE step from `scheduled-agents/bolt.md` to identify the best optimization opportunity.
  - Scan the codebase for performance bottlenecks using Bolt's checklist (frontend, backend, general).
  - Create or update `specs/[branch]/spec.md` with:
    - Problem Statement (the specific bottleneck found)
    - Goals / Non-Goals
    - Performance Metrics (before/after expectations)
    - Functional Requirements
    - Non-Functional Requirements

## 3. Planning (Speckit.Plan)
- **Goal**: Create a technical implementation plan.
- **Action**:
  - Create `specs/[branch]/plan.md`.
  - Content should include:
    - Technical Context
    - Proposed Changes (files to modify/create — must be < 50 lines per Bolt's rules)
    - Measurement approach
    - Verification Plan

## 4. Checklist (Speckit.Checklist)
- **Goal**: Quality assurance before coding.
- **Action**:
  - Create `specs/[branch]/checklists/quality.md`.
  - Verify the spec and plan against project principles.
  - Include Bolt-specific checks: measurable impact, readability preserved, no premature optimization.

## 5. Implementation Tasks (Speckit.Tasks)
- **Goal**: Break down work into actionable steps.
- **Action**:
  - Create `specs/[branch]/tasks.md`.
  - List tasks in execution order.
  - Include measurement/benchmarking tasks.

## 6. Implementation (Speckit.Implement)
- **Goal**: Write the optimized code.
- **Action**:
  - Execute tasks from `tasks.md` one by one.
  - Follow Bolt's OPTIMIZE step: clean code, comments explaining the optimization, preserve functionality.
  - Mark tasks as `[x]` upon completion.
- **Validation**: Verify each step follows Bolt's boundaries (no breaking changes, no new deps without asking).

## 7. Cross-Artifact Analysis (Speckit.Analyze)
- **Goal**: Validate consistency and quality before merging.
- **Trigger**: Only proceed after all implementation tasks are verified complete.
- **Action**:
  - Run non-destructive cross-artifact consistency and quality analysis.
  - Check `spec.md`, `plan.md`, and `tasks.md` for inconsistencies.
  - Validate against project constitution (`.specify/memory/constitution.md`).
  - Produce a structured analysis report with severity ratings.
- **Gate**:
  - **If CRITICAL issues found**: STOP. Report issues and ask user to resolve before merging.
  - **If only LOW/MEDIUM issues**: Warn user but allow proceeding to merge.
  - **If all clear**: Automatically proceed to verify step.

## 8. Local Verification Gate (NON-NEGOTIABLE)
- **Goal**: Catch lint, formatting, type, and build errors BEFORE merging.
- **Trigger**: Only proceed after cross-artifact analysis passes.
- **Action**: Run the following checks sequentially. ALL must pass before merging.
  // turbo
  1. **Format Check**: `pnpm format:check` (or `npx prettier --check "src/**/*.{ts,tsx,css}"`)
     - If fails: Run `pnpm format` to auto-fix, then re-check. Commit the formatting fixes.
  // turbo
  2. **Lint**: `pnpm lint` (or `npx eslint .`)
     - If fails: Fix lint errors, then re-check. Commit the fixes.
  // turbo
  3. **Type Check**: `pnpm exec tsc --noEmit`
     - If fails: Fix type errors, then re-check. Commit the fixes.
  // turbo
  4. **Build**: `pnpm build`
     - If fails: Fix build errors, then re-check. Commit the fixes.
- **Gate**:
  - **If ANY check fails after fix attempts**: STOP. Report the failure and ask user to resolve.
  - **If ALL pass**: Proceed to merge.
- **Notify**: Report verification results to user, e.g. "✅ All local checks passed (format, lint, types, build)."

## 9. Merge to Pre-Prod
- **Goal**: Squash merge and cleanup.
- **Trigger**: Only proceed after local verification passes (Step 8).
- **Action**:
  - **Ask User**: "Performance optimization complete and all checks passed. Ready to squash merge to `pre-prod`? (y/n)"
  - **If Yes**:
    1. `git add . && git commit -m "⚡ Bolt: [performance improvement]"` (if changes pending)
    2. `git checkout pre-prod`
    3. `git merge --squash [feature-branch]`
    4. `git commit -m "⚡ Bolt: [performance improvement]"`
    5. `git branch -D [feature-branch]`
  - **Notify**: "Feature merged to pre-prod and local branch deleted."
