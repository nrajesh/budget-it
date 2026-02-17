---
description: End-to-end feature development workflow: from branch creation to squash merge.
---

# Feature Development Workflow

This workflow automates the lifecycle of a feature: Branch -> Spec -> Plan -> Implement -> Merge.

**Usage**: `@[/speckit.feature] "Feature Description"`

## 1. Initialize Feature
- **Input**: specific feature description from user.
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
  - content should include:
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

## 7. Merge to Pre-Prod
- **Goal**: Squash merge and cleanup.
- **Trigger**: Only proceed after all tasks are verified complete.
- **Action**:
  - **Ask User**: "Feature complete. Ready to squash merge to `pre-prod`? (y/n)"
  - **If Yes**:
    1. `git add . && git commit -m "feat: [feature name] implementation"` (if changes pending)
    2. `git checkout pre-prod`
    3. `git merge --squash [feature-branch]`
    4. `git commit -m "feat: [feature name]"`
    5. `git branch -D [feature-branch]`
  - **Notify**: "Feature merged to pre-prod and local branch deleted."

