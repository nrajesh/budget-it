# Fix Dependabot Security Vulnerabilities

## Problem Statement
The GitHub repository `nrajesh/vaulted-money` has 9 open Dependabot security alerts (5 High, 4 Moderate) affecting transitive dependencies in `pnpm-lock.yaml`. All vulnerable packages are dev/build-time dependencies, not production runtime dependencies.

## Goals
- Resolve all 9 Dependabot alerts by upgrading transitive dependencies
- Ensure no regressions in build, lint, type-check, or test suites
- Close all open Dependabot alerts on GitHub

## Non-Goals
- Upgrading direct dependencies beyond what's needed for security fixes
- Changing application functionality

## Vulnerability Summary

| # | Package | Severity | Vulnerability | Patched | Dependency Path |
|---|---------|----------|--------------|---------|-----------------|
| 1 | tar | High | Symlink Path Traversal (CVE-2024-51717) | ≥7.5.11 | @capacitor/cli > tar |
| 2 | flatted | High | Unbounded recursion DoS in parse() | ≥3.4.0 | @vitest/ui > flatted, eslint > flat-cache > flatted |
| 3 | undici | High | Malicious WebSocket 64-bit length overflow | ≥7.24.0 | jsdom > undici |
| 4 | undici | High | Unbounded Memory Consumption in WebSocket permessage-deflate | ≥7.24.0 | jsdom > undici |
| 5 | undici | High | Unhandled Exception in WebSocket Client | ≥7.24.0 | jsdom > undici |
| 6 | undici | Moderate | HTTP Request/Response Smuggling | ≥7.24.0 | jsdom > undici |
| 7 | undici | Moderate | CRLF Injection via `upgrade` option | ≥7.24.0 | jsdom > undici |
| 8 | undici | Moderate | Unbounded Memory in DeduplicationHandler | ≥7.24.0 | jsdom > undici |
| 9 | yauzl | Moderate | Off-by-one error | ≥3.2.1 | @capacitor/cli > native-run > yauzl |

## Functional Requirements
1. Add pnpm overrides for `undici`, `flatted`, `yauzl`, and update existing `tar` override
2. Run `pnpm install` to regenerate the lockfile
3. Verify `pnpm audit` reports 0 vulnerabilities
