# Contributing to Budget It

First off, thank you for considering contributing to Budget It! It's people like you that make Budget It such a great tool for personal finance.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone the project** to your own machine.
3. **Install dependencies** using `pnpm install` (we use `pnpm` as our package manager).
4. **Create a branch** for your feature or bug fix: `git checkout -b feature/my-new-feature` or `git checkout -b bugfix/issue-description`.

## Code Standard and Review

We strongly encourage you to read our [Code Review Guidelines](documentation/CODE_REVIEW.md), which detail our expectations around:
- Coding Standards (ESLint, Prettier)
- Refactoring and Maintainability
- Testing
- Accessibility (a11y)

### Validating Your Changes

Before committing your changes, please run the following checks locally:

```bash
# Check formatting
pnpm format:check

# Run linter
pnpm lint

# Run type check
pnpm exec tsc --noEmit

# Ensure the project builds
pnpm build
```

We also provide a handy `pnpm validate` script that runs type checking and linting.

## Development Workflow
If you are adding a new feature, please take a look at our [Speckit Workflows](documentation/SPEC_DRIVEN_DEVELOPMENT.md), specifically the `speckit.feature` workflow to help define specifications and implementations.

## Submitting a Pull Request
- Ensure your code is thoroughly tested.
- Fill out the Pull Request template comprehensively.
- Link the Pull Request to any relevant issues.
- Keep the diff small and focused; if your PR is doing too much, consider breaking it into smaller PRs.
- Wait for a maintainer to review your code. Do not push force updates unless requested.

Once your PR is approved and all CI checks pass, it will be merged by a maintainer!
