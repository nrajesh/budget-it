# Research - Dependabot Configuration

## Dependency Analysis

### Decision: Target Root `package.json`
- **Rationale**: The core dependencies for the application (React, Vite, Electron, etc.) are all defined in the root `package.json`.
- **Alternatives Considered**:
    - **Scanning all subdirectories**: Rejected as `dist-electron` contains build artifacts, not source dependencies.
    - **Separate configuration for `electron` folder**: Rejected as the project structure consolidates dependencies in the root.

### Decision: Use `npm` Ecosystem
- **Rationale**: Dependabot supports `npm` ecosystem which handles `package.json` and `lockfiles` (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`).
- **Support**: High. Dependabot native support.

## Schedule Configuration

### Decision: Weekly on Mondays at 05:00 UTC
- **Rationale**: User request to avoid mid-week disruptions and have updates ready for the start of the week.
- **Configuration**:
    ```yaml
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "Etc/UTC"
    ```
