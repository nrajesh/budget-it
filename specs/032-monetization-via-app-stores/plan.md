# Monetization via App Stores — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Vaulted Money on Apple App Store, Google Play Store, and Lemon Squeezy as a paid "support development" product at €9.99 one-time, with zero license-check code, zero build flags, and zero new env vars. Same MIT-licensed source produces every artifact.

**Architecture:** Donationware via stores. The OSS GitHub repo and existing CI continue unchanged. The only behavioral difference between channels is a single runtime `Capacitor.isNativePlatform()` check that hides the in-app DonationPage on iOS/Android (Apple Review Guideline 3.1.1 compliance). HomePage gains a marketing "Get Vaulted Money" section with four Coming-Soon placeholders that flip to active by editing one config file. An Acknowledgments page is added for MIT attribution.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind, Shadcn, Dexie (existing). Capacitor (existing — provides `isNativePlatform()`). Vitest for tests. No new runtime dependencies introduced.

**Spec:** [specs/032-monetization-via-app-stores/spec.md](./spec.md)

---

## File Structure (locked-in decomposition)

### New files

| Path | Responsibility |
|---|---|
| `scripts/generate-acknowledgments.mjs` | Walks `pnpm-lock.yaml` / `node_modules`, writes a TS module listing dependency name/version/license/licenseText. Runs as part of `pnpm run build`. |
| `src/data/acknowledgments.generated.ts` | Generated output. Frozen array of `{name, version, license, licenseText}`. Committed to repo so devs can run without first regenerating. |
| `src/data/storeChannels.ts` | Single config module with one entry per channel (App Store / Play Store / Lemon Squeezy / Polar.sh). Shape: `{key, label, url, active}`. Editing `active: false → true` and supplying `url` is the only change required to flip a card from Coming-Soon to live. |
| `src/pages/AcknowledgmentsPage.tsx` | Renders the generated dependency list. Title, intro paragraph, then per-dependency cards with name, version, license name, and collapsible license text. |
| `src/components/homepage/HomeStoreLinks.tsx` | Renders the 4 placeholder cards reading from `storeChannels.ts`. Placeholder vs active state visually distinct. |
| `src/tests/generate-acknowledgments.test.ts` | Tests the generator script against a small fixture. |
| `src/tests/HomeStoreLinks.test.tsx` | Tests Coming-Soon state + active-state rendering. |
| `src/tests/AcknowledgmentsPage.test.tsx` | Smoke test that the page renders without throwing and lists at least one dependency. |
| `src/tests/donation-page-hiding.test.tsx` | Tests that on native (mocked `Capacitor.isNativePlatform()` returning true) the DonationPage route is not registered and SettingsPage link is hidden; on non-native it appears. |

### Modified files

| Path | What changes |
|---|---|
| `src/App.tsx` | Add `AcknowledgmentsPage` lazy import + `/acknowledgments` route. Wrap DonationPage route registration in `!Capacitor.isNativePlatform()` (it's already imported via the existing `usesAppShellRouting` check). |
| `src/pages/HomePage.tsx` | Update `trustPillars` strings (line ~46): "Data local" → "Data-local", "Open sourced" → "Open-sourced". Add `<HomeStoreLinks />` section before `<SiteFooter />`. |
| `src/components/SiteFooter.tsx` | Update i18n defaultValues to match: "Data local" → "Data-local", "Open sourced" → "Open-sourced". |
| `src/i18n/resources.ts` | Update English `tagline` and `home.badges.local` / `home.badges.open` strings. Leave Dutch unchanged (per FR-002). |
| `src/pages/SettingsPage.tsx` | Add "Open Source Licenses" entry linking to `/acknowledgments`. Wrap any existing DonationPage link in `!Capacitor.isNativePlatform()`. |
| `src/pages/DonationPage.tsx` | Add three new support-channel cards (App Store / Play Store / Lemon Squeezy) with copy framing them as supporting development. Each card sources its url + active state from `storeChannels.ts`. Inactive cards show "Coming Soon"; active cards are clickable. |
| `README.md` | Update pillars wording. Add a "Support the project" section listing all support channels. |
| `package.json` | Change `build` script: `tsc --noEmit && vite build` → `node scripts/generate-acknowledgments.mjs && tsc --noEmit && vite build`. |

### Explicitly unchanged

`capacitor.config.ts`, `vite.config.ts`, `electron/*`, `.circleci/*`, `LICENSE`, all platform build scripts (`electron:build`, `android:build:apk*`, `ios:build:simulator`, `release:local`). No env vars introduced. No new runtime dependencies.

---

## Phase A — Code changes (TDD-driven)

Each task is small enough to land independently. Commit at the end of each task.

### Task 1: Update English pillar strings

Smallest, safest change. Land first to validate the round-trip works.

**Files:**
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/components/SiteFooter.tsx`
- Modify: `src/i18n/resources.ts`
- Modify: `README.md`
- Modify: `src/constants/tourSteps.ts` (verify whether tour content references old strings — leave unchanged if it doesn't surface the pillars)

- [ ] **Step 1.1: Find every current occurrence of the old strings**

```bash
grep -rn '"Data local"\|"Open sourced"\|"Privacy-first | Data local | Open sourced"' src/ README.md
```

Expected: matches in `src/pages/HomePage.tsx`, `src/components/SiteFooter.tsx`, `src/i18n/resources.ts` (English tagline + badge defaults), and the README pillars list. Document any other matches before proceeding.

- [ ] **Step 1.2: Update HomePage `trustPillars`**

In `src/pages/HomePage.tsx`, find the `trustPillars` array (around line 46–55). Change the `title:` values:

```typescript
const trustPillars = [
  { icon: Shield, title: "Privacy-first", description: /* unchanged */ },
  { icon: HardDrive, title: "Data-local",  description: /* unchanged */ },
  { icon: GitFork, title: "Open-sourced",  description: /* unchanged */ },
];
```

Also update the i18n `defaultValue` strings later in the same file where `t("home.badges.local", { defaultValue: "Data local" })` and `t("home.badges.open", { defaultValue: "Open sourced" })` appear — change to `"Data-local"` and `"Open-sourced"`.

- [ ] **Step 1.3: Update SiteFooter defaultValues**

In `src/components/SiteFooter.tsx`, change the same two `defaultValue` strings to `"Data-local"` and `"Open-sourced"`.

- [ ] **Step 1.4: Update English i18n resources**

In `src/i18n/resources.ts`, update the English section:

```typescript
// English
home: {
  badges: {
    private: "Privacy-first",
    local: "Data-local",       // was "Data local"
    open: "Open-sourced",      // was "Open sourced"
  },
  // ...
},
tagline: "Privacy-first | Data-local | Open-sourced",  // was "Privacy-first | Data local | Open sourced"
```

**Leave the Dutch (`nl`) tagline and Dutch badge strings unchanged** (per FR-002).

- [ ] **Step 1.5: Update README pillars**

In `README.md`, find the pillar description (likely near the top under "What Is Vaulted Money?"). Update to use `Privacy-first. Data-local. Open-sourced.` in the same place the current wording appears.

- [ ] **Step 1.6: Run typecheck + lint**

```bash
pnpm run validate
```

Expected: passes. (`validate` = tsc --noEmit + eslint + prettier).

- [ ] **Step 1.7: Run dev server, verify visually**

```bash
pnpm dev
```

Open `http://localhost:8081` in a non-Electron browser. Verify the three pillars on HomePage now read `Privacy-first` / `Data-local` / `Open-sourced`. Stop dev server with Ctrl+C.

- [ ] **Step 1.8: Commit**

```bash
git add src/pages/HomePage.tsx src/components/SiteFooter.tsx src/i18n/resources.ts README.md
git commit -m "feat: parallel-hyphenate pillars (Privacy-first. Data-local. Open-sourced)"
```

---

### Task 2: Acknowledgments generator script

Write the generator before the page that consumes it. TDD-able.

**Files:**
- Create: `scripts/generate-acknowledgments.mjs`
- Create: `src/data/acknowledgments.generated.ts`
- Create: `src/tests/generate-acknowledgments.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `src/tests/generate-acknowledgments.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SCRIPT = resolve(__dirname, "../../scripts/generate-acknowledgments.mjs");
const OUTPUT = resolve(__dirname, "../data/acknowledgments.generated.ts");

describe("generate-acknowledgments script", () => {
  beforeAll(() => {
    execSync(`node ${SCRIPT}`, { stdio: "inherit" });
  });

  it("writes a TypeScript module at the expected path", () => {
    expect(existsSync(OUTPUT)).toBe(true);
  });

  it("exports an array of Acknowledgment objects", async () => {
    const mod = await import("../data/acknowledgments.generated");
    expect(Array.isArray(mod.acknowledgments)).toBe(true);
    expect(mod.acknowledgments.length).toBeGreaterThan(10); // we have many deps
  });

  it("each entry has name, version, license, licenseText", async () => {
    const { acknowledgments } = await import("../data/acknowledgments.generated");
    for (const entry of acknowledgments) {
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("version");
      expect(entry).toHaveProperty("license");
      expect(entry).toHaveProperty("licenseText");
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });

  it("entries are sorted alphabetically by name", async () => {
    const { acknowledgments } = await import("../data/acknowledgments.generated");
    const names = acknowledgments.map((a) => a.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
});
```

- [ ] **Step 2.2: Run test to confirm it fails**

```bash
pnpm test -- src/tests/generate-acknowledgments.test.ts
```

Expected: FAILS — script does not exist.

- [ ] **Step 2.3: Implement the generator script**

Create `scripts/generate-acknowledgments.mjs`:

```javascript
#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const NODE_MODULES = resolve(REPO_ROOT, "node_modules");
const OUTPUT = resolve(REPO_ROOT, "src/data/acknowledgments.generated.ts");

function readPackageJson(pkgDir) {
  const p = join(pkgDir, "package.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function findLicenseFile(pkgDir) {
  if (!existsSync(pkgDir)) return null;
  const candidates = readdirSync(pkgDir).filter((f) =>
    /^(LICENSE|LICENCE|COPYING)(\..*)?$/i.test(f)
  );
  if (candidates.length === 0) return null;
  return readFileSync(join(pkgDir, candidates[0]), "utf8");
}

function walkScopedAndPlain(modulesDir) {
  const results = [];
  if (!existsSync(modulesDir)) return results;
  for (const entry of readdirSync(modulesDir)) {
    if (entry.startsWith(".")) continue;
    const full = join(modulesDir, entry);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (!s.isDirectory()) continue;
    if (entry.startsWith("@")) {
      // scoped: walk one more level
      for (const sub of readdirSync(full)) {
        if (sub.startsWith(".")) continue;
        results.push(join(full, sub));
      }
    } else {
      results.push(full);
    }
  }
  return results;
}

function collect() {
  const seen = new Map();
  for (const pkgDir of walkScopedAndPlain(NODE_MODULES)) {
    const pkg = readPackageJson(pkgDir);
    if (!pkg || !pkg.name) continue;
    if (pkg.private) continue;
    const key = pkg.name;
    if (seen.has(key)) continue;
    const licenseField = pkg.license
      || (Array.isArray(pkg.licenses) && pkg.licenses.map((l) => l.type || l).join(", "))
      || "UNLICENSED";
    const licenseText = findLicenseFile(pkgDir) || "";
    seen.set(key, {
      name: pkg.name,
      version: pkg.version || "0.0.0",
      license: typeof licenseField === "string" ? licenseField : JSON.stringify(licenseField),
      licenseText,
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const entries = collect();
const header = `// AUTO-GENERATED by scripts/generate-acknowledgments.mjs
// Do not edit by hand. Regenerate with: node scripts/generate-acknowledgments.mjs
//
// This file is committed to source so developers can run the app without
// first running the generator. It is regenerated as part of \`pnpm run build\`.

export interface Acknowledgment {
  name: string;
  version: string;
  license: string;
  licenseText: string;
}

export const acknowledgments: Acknowledgment[] = ${JSON.stringify(entries, null, 2)};
`;
writeFileSync(OUTPUT, header);
console.log(`generate-acknowledgments: wrote ${entries.length} entries to ${OUTPUT}`);
```

- [ ] **Step 2.4: Run the script manually first**

```bash
node scripts/generate-acknowledgments.mjs
```

Expected: prints `generate-acknowledgments: wrote N entries to .../acknowledgments.generated.ts` for some N > 100.

- [ ] **Step 2.5: Inspect the generated file**

```bash
head -30 src/data/acknowledgments.generated.ts
```

Expected: header comment, `Acknowledgment` interface, then `acknowledgments` array starting with the first entry alphabetically.

- [ ] **Step 2.6: Run the test**

```bash
pnpm test -- src/tests/generate-acknowledgments.test.ts
```

Expected: PASS, all four assertions green.

- [ ] **Step 2.7: Commit**

```bash
git add scripts/generate-acknowledgments.mjs src/data/acknowledgments.generated.ts src/tests/generate-acknowledgments.test.ts
git commit -m "feat(build): add Acknowledgments generator + committed output"
```

---

### Task 3: Acknowledgments page

**Files:**
- Create: `src/pages/AcknowledgmentsPage.tsx`
- Create: `src/tests/AcknowledgmentsPage.test.tsx`
- Modify: `src/App.tsx` (route)
- Modify: `src/pages/SettingsPage.tsx` (link)

- [ ] **Step 3.1: Write the failing smoke test**

Create `src/tests/AcknowledgmentsPage.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AcknowledgmentsPage from "@/pages/AcknowledgmentsPage";

describe("AcknowledgmentsPage", () => {
  it("renders without throwing", () => {
    render(<MemoryRouter><AcknowledgmentsPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /open source licenses|acknowledgments/i })).toBeInTheDocument();
  });

  it("lists at least one dependency", () => {
    render(<MemoryRouter><AcknowledgmentsPage /></MemoryRouter>);
    // We expect react itself to be in the list
    expect(screen.getAllByText(/react/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3.2: Run the test, expect failure**

```bash
pnpm test -- src/tests/AcknowledgmentsPage.test.tsx
```

Expected: FAILS — module not found.

- [ ] **Step 3.3: Implement the page**

Create `src/pages/AcknowledgmentsPage.tsx`:

```tsx
import { useState } from "react";
import { acknowledgments } from "@/data/acknowledgments.generated";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { Button } from "@/components/ui/button";

export default function AcknowledgmentsPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="app-page-header">
        <h1 className="app-gradient-title app-page-title">Open Source Licenses</h1>
        <p className="app-page-subtitle">
          Vaulted Money is built on the work of many open-source projects.
          The libraries below are bundled in this app under their respective licenses.
        </p>
      </div>

      <div className="grid gap-4">
        {acknowledgments.map((ack) => {
          const isOpen = expanded.has(ack.name);
          return (
            <ThemedCard key={ack.name}>
              <ThemedCardHeader>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <ThemedCardTitle className="text-base font-mono">
                    {ack.name}
                    <span className="ml-2 text-xs text-muted-foreground">v{ack.version}</span>
                  </ThemedCardTitle>
                  <span className="text-sm text-muted-foreground">{ack.license}</span>
                </div>
              </ThemedCardHeader>
              {ack.licenseText && (
                <ThemedCardContent>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={() => toggle(ack.name)}
                  >
                    {isOpen ? "Hide license text" : "Show license text"}
                  </Button>
                  {isOpen && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground max-h-96 overflow-y-auto">
                      {ack.licenseText}
                    </pre>
                  )}
                </ThemedCardContent>
              )}
            </ThemedCard>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3.4: Register the route**

In `src/App.tsx`, add to the lazy imports (near line 27):

```typescript
const AcknowledgmentsPage = lazy(() => import("@/pages/AcknowledgmentsPage"));
```

Then add a `<Route>` inside the `<Layout />` group (anywhere alongside the other content routes, e.g., after the `/privacy` route or near the `/backup` route):

```tsx
<Route path="/acknowledgments" element={<AcknowledgmentsPage />} />
```

- [ ] **Step 3.5: Add link in SettingsPage**

In `src/pages/SettingsPage.tsx`, add an entry in the appropriate "About" or footer section linking to `/acknowledgments` with label "Open Source Licenses". Follow the existing link-row pattern used by other Settings entries.

- [ ] **Step 3.6: Run the test**

```bash
pnpm test -- src/tests/AcknowledgmentsPage.test.tsx
```

Expected: PASS.

- [ ] **Step 3.7: Run the dev server and click through manually**

```bash
pnpm dev
```

Visit Settings → Open Source Licenses. Verify list renders, expanding "Show license text" reveals the LICENSE content for that package, collapse hides it again. Spot-check that React, Tailwind, and Dexie appear with sensible license labels.

- [ ] **Step 3.8: Run validate**

```bash
pnpm run validate
```

Expected: passes.

- [ ] **Step 3.9: Commit**

```bash
git add src/pages/AcknowledgmentsPage.tsx src/App.tsx src/pages/SettingsPage.tsx src/tests/AcknowledgmentsPage.test.tsx
git commit -m "feat(acknowledgments): add Open Source Licenses page + Settings link"
```

---

### Task 4: Wire generator into the build

**Files:**
- Modify: `package.json`

- [ ] **Step 4.1: Update the `build` script**

In `package.json`, change:

```json
"build": "tsc --noEmit && vite build",
```

to:

```json
"build": "node scripts/generate-acknowledgments.mjs && tsc --noEmit && vite build",
```

(Do not change `build:dev`, `electron:build`, `mobile:refresh`, etc. — `build` is the single chokepoint that all production builds funnel through.)

- [ ] **Step 4.2: Verify build runs and regenerates the file**

```bash
rm src/data/acknowledgments.generated.ts
pnpm run build
ls -la src/data/acknowledgments.generated.ts
```

Expected: file is regenerated; `pnpm run build` completes successfully.

- [ ] **Step 4.3: Commit**

```bash
git add package.json src/data/acknowledgments.generated.ts
git commit -m "build: regenerate Acknowledgments on every production build"
```

---

### Task 5: Native-platform DonationPage hiding (FR-021)

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Create: `src/tests/donation-page-hiding.test.tsx`

- [ ] **Step 5.1: Find current DonationPage references**

```bash
grep -rn "DonationPage\|/donation\|/donate" src/ | grep -v ".test." | grep -v "DonationPage.tsx"
```

Document the existing route registration and any link entries (Settings, sidebar, etc.).

- [ ] **Step 5.2: Write the failing test**

Create `src/tests/donation-page-hiding.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Capacitor } from "@capacitor/core";

vi.mock("@capacitor/core", async () => {
  const actual = await vi.importActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: vi.fn() },
  };
});

describe("DonationPage hiding on native platforms (FR-021)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("hides the DonationPage route when Capacitor.isNativePlatform() is true", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(true);
    // Verify by importing the route configuration helper or rendering App
    // (exact mechanism depends on how routes are exposed in src/App.tsx)
    // The test should assert that a navigation to /donation results in NotFound,
    // or that the Settings page does not render the donation link.

    // Example assertion shape — implementer adapts to the actual conditional structure:
    const { render, screen } = await import("@testing-library/react");
    const { MemoryRouter } = await import("react-router-dom");
    const SettingsPage = (await import("@/pages/SettingsPage")).default;
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: /donate|donation|support/i })).toBeNull();
  });

  it("shows the DonationPage route when not native", async () => {
    (Capacitor.isNativePlatform as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const { render, screen } = await import("@testing-library/react");
    const { MemoryRouter } = await import("react-router-dom");
    const SettingsPage = (await import("@/pages/SettingsPage")).default;
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    // Implementer: assert positive presence of the Settings → Donation link
    // (label text depends on existing SettingsPage copy)
    expect(screen.getByRole("link", { name: /donate|donation|support/i })).toBeInTheDocument();
  });
});
```

**Note for implementer:** if SettingsPage doesn't currently have a "Support / Donate" link, this test should mock or fixture the relevant link container. Adjust the test to match the actual rendering tree.

- [ ] **Step 5.3: Run the test, expect failure**

```bash
pnpm test -- src/tests/donation-page-hiding.test.tsx
```

Expected: at least one assertion fails (no conditional logic exists yet).

- [ ] **Step 5.4: Add the conditional route registration**

In `src/App.tsx`, find the existing route for the DonationPage. Wrap it (or its registration block) so that the route is only registered when `!Capacitor.isNativePlatform()`. Example pattern:

```tsx
{!Capacitor.isNativePlatform() && (
  <Route path="/donation" element={<DonationPage />} />
)}
```

Capacitor is already imported in `src/App.tsx` (line ~61 for the `usesAppShellRouting` check). Reuse the existing import.

- [ ] **Step 5.5: Add the conditional Settings link**

In `src/pages/SettingsPage.tsx`, find the existing entry that links to the DonationPage (or add one if it doesn't exist as part of FR-008 below — see Task 6). Wrap the link's render in `!Capacitor.isNativePlatform() && (...)`.

If the existing SettingsPage has no DonationPage link yet, defer this part of Step 5.5 to Task 6 where the DonationPage's discoverability is added.

- [ ] **Step 5.6: Run the test, expect pass**

```bash
pnpm test -- src/tests/donation-page-hiding.test.tsx
```

Expected: PASS.

- [ ] **Step 5.7: Verify in dev (web context)**

```bash
pnpm dev
```

Verify the DonationPage is reachable via its existing route and any nav entries. Stop the server.

- [ ] **Step 5.8: Verify the negative case (mocked native)**

Run the test suite to ensure the `isNativePlatform = true` path is exercised. (Full native build verification is part of Phase B operational tasks.)

- [ ] **Step 5.9: Commit**

```bash
git add src/App.tsx src/pages/SettingsPage.tsx src/tests/donation-page-hiding.test.tsx
git commit -m "feat: hide DonationPage on native platforms via Capacitor runtime check (FR-021)"
```

---

### Task 6: storeChannels.ts config + DonationPage copy update

**Files:**
- Create: `src/data/storeChannels.ts`
- Modify: `src/pages/DonationPage.tsx`

- [ ] **Step 6.1: Create the config module**

Create `src/data/storeChannels.ts`:

```typescript
export type StoreChannelKey = "appStore" | "playStore" | "lemonSqueezy" | "polarSh";

export interface StoreChannel {
  key: StoreChannelKey;
  label: string;
  url: string | null;     // null while in Coming-Soon state
  active: boolean;        // true once the listing is live
}

export const storeChannels: readonly StoreChannel[] = [
  { key: "appStore",     label: "Apple App Store",   url: null, active: false },
  { key: "playStore",    label: "Google Play Store", url: null, active: false },
  { key: "lemonSqueezy", label: "Lemon Squeezy",     url: null, active: false },
  { key: "polarSh",      label: "Polar.sh",          url: null, active: false },
] as const;

export function getStoreChannel(key: StoreChannelKey): StoreChannel {
  const found = storeChannels.find((c) => c.key === key);
  if (!found) throw new Error(`Unknown store channel: ${key}`);
  return found;
}
```

- [ ] **Step 6.2: Update DonationPage with three new cards**

In `src/pages/DonationPage.tsx`, after the existing GitHub Sponsors / PayPal / Bank cards, add three more cards for App Store, Play Store, and Lemon Squeezy (read from `storeChannels`). Each card:

- Shows the store label
- Shows a "Coming Soon" pill when `!channel.active`
- Becomes a styled clickable link to `channel.url` when `channel.active && channel.url` (using the same ExternalLink pattern as existing cards)
- Includes copy like: "Buying through {store} is the easiest way to support development. The same app is free on GitHub for those who want to build it themselves."

Don't add a 4th card for Polar.sh in DonationPage (Polar.sh appears on the HomePage placeholders but is not duplicated as a support card here — keep DonationPage focused on the main paid channels + existing direct support options).

Update the page subtitle copy to mention the new store paths.

- [ ] **Step 6.3: Run validate**

```bash
pnpm run validate
```

Expected: passes.

- [ ] **Step 6.4: Visually verify in dev**

```bash
pnpm dev
```

Open the DonationPage. The three new cards appear in Coming-Soon state. Stop the server.

- [ ] **Step 6.5: Commit**

```bash
git add src/data/storeChannels.ts src/pages/DonationPage.tsx
git commit -m "feat(donation): add App Store, Play Store, Lemon Squeezy cards (Coming Soon)"
```

---

### Task 7: HomePage "Get Vaulted Money" placeholder section

**Files:**
- Create: `src/components/homepage/HomeStoreLinks.tsx`
- Create: `src/tests/HomeStoreLinks.test.tsx`
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 7.1: Write the failing test**

Create `src/tests/HomeStoreLinks.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeStoreLinks from "@/components/homepage/HomeStoreLinks";

describe("HomeStoreLinks", () => {
  it("renders four placeholder cards by default", () => {
    render(<HomeStoreLinks />);
    expect(screen.getByText(/apple app store/i)).toBeInTheDocument();
    expect(screen.getByText(/google play store/i)).toBeInTheDocument();
    expect(screen.getByText(/lemon squeezy/i)).toBeInTheDocument();
    expect(screen.getByText(/polar\.sh/i)).toBeInTheDocument();
  });

  it("shows Coming Soon indicator on inactive cards", () => {
    render(<HomeStoreLinks />);
    expect(screen.getAllByText(/coming soon/i).length).toBe(4);
  });

  it("placeholder cards are not clickable links", () => {
    render(<HomeStoreLinks />);
    // None of the inactive cards should be anchor tags
    expect(screen.queryAllByRole("link", { name: /apple app store|google play store|lemon squeezy|polar\.sh/i }).length).toBe(0);
  });

  it("renders an active card as a clickable link", async () => {
    vi.doMock("@/data/storeChannels", () => ({
      storeChannels: [
        { key: "appStore", label: "Apple App Store", url: "https://apps.apple.com/app/id12345", active: true },
        { key: "playStore", label: "Google Play Store", url: null, active: false },
        { key: "lemonSqueezy", label: "Lemon Squeezy", url: null, active: false },
        { key: "polarSh", label: "Polar.sh", url: null, active: false },
      ],
    }));
    vi.resetModules();
    const Mocked = (await import("@/components/homepage/HomeStoreLinks")).default;
    render(<Mocked />);
    const link = screen.getByRole("link", { name: /apple app store/i });
    expect(link).toHaveAttribute("href", "https://apps.apple.com/app/id12345");
    // Coming Soon should no longer appear on the active card
    expect(screen.getAllByText(/coming soon/i).length).toBe(3);
    vi.doUnmock("@/data/storeChannels");
  });
});
```

- [ ] **Step 7.2: Run the test, expect failure**

```bash
pnpm test -- src/tests/HomeStoreLinks.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 7.3: Implement HomeStoreLinks**

Create `src/components/homepage/HomeStoreLinks.tsx`:

```tsx
import { storeChannels } from "@/data/storeChannels";
import {
  ThemedCard,
  ThemedCardContent,
  ThemedCardHeader,
  ThemedCardTitle,
} from "@/components/ThemedCard";
import { cn } from "@/lib/utils";

export default function HomeStoreLinks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h2 className="app-gradient-title text-2xl font-semibold mb-2">Get Vaulted Money</h2>
      <p className="text-muted-foreground mb-6">
        Coming soon to your favorite store. The same app is free on{" "}
        <a href="https://github.com/nrajesh/vaulted.money" className="underline">
          GitHub
        </a>
        . Buying through a store supports continued development.
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {storeChannels.map((channel) => {
          const isActive = channel.active && channel.url;
          const cardClass = cn(
            "transition",
            isActive ? "hover:shadow-md" : "opacity-60"
          );
          const Inner = (
            <ThemedCard className={cardClass}>
              <ThemedCardHeader>
                <ThemedCardTitle className="text-sm font-medium">
                  {channel.label}
                </ThemedCardTitle>
              </ThemedCardHeader>
              <ThemedCardContent>
                {isActive ? (
                  <span className="text-xs text-primary">Open store →</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                )}
              </ThemedCardContent>
            </ThemedCard>
          );
          if (isActive) {
            return (
              <a
                key={channel.key}
                href={channel.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {Inner}
              </a>
            );
          }
          return <div key={channel.key}>{Inner}</div>;
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 7.4: Run the test, expect pass**

```bash
pnpm test -- src/tests/HomeStoreLinks.test.tsx
```

Expected: PASS (all four cases).

- [ ] **Step 7.5: Integrate into HomePage**

In `src/pages/HomePage.tsx`, import `HomeStoreLinks` near the other component imports, then render `<HomeStoreLinks />` as the last in-page section before `<SiteFooter />`.

- [ ] **Step 7.6: Visually verify**

```bash
pnpm dev
```

Visit `http://localhost:8081/`. Scroll to the bottom. See the "Get Vaulted Money" section with four greyed-out Coming-Soon cards. Stop the server.

- [ ] **Step 7.7: Verify Electron / native skip the section**

```bash
pnpm run electron:dev
```

Open the Electron app. Confirm you land directly at `/ledgers` (HomePage is never shown, so the new section is also never shown). Close.

- [ ] **Step 7.8: Run validate**

```bash
pnpm run validate
```

Expected: passes.

- [ ] **Step 7.9: Commit**

```bash
git add src/components/homepage/HomeStoreLinks.tsx src/pages/HomePage.tsx src/tests/HomeStoreLinks.test.tsx
git commit -m "feat(homepage): add 'Get Vaulted Money' placeholder cards section"
```

---

### Task 8: README "Support the project" section

**Files:**
- Modify: `README.md`

- [ ] **Step 8.1: Add the section**

Add a new section to `README.md` (typically near the bottom, after "Read Next"):

```markdown
## Support the Project

Vaulted Money is free and open-source under the MIT license. If you find it useful and want to support development, you have several options:

| Channel | Status |
|---|---|
| Buy on Apple App Store (€9.99 one-time) | Coming soon |
| Buy on Google Play Store (€9.99 one-time) | Coming soon |
| Buy desktop binary on Lemon Squeezy (€9.99 one-time) | Coming soon |
| Buy desktop binary on Polar.sh (€9.99 one-time) | Coming soon |
| [GitHub Sponsors](https://github.com/sponsors/nrajesh) | Active |
| PayPal / direct transfer (see in-app Donation page) | Active |

The same app is free to build from source, regardless of which channel you choose. Store purchases exist to make installation simpler for non-technical users and to support continued development.
```

Adjust the active/coming-soon rows and links to match the current state at the time of commit.

- [ ] **Step 8.2: Commit**

```bash
git add README.md
git commit -m "docs(readme): add 'Support the project' section"
```

---

### Task 9: Phase A wrap-up — full validation

- [ ] **Step 9.1: Run the full test suite**

```bash
pnpm test
```

Expected: all tests pass, including the new generator test, AcknowledgmentsPage test, donation hiding test, HomeStoreLinks test.

- [ ] **Step 9.2: Run validate**

```bash
pnpm run validate
```

Expected: typecheck + lint + prettier all pass.

- [ ] **Step 9.3: Run a clean production build**

```bash
pnpm run build
```

Expected: completes successfully; `src/data/acknowledgments.generated.ts` regenerated; `dist/` produced.

- [ ] **Step 9.4: Smoke-test the production build**

```bash
pnpm run preview
```

Open the served URL. Verify HomePage renders with new pillars and new "Get Vaulted Money" section; Settings → Open Source Licenses works; Donation page works in this web context.

- [ ] **Step 9.5: Manual checklist against the spec's success criteria**

Verify on a checklist (mark each yes/no):
- SC-006 — Settings has working link to Acknowledgments
- SC-007 — DonationPage lists App Store / Play Store / Lemon Squeezy as Coming-Soon channels
- SC-008 — Pillars wording updated in HomePage, SiteFooter, README, English i18n; Dutch unchanged
- SC-009 — No new runtime license-check / activation / entitlement code was introduced (eyeball the diff for Phase A)
- SC-010 — No new env vars, build flags, or runtime config introduced
- SC-011 — Run a simulator/device check on iOS or Android (deferred to Phase B if device-build is not yet set up; otherwise verify DonationPage is unreachable)
- SC-012 — HomePage shows exactly four Coming-Soon placeholder cards
- SC-013 — Editing a single `storeChannels.ts` entry to `{active: true, url: "..."}` flips that card

All Phase A code changes are now complete. Move on to Phase B for the operational store-launch work.

---

## Phase B — Operational store setup (sequential ops checklist)

These tasks do not produce code changes; they are real-world setup steps. They are listed so the implementation worker (likely you, the maintainer) has a single source of truth for what's left to ship. Each item is independent and can be tackled in any order, except where noted.

### Task 10: Apple Developer Program enrollment

- [ ] **Step 10.1:** Enroll at https://developer.apple.com/programs/ ($99 USD/year).
- [ ] **Step 10.2:** Once enrolled, create an App ID for `com.vaultedmoney.app` in the Developer Portal.
- [ ] **Step 10.3:** Generate an iOS Distribution certificate and a corresponding Provisioning Profile for App Store distribution.
- [ ] **Step 10.4:** Document the local paths / keychain entries for the cert + profile in `documentation/SETUP.md` (private to your machine; do not commit secrets).

### Task 11: Google Play Console enrollment

- [ ] **Step 11.1:** Enroll at https://play.google.com/console/ ($25 USD one-time).
- [ ] **Step 11.2:** Create a new app entry with package name `com.vaultedmoney.app`. (Once submitted, the package name cannot be changed.)
- [ ] **Step 11.3:** Generate an upload keystore (`vaulted-upload-keystore.jks`). Document the keystore password and key alias in a local password manager. Do not commit the keystore.
- [ ] **Step 11.4:** Configure `android/app/build.gradle` (or signing config equivalent) to use the upload keystore for release builds. Reference the keystore via an env var or a `~/.gradle/gradle.properties` entry — do not hard-code.

### Task 12: Lemon Squeezy (or Polar.sh) account + product

- [ ] **Step 12.1:** Sign up at https://lemonsqueezy.com/ (or https://polar.sh — pick one for v1; the spec allows either).
- [ ] **Step 12.2:** Create a "Digital Download" product titled "Vaulted Money Desktop" priced at €9.99.
- [ ] **Step 12.3:** Configure automatic download delivery: after purchase, the customer receives an email with a per-customer download URL.
- [ ] **Step 12.4:** Add product description text matching the App Store / Play Store description (privacy-first, MIT, link to GitHub, supports development).
- [ ] **Step 12.5:** Note the listing's public URL for use in `storeChannels.ts`.

### Task 13: Prepare store assets

- [ ] **Step 13.1:** App icon: confirm existing icons (`assets/`, `public/`) are correct sizes for App Store (1024×1024 PNG) and Play Store (512×512 PNG). Re-export from source if needed.
- [ ] **Step 13.2:** Screenshots — capture per device class:
  - iOS: 6.7" (iPhone 14/15 Pro Max), 5.5" (older), and 12.9" iPad Pro.
  - Android: phone (1080×1920+) and tablet (1200×1920+).
  - At least 3 screenshots per device class showing the ledger, transactions, budgets, and reports.
- [ ] **Step 13.3:** Short description (≤80 chars): e.g., "Private, local-first money tracker. Open source. Your data stays yours."
- [ ] **Step 13.4:** Long description (≤4000 chars): privacy story, what it can do, mention MIT + GitHub URL, list features.
- [ ] **Step 13.5:** Keywords (App Store only, ≤100 chars): "budget, finance, expense tracker, ledger, privacy, local, offline".
- [ ] **Step 13.6:** Privacy policy URL: link to the existing `PrivacyPolicyPage` deployed at https://vaulted.money/privacy (verify this is publicly reachable).

### Task 14: iOS App Store submission

- [ ] **Step 14.1:** From an Apple Silicon Mac, run `pnpm run mobile:sync` and open `ios/App/App.xcworkspace` in Xcode.
- [ ] **Step 14.2:** Update `ios/App/App/Info.plist` version + build number (bump `CFBundleShortVersionString` from `0.0.0` to a real version, e.g., `1.0.0`).
- [ ] **Step 14.3:** Set the signing team to your Apple Developer account; select the provisioning profile from Task 10.3.
- [ ] **Step 14.4:** Archive (Product → Archive). Validate. Upload to App Store Connect.
- [ ] **Step 14.5:** In App Store Connect, fill in the listing fields with the assets from Task 13. Set price to Tier €9.99 (Apple's pricing matrix tab).
- [ ] **Step 14.6:** Submit for review. Typical turnaround: 1–3 days.

### Task 15: Google Play Store submission

- [ ] **Step 15.1:** Run `pnpm run android:build:apk:release` (or build the AAB equivalent — Play Store prefers AAB).
- [ ] **Step 15.2:** Upload the signed AAB to Play Console under a new internal-testing track first.
- [ ] **Step 15.3:** Fill in the Play Console listing with the assets from Task 13.
- [ ] **Step 15.4:** Set the price to €9.99.
- [ ] **Step 15.5:** Promote from internal-testing → closed-testing → production gradually, or submit directly to production. Verify content rating questionnaire is completed.

### Task 16: Lemon Squeezy listing activation

- [ ] **Step 16.1:** Run `pnpm run electron:build`. Note the produced `.dmg` / `.exe` / `.AppImage` paths.
- [ ] **Step 16.2:** Upload each binary to the Lemon Squeezy product as a downloadable file (separate files per OS; Lemon Squeezy supports multi-file delivery).
- [ ] **Step 16.3:** Publish the product. Verify the listing is reachable.

### Task 17: Flip storeChannels.ts entries as listings go live

- [ ] **Step 17.1:** For each store that goes live, edit `src/data/storeChannels.ts`:

```typescript
{ key: "appStore", label: "Apple App Store", url: "https://apps.apple.com/app/...", active: true },
```

- [ ] **Step 17.2:** Commit with a message like `feat(stores): activate Apple App Store link`.
- [ ] **Step 17.3:** Repeat per store. Each activation is one commit so the HomePage and DonationPage update via the same single source of truth.

---

## Verification Plan

### Automated

| Check | Command | Expected |
|---|---|---|
| Type check | `pnpm run tsc --noEmit` | passes |
| Lint | `pnpm run lint` | 0 errors, 0 warnings (`--max-warnings 0`) |
| Format | `pnpm run format:check` | passes |
| Unit tests | `pnpm test` | all green, including 4 new test files from Phase A |
| Production build | `pnpm run build` | produces `dist/`, regenerates acknowledgments |

### Manual

| Check | How |
|---|---|
| Pillar wording everywhere | Visit homepage in web browser; inspect footer; read README; re-run the grep from Step 1.1 — should find zero remaining `"Data local"` / `"Open sourced"` occurrences (except in non-English locales) |
| Acknowledgments page | Settings → Open Source Licenses → expand a couple of entries; verify license text appears |
| DonationPage on web | All 5+ cards visible (GitHub Sponsors, PayPal, Bank, App Store CS, Play Store CS, Lemon Squeezy CS) |
| DonationPage hidden on native | Build for iOS simulator; verify deep-linking to `/donation` falls through to 404 / Ledger; verify no Settings link to it |
| HomePage placeholders web-only | Visit `localhost:8081/` in browser — section visible; run `pnpm run electron:dev` — section never appears because routing redirects to `/ledgers` |
| Flip a card to active | Edit one `storeChannels.ts` entry locally, dev-server reload, verify card becomes a styled clickable link |
| Build artifacts | `pnpm run electron:build` produces a signed/unsigned `.dmg` identical (modulo signing) to what would be uploaded to Lemon Squeezy |

### Spec Success Criteria Mapping

| SC | Verified by |
|---|---|
| SC-001 | Task 14 (after App Store review approval) |
| SC-002 | Task 15 (after Play Store approval) |
| SC-003 | Task 16 |
| SC-004 | Manual: build from clean checkout, compare hash to Lemon Squeezy artifact |
| SC-005 | Manual: build APK from clean checkout, sideload, compare to Play Store version |
| SC-006 | Phase A Task 3 + Step 9.5 |
| SC-007 | Phase A Task 6 + Step 9.5 |
| SC-008 | Phase A Task 1 + Step 9.5 |
| SC-009 | Diff inspection on Phase A; the grep advisory from spec SC-009 is intentionally not mechanical |
| SC-010 | Phase A wrap-up; no new env vars introduced |
| SC-011 | Phase A Task 5 test + iOS simulator manual check |
| SC-012 | Phase A Task 7 + Step 9.5 |
| SC-013 | Phase A Task 7 (last test case) + Task 17 (real activation) |

---

## Open Decisions to Resolve During Execution

- **OD-001 (storefront):** Default to Lemon Squeezy for v1 unless executor has a strong preference for Polar.sh. Both fit. Decision can be made during Task 12 without affecting the rest of the plan.
- **OD-002 / OD-003 (macOS App Store, Microsoft Store):** Not in scope for this plan. Punt to a follow-up spec if/when there's demand.
- **OD-004 (marketing landing page):** Out of scope. The current homepage at vaulted.money + GitHub README is sufficient for v1.
- **OD-005:** Resolved in spec.

---

## Skills to Reference During Execution

- `superpowers:subagent-driven-development` — for executing tasks one-per-subagent with checkpoints
- `superpowers:executing-plans` — alternative for inline execution
- `superpowers:test-driven-development` — applied to Tasks 2, 3, 5, 7 in Phase A
- `superpowers:verification-before-completion` — apply at the end of every task before marking complete
- `superpowers:finishing-a-development-branch` — once Phase A is fully merged, decide how to integrate before Phase B
