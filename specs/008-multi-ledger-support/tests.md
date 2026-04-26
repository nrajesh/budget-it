# Vaulted Money — Ledger module (screenshot tests)

These cases follow `/Users/nrajesh/Github/scrnsh/SCREENSHOT_TESTS_AUTHORING_GUIDE.md`: each level-2 heading (`##`) plus a following fenced `yaml` block defines one screenshot. Run with `screenshot-runner`, for example:

`node dist/cli/index.js --input specs/008-multi-ledger-support/tests.md --output ./screenshots --base-url http://localhost:5173`

(Adjust `--base-url` to your dev server.) **`report.json`** is written **incrementally** after each test case, so a partial report exists even if the run stops early.

### Authoring rules (from the guide — do not skip)

1. **Initial wait (non-negotiable)** — The **first `steps` entry in every test case must be `wait: 2000`** (or higher for heavy pages). Omitting it is the most common cause of **blank or spinner** screenshots.
2. **After `click:`** — Use at least **`wait: 500`** when a **dialog/modal** opens, **`wait: 1500`** minimum for **in-app route changes** (e.g. sidebar link); use **`wait: 2000`** when the click triggers a **data fetch** or full reload. When in doubt after navigation, prefer **2000ms** on ledger routes.
3. **One case per meaningful UI state** — Multi-step flows are split into **separate `##` cases** (e.g. dialog closed → dialog open → form filled). Each case **reloads from `url:`** and repeats the prefix steps; do not rely on another case’s prior state.
4. **Theme variants** — The runner does not auto-capture light/dark. Pairs below use **`[aria-label='Toggle theme']`** (Vaulted Money default English string from [`Layout.tsx`](../../src/components/Layout.tsx) / [`LedgerEntryPage`](../../src/pages/LedgerEntryPage.tsx)); add i18n-specific selectors if you run under another locale.
5. **`"Target page has been closed"`** — Per the guide, this indicates the **browser was closed externally** during the run (user interruption), not a screenshot-runner bug. The partial **`report.json`** shows which cases finished.

### Parser / runner quirks (still applies)

1. **`type:` steps** — Use **`type: 'input[name="name"]' "value"`** (single-quoted selector). **`type: "input[name=\"name\"]"`** breaks the parser regex and yields a bad selector.
2. **`navigate:`** — Relative paths need **`--base-url`** and a runner build that resolves them (same as top-level `url:`).
3. **Layout guard** — Without an **active ledger**, [`Layout.tsx`](../../src/components/Layout.tsx) sends users to **`/ledgers`**. Settings cases start from **`/`** and click **`a[href="/settings"]`** so the ledger settings card exists.

### Prerequisites

- **IndexedDB + `localStorage`**: at least one ledger and a normal session, or **`/`** / settings flows redirect to **`/ledgers`**.
- **Viewport**: sidebar **Setup → Ledger** link visible (not mobile-only collapsed) for settings cases.

### Source references

- Ledger picker: [`LedgerEntryPage`](../../src/pages/LedgerEntryPage.tsx) — `/ledgers`, `tour-create-ledger`, `tour-ledger-search`.
- Dialogs: [`ManageLedgerDialog`](../../src/components/dialogs/ManageLedgerDialog.tsx) — fields `name`, `short_name`, etc.
- Settings: [`SettingsPage`](../../src/pages/SettingsPage.tsx) — `tour-settings-ledger`.

### Vitest and screenshot mapping

There is **no 1:1** mapping between Vitest and these cases; see the full explanation in prior revisions. **Pattern:** add **Vitest/RTL** for behavior, then a **`##`** case with **`url:` + `steps:`** for the same visible state.

**Provider-only anchor (no screenshot equivalent):** [`LocalDataProvider.test.ts`](../../src/providers/LocalDataProvider.test.ts) **`clearAllData`** / **`addLedger`** lifecycle is IndexedDB-only — no URL to capture.

---

## Ledger picker — default view

```yaml
url: /ledgers
steps:
  - wait: 2000
```

## Ledger picker — after theme toggle

```yaml
url: /ledgers
steps:
  - wait: 2000
  - click: "[aria-label='Toggle theme']"
  - wait: 400
```

## Ledger picker — create dialog open

```yaml
url: /ledgers
steps:
  - wait: 2000
  - click: ".tour-create-ledger"
  - wait: 500
```

## Ledger picker — create form filled (no submit)

```yaml
url: /ledgers
steps:
  - wait: 2000
  - click: ".tour-create-ledger"
  - wait: 500
  - type: 'input[name="name"]' "Screenshot Ledger"
  - type: 'input[name="short_name"]' "SL"
  - wait: 300
```

## Ledger picker — search with filter text

```yaml
url: /ledgers
steps:
  - wait: 2000
  - type: 'input[placeholder="Search ledgers..."]' "Personal"
  - wait: 300
```

## Dashboard — home with active ledger

```yaml
url: /
steps:
  - wait: 2000
```

## Dashboard — home after theme toggle

```yaml
url: /
steps:
  - wait: 2000
  - click: "[aria-label='Toggle theme']"
  - wait: 400
```

## Navigate to ledger picker from app

```yaml
url: /
steps:
  - wait: 2000
  - navigate: /ledgers
  - wait: 2000
```

## Settings — ledger card in view

```yaml
url: /
steps:
  - wait: 2000
  - click: 'a[href="/settings"]'
  - wait: 2000
  - scroll: ".tour-settings-ledger"
  - wait: 300
```

## Settings — create new ledger dialog open

```yaml
url: /
steps:
  - wait: 2000
  - click: 'a[href="/settings"]'
  - wait: 2000
  - scroll: ".tour-settings-ledger"
  - wait: 300
  - click: ".tour-settings-ledger button:nth-of-type(2)"
  - wait: 500
```

## Settings — edit current ledger dialog open

```yaml
url: /
steps:
  - wait: 2000
  - click: 'a[href="/settings"]'
  - wait: 2000
  - scroll: ".tour-settings-ledger"
  - wait: 300
  - click: ".tour-settings-ledger button:nth-of-type(1)"
  - wait: 500
```
