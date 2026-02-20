# Specification-Driven Development (SDD)

> **"Slow is smooth, and smooth is fast."**

Specification-Driven Development (SDD) is a methodology that inverts the traditional coding workflow. Instead of rushing to write code, we first define **what** we are building in natural language, rigorous detail. This "referential integrity" between our intent (the Spec) and our implementation (the Code) eliminates the "assume and fix later" cycle that plagues modern software development.

## The Workflow in Practice

Instead of hacking away at features, we follow a strict Lifecycle:

### 1. Specification (`/speckit.specify`)
**Goal:** Define the "What" and "Why".
We start by describing the feature in natural language. The AI agent acts as a Product Manager, asking clarifying questions until a robust `spec.md` is generated. This document becomes the source of truth.

### 2. Planning (`/speckit.plan`)
**Goal:** Define the "How".
Once the Spec is approved, we move to technical planning. The agent analyzes the codebase and generates a `plan.md`. This plan maps the requirements to specific file changes, ensuring architectural consistency (e.g., sticking to "Local-First" principles).

### 3. Tasking (`/speckit.tasks`)
**Goal:** Define the "When".
The plan is broken down into atomic, verifyable steps in `tasks.md`. This checklist drives the implementation, allowing for granular progress tracking and easier debugging.

### 4. Implementation (`/speckit.implement`)
**Goal:** Execute.
The agent methodically works through the task list, writing code that strictly adheres to the Spec and Plan.

### 5. Checklists, Analysis, and Merging
**Goal:** Verify and merge.
Using workflows like `/speckit.checklist` and `/speckit.analyze`, we evaluate code against requirements.

---

### The End-to-End Feature Workflow (`/speckit.feature`)

Instead of manually running each individual step, the **`/speckit.feature`** workflow automates the contiguous lifecycle. It seamlessly orchestrates branch creation, specifying, planning, tasking, implementing, analyzing, verifying, and merging your changes into the main branch. This is the primary command used for building any new feature.

## Specialized Agent Workflows

Beyond standard feature development, the project utilizes specialized workflows to empower agents to continuously improve targeted areas of the codebase:

- **`/agent.bolt`**: Performance optimization workflow powered by the Bolt ⚡ agent. Focuses on speed, efficiency, and reducing bottlenecks.
- **`/agent.palette`**: UX enhancement workflow powered by the Palette 🎨 agent. Focuses on accessibility, design consistency, micro-animations, and visual polish.
- **`/agent.sentinel`**: Security enhancement workflow powered by the Sentinel 🛡️ agent. Focuses on securing data, enforcing best practices, and patching vulnerabilities.

## The Constitutional Foundation

Our development is governed by a set of immutable rules defined in `documentation/AGENTS.md` and enforced by templates:

1.  **Privacy First**: No data leaves the device unless explicitly exported by the user.
2.  **Local-First**: The application must function 100% offline. IndexDB (via Dexie.js) is the primary data store.
3.  **Component-Driven**: UI is built using Shadcn/UI and Tailwind CSS, prioritizing reusability.

## Why This Matters

By front-loading the decision-making process, we:
*   **Reduce Bugs**: Ambiguities are caught in the Spec phase, not partially implemented in code.
*   **Maintain Velocity**: "Thinking time" is separated from "Coding time". When coding starts, it's just execution.
*   **Ensure Consistency**: Every feature, regardless of size, follows the same architectural patterns.
