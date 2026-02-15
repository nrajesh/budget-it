---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Components**: `src/components/[feature]/` or `src/components/ui/`
- **Pages**: `src/pages/`
- **Hooks**: `src/hooks/`
- **Contexts**: `src/contexts/` & `src/providers/`
- **Utils**: `src/utils/`
- **Electron**: `electron/`

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  ============================================================================
-->

## Phase 1: Setup & Scaffolding

**Purpose**: Preparing the ground for the new feature.

- [ ] T001 Create feature directory `src/components/[feature]/`
- [ ] T002 Update `src/types/index.ts` with new data interfaces (Zod schemas)
- [ ] T003 [P] Create empty route page in `src/pages/[feature].tsx`
- [ ] T004 Add route to `App.tsx` (hidden behind flag if needed)

---

## Phase 2: Foundational Logic (State & Data)

**Purpose**: Core logic and state management.

- [ ] T005 Create Dexie table definition in `src/data/db.ts` (if new entity)
- [ ] T006 Implement db migration logic
- [ ] T007 [P] Create custom hook `use[Feature]` in `src/hooks/use[Feature].ts`
- [ ] T008 Implement TanStack Query functions (fetch/mutate) in the hook
- [ ] T009 Add new Context in `src/contexts/[Feature]Context.tsx` (if global state needed)

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description]

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create UI component `src/components/[feature]/[Component].tsx`
- [ ] T011 [P] [US1] Create complementary UI component `src/components/[feature]/[SubComponent].tsx`
- [ ] T012 [US1] Integrate `use[Feature]` hook into components
- [ ] T013 [US1] Implement interactive logic (click handlers, form submission)
- [ ] T014 [US1] Add form validation using Zod
- [ ] T015 [US1] Verify responsive layout (Mobile/Desktop)
- [ ] T016 [US1] Verify Theme compatibility (Dark/Light)

**Checkpoint**: Feature is usable locally.

---

## Phase 4: Integration & Polish

**Purpose**: Ensure seamless experience and edge case handling.

- [ ] T017 Verify offline behavior (disconnect network and test)
- [ ] T018 Test in Electron build (run `pnpm run electron:dev`)
- [ ] T019 Add comprehensive JSDoc comments
- [ ] T020 Run `pnpm lint` and `pnpm format`

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
