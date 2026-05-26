# Feature Specification: Monetization via App Stores (Donationware)

**Feature Branch**: `032-monetization-via-app-stores`
**Status**: Draft
**Input**: User wants a sustainable side-income monetization path for Vaulted Money that preserves the existing Privacy-first / Data-local / Open-sourced ethos. The app is MIT-licensed and public on GitHub. The user evaluated three initial options (menu-gating, entity caps, session timeouts) and a deeper analysis converged on a fourth: ship the same MIT-licensed binary on App Store, Play Store, and a desktop storefront as a paid product, framed as supporting development. No license keys, no license server, no code obfuscation, no runtime configuration. The OSS GitHub repo and its free release artifacts remain unchanged.

## Problem Statement

Vaulted Money is currently offered as a fully free, MIT-licensed, locally-stored personal finance app distributed via GitHub releases (Electron desktop) and source builds (iOS/Android via Capacitor). There is no monetization path. The maintainer would like a sustainable side-income revenue stream that:

1. Preserves Privacy-first / Data-local / Open-sourced positioning (no data leaves the user's device unless they configure their own cloud backup folder).
2. Requires no runtime configuration, environment variables, or API keys at install time.
3. Requires no license server, license keys, or backend infrastructure operated by the maintainer.
4. Cannot be trivially bypassed (including by AI-assisted code modification) for any meaningful subset of paying users.
5. Does not require relicensing or restricting the existing public repository.
6. Is low-maintenance and does not introduce significant new engineering surface area.

Constraints (4) and (5) together rule out any client-side license check on a desktop binary derived from public MIT source: such a check can always be stripped from a fork or local build. They also rule out source-available licenses such as BUSL or Elastic License 2.0, because the resulting source is still distributed and modifiable.

## Strategic Position: Donationware via Stores

The chosen approach exploits *distribution channels* rather than *code restrictions* as the entitlement mechanism:

- The **public GitHub repository** continues to host the full MIT-licensed source. Anyone may clone, build, and run any platform target locally. All current build scripts (`pnpm run electron:build`, `pnpm run android:build:apk`, `pnpm run ios:build:simulator`, the CircleCI release pipeline) remain unchanged. Free `.dmg` / `.exe` / `.AppImage` / `.apk` artifacts continue to be published to GitHub Releases.
- **App Store (iOS, optionally macOS)** and **Google Play Store** receive the *same* binary, listed as a **paid app at €9.99 one-time** (Pattern B: paid up-front, no in-app purchase, no subscription, no trial logic in code). Apple/Google handle payment, refunds, tax compliance, and cryptographically validate receipts at the OS level on non-jailbroken devices. App Store's standard 14-day refund window covers buyer's remorse without custom code.
- **Lemon Squeezy** (or Polar.sh as alternative) hosts the *same* Electron binary as a paid digital download for desktop users who prefer not to build from source. Merchant-of-record storefronts handle global VAT/sales tax. Per-customer download URLs provide soft fingerprinting without baking identifying data into the binary.
- **GitHub Sponsors / Ko-fi** and the existing `DonationPage.tsx` remain as direct-donation channels.

The store listings explicitly state that the same code is freely available at the public GitHub repository and that the purchase supports continued development. This is honest, MIT-compliant, and aligned with how Joplin, Standard Notes, Aegis, Bitwarden, and Signal handle the same situation.

There is **no feature difference** between the GitHub free build and the paid store builds. The entitlement is the binary itself, not a feature flag. This eliminates every class of bypass attack against client-side checks.

## Goals

- Establish App Store and Google Play Store listings for Vaulted Money as paid apps at €9.99 (localized by stores).
- Establish a Lemon Squeezy (or Polar.sh) storefront for the desktop Electron binary at the equivalent price.
- Update in-product messaging to surface the store purchase as a way to support development.
- Add an in-app Acknowledgments page to satisfy MIT attribution requirements of bundled OSS dependencies, as required by store distribution policies.
- Update the project's public-facing pillars wording to a fully parallel-hyphenated form across HomePage, SiteFooter, README, and translations.
- Preserve all existing free distribution channels (source builds, GitHub Releases, donation page).
- Preserve the option to evolve toward a true open-core model later (Reports Pro, encrypted cloud backup, local-LLM features) without rework.

## Non-Goals

- **No license keys, license files, or license server.** No code is added to check entitlement at runtime.
- **No code obfuscation, anti-debug, or hardware fingerprinting.**
- **No feature gating between free and paid builds** in this iteration. Source-built, GitHub-released, App Store, Play Store, and Lemon Squeezy binaries are functionally identical.
- **No entity caps** (transactions, accounts, ledgers, categories, vendors).
- **No session timeouts or nag dialogs.**
- **No relicensing.** The project stays MIT.
- **No cloud backup feature, advanced reporting module, or local-LLM categorization** in this spec. These are explicitly deferred and left as options for a future open-core split.
- **No CSV/PDF export gating.** Any improvements to exports remain in the public repo under MIT.
- **No subscription pricing model.** Paid up-front, one-time, no recurring billing.
- **No App Store free-trial logic.** Apple's standard refund window suffices.
- **No private repository or build-time alias system** in this iteration. Single repo, single binary.
- **No automated store submission pipeline.** Manual submission to start; automation can come later if release cadence justifies it.

## User Stories

### User Story 1 — Maintainer earns side income from store sales (Priority: P1)

**As** the project maintainer,
**I want** the same Vaulted Money binary to be listed on App Store, Play Store, and Lemon Squeezy at €9.99 one-time,
**So that** users who prefer to pay rather than build from source provide revenue that supports continued development.

**Acceptance Scenarios**:
1. **Given** a published store listing on App Store/Play Store, **When** a user purchases and installs, **Then** they receive the same Vaulted Money build as is available on GitHub, with all features unlocked.
2. **Given** a published Lemon Squeezy listing, **When** a user pays, **Then** they receive a unique download URL for the current Electron release.
3. **Given** a purchase via any paid channel, **When** the user opens the app, **Then** no license entry screen, license file dialog, or activation flow appears.

### User Story 2 — Mainstream user installs without building (Priority: P1)

**As** a non-technical iOS / Android / Mac user who values privacy,
**I want** to download Vaulted Money from the official store of my platform,
**So that** I can install and use it without configuring a build toolchain.

**Acceptance Scenarios**:
1. **Given** an iOS user, **When** they search for "Vaulted Money" on the App Store, **Then** they see the paid listing and can purchase via standard Apple flow.
2. **Given** an Android user, **When** they search Play Store, **Then** they see the paid listing and can purchase via standard Google flow.
3. **Given** a macOS user uncomfortable with `pnpm install`, **When** they visit vaultedmoney.com (or the GitHub readme), **Then** they see a "Buy on App Store" or "Buy on Lemon Squeezy" link in addition to the free download.

### User Story 3 — Technical user continues to use the free OSS build (Priority: P1)

**As** a developer or privacy-conscious power user,
**I want** to continue building Vaulted Money from source or downloading the free GitHub Release artifact,
**So that** I have full control over the binary and the project's open-source promise is honored.

**Acceptance Scenarios**:
1. **Given** the public GitHub repository at any tag, **When** the user runs `pnpm install && pnpm run electron:build`, **Then** they produce a working desktop binary with all features available, no nags, no purchase prompts.
2. **Given** an Android user who enables sideloading, **When** they download the GitHub Release `.apk`, **Then** they get the same functionality as the Play Store paid version.
3. **Given** any user of any build, **When** they navigate the app, **Then** they encounter no "upgrade to Pro" prompts, gated menu items, or feature differences keyed to a license state.

### User Story 4 — App attribution complies with MIT terms (Priority: P1)

**As** a maintainer distributing a binary that bundles MIT-licensed OSS dependencies,
**I want** the app to include an in-product Acknowledgments page listing those dependencies and their licenses,
**So that** the binary satisfies the attribution clause of each bundled MIT license and meets App Store / Play Store policy requirements for OSS attribution.

**Acceptance Scenarios**:
1. **Given** the running app, **When** the user opens Settings, **Then** an "Acknowledgments" or "Open Source Licenses" entry is visible.
2. **Given** the Acknowledgments view, **When** the user opens it, **Then** they see a generated list of bundled dependencies with names, versions, and license texts.
3. **Given** a CI build, **When** the Acknowledgments file is generated, **Then** it reflects the current `pnpm-lock.yaml` contents (no stale entries).

### User Story 5 — Public-facing positioning is accurate and memorable (Priority: P2)

**As** a visitor to the homepage or store listing,
**I want** the pillars wording to be parallel, memorable, and accurate,
**So that** the project's identity reads cleanly across web, app, and stores.

**Acceptance Scenarios**:
1. **Given** the HomePage, SiteFooter, and i18n resources, **When** any pillar is rendered, **Then** it appears as one of `Privacy-first`, `Data-local`, or `Open-sourced` (all hyphenated in parallel).
2. **Given** the README, **When** the pillars are described, **Then** they match the in-app wording.
3. **Given** a non-English translation (initially Dutch), **When** the pillars are rendered, **Then** they appear in the locale's parallel form.

### User Story 6 — Store purchase channel is discoverable from inside the app (Priority: P2)

**As** an existing user of the OSS build,
**I want** to discover that I can buy the app on a store as a way to support development,
**So that** I have an easy path to contribute financially if I find the app valuable.

**Acceptance Scenarios**:
1. **Given** the existing DonationPage, **When** the user opens it, **Then** it lists App Store / Play Store / Lemon Squeezy purchase as a supported channel alongside GitHub Sponsors, PayPal, and bank.
2. **Given** the user clicks a store link, **When** the platform permits, **Then** the appropriate store page opens externally; otherwise the URL is shown for the user to visit manually.

## Requirements

### Functional Requirements

#### Pillars and copy updates

- **FR-001**: Replace the existing English pillar strings `"Privacy-first"` / `"Data local"` / `"Open sourced"` with `"Privacy-first"` / `"Data-local"` / `"Open-sourced"` (adding hyphens between *Data/local* and *Open/sourced*) in:
  - `src/pages/HomePage.tsx`
  - `src/components/SiteFooter.tsx`
  - `src/i18n/resources.ts` (English tagline and any other English references)
- **FR-002**: Update the Dutch (`nl`) translation of the tagline in `src/i18n/resources.ts` to a parallel form (e.g., adapt the existing wording to apply hyphenation consistently in Dutch where idiomatic).
- **FR-003**: Update `README.md` to reflect the new pillars wording.
- **FR-004**: Update `README.md` with a "Support the project" section listing App Store, Play Store, Lemon Squeezy, and existing GitHub Sponsors / Ko-fi / PayPal channels.

#### Acknowledgments page

- **FR-005**: Add an `Acknowledgments` page (route + Settings entry) that renders a generated list of bundled OSS dependencies with name, version, and license text.
- **FR-006**: Add a build-time script (e.g., `scripts/generate-acknowledgments.mjs`) that walks `pnpm-lock.yaml` (or `node_modules`) and produces a TypeScript module at `src/data/acknowledgments.generated.ts` consumed by the Acknowledgments page. The script must run automatically as part of `pnpm run build` (prepended to the existing `tsc --noEmit && vite build` chain) so the Acknowledgments output cannot fall stale relative to bundled dependencies.
- **FR-007**: Link the Acknowledgments page from the existing `SettingsPage.tsx` under a clearly labeled section (e.g., "About → Open Source Licenses").

#### Donation page update

- **FR-008**: Update `src/pages/DonationPage.tsx` to include three additional support channels:
  - Apple App Store purchase (link active once listing is live)
  - Google Play Store purchase (link active once listing is live)
  - Lemon Squeezy desktop purchase (link active once listing is live)
- **FR-009**: Update DonationPage copy to frame the store purchases as a way to support development, with explicit acknowledgment that the same software is free on GitHub.

#### Store listings (operational, not code)

- **FR-010**: Enroll in the Apple Developer Program. Create an App Store Connect record for bundle ID `com.vaultedmoney.app`. Configure pricing tier corresponding to €9.99 (Apple's tier system; user accepts that the equivalent USD price will be slightly different per Apple's pricing matrix).
- **FR-011**: Enroll in Google Play Console. Create a Play Store listing for `com.vaultedmoney.app`. Configure paid-up-front pricing at €9.99.
- **FR-012**: Create a Lemon Squeezy (or Polar.sh) digital-product listing for the Electron desktop binary at €9.99 with automatic email delivery of a unique download URL upon purchase.
- **FR-013**: Prepare store assets (screenshots per device class, short description, long description, keywords, icons — most icons already exist in the repo). Each store listing's description must state that the source is MIT-licensed and freely available at the GitHub repository URL.
- **FR-014**: Submit and ship initial release through each channel. (App Store review: 1–3 days typical; Play Store: hours to days.)

#### Build, release, and CI

- **FR-015**: No changes are required to the platform-build scripts (`electron:build`, `electron:compile`, `android:build:apk`, `android:build:apk:release`, `ios:build:simulator`, `release:local`), the Electron build pipeline, Capacitor configuration, or the CircleCI release pipeline to support paid distribution. The artifacts submitted to stores are produced by the existing platform-build commands. (The `build` script itself is extended per FR-006 to prepend the Acknowledgments generator step; this is the only `package.json` change in scope.)
- **FR-016**: Configure release signing for iOS (Apple distribution certificate, provisioning profile) and Android (release keystore). Keystore and certificate management is one-time setup; subsequent releases reuse the same signing identities.
- **FR-017**: No environment variables, secrets, or API keys are introduced to the codebase or its build process beyond those required for platform-native code signing (which live in the developer's local signing config, not in source).

#### Out-of-scope guarantees (negative requirements)

- **FR-018**: No license-check code, license file parser, license server client, hardware fingerprint, or activation flow is added to the application.
- **FR-019**: No private repository, build-time module aliasing, or feature flag system is introduced to gate features between builds.
- **FR-020**: No code paths differ between the GitHub-published binary and the App Store / Play Store / Lemon Squeezy binary. All builds are produced from the same commit on the public repo.

### Distribution Channel Matrix

| Channel | Artifact | Audience | Price | Maintainer cost |
|---|---|---|---|---|
| Public GitHub `pnpm install` | Source build any platform | Developers, tinkerers, privacy advocates | Free | $0 |
| GitHub Releases | `.dmg` / `.exe` / `.AppImage` / `.apk` | Linux users, Android sideloaders, OSS supporters | Free | $0 (existing CI) |
| Apple App Store (iOS, optionally macOS) | `.ipa` (signed) | Mainstream Apple users | €9.99 one-time | $99/year Apple Developer Program |
| Google Play Store | `.aab` (signed) | Mainstream Android users | €9.99 one-time | $25 one-time Play Console |
| Lemon Squeezy / Polar.sh | Same Electron `.dmg` / `.exe` / `.AppImage` | Desktop users who prefer storefront purchase | €9.99 one-time | ~5% + payment processor fees, no fixed cost |
| GitHub Sponsors / Ko-fi / PayPal | N/A (direct support) | Users who want to give directly | Variable | $0 |

### Pricing

- **Launch price**: €9.99 one-time across all paid channels.
- **Rationale**: Positions Vaulted Money between the free OSS local-first competitors (GnuCash, HomeBank, Buddi) and the polished commercial local-first competitors (MoneyMoney at €29 + €15/year, iFinance at €30, Banktivity at $99 + subscription). At €9.99 one-time, Vaulted Money is materially cheaper than the polished commercial alternatives while substantially more modern than the free OSS ones.
- **Model**: Paid up-front (App Store Pattern B). No subscription. No IAP. No trial — Apple's standard 14-day refund window suffices.
- **Future**: Price may be raised after launch (existing customers grandfathered automatically by App Store / Play Store) once polish and feature depth justify it. Do not decrease.

### Component Impact

#### New files

- `specs/032-monetization-via-app-stores/spec.md` (this document)
- `specs/032-monetization-via-app-stores/plan.md` (to be written by `writing-plans` skill in follow-up)
- `src/pages/AcknowledgmentsPage.tsx` (new in-app Acknowledgments view)
- `src/data/acknowledgments.generated.ts` or equivalent (build-time generated dependency list)
- `scripts/generate-acknowledgments.mjs` (build-time generator script)

#### Modified files

- `src/pages/HomePage.tsx` — pillars wording (FR-001)
- `src/components/SiteFooter.tsx` — pillars wording (FR-001)
- `src/i18n/resources.ts` — pillars wording, English and Dutch (FR-001, FR-002)
- `src/pages/SettingsPage.tsx` — link to Acknowledgments page (FR-007)
- `src/pages/DonationPage.tsx` — store purchase channels and copy update (FR-008, FR-009)
- `README.md` — pillars wording, Support-the-project section (FR-003, FR-004)
- `package.json` — `build` script wired to invoke `generate-acknowledgments.mjs` (FR-006)
- App router (wherever routes are registered) — register the Acknowledgments route

#### Unchanged / explicitly preserved

- `capacitor.config.ts` — bundle ID `com.vaultedmoney.app` already correct
- `electron/main.ts`, `electron/preload.ts`
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `tailwind.config.ts`
- `LICENSE` (stays MIT)
- All existing build scripts in `package.json` apart from the `build` chain addition above
- All existing CI configs (`.circleci/config.yml`, `release.yml`)
- Database schema (Dexie)
- All page logic outside HomePage / SiteFooter / SettingsPage / DonationPage

## Success Criteria

### Measurable Outcomes

- **SC-001**: App Store listing is live for `com.vaultedmoney.app` at €9.99 paid up-front. Users can complete a purchase end-to-end and receive a working app from Apple's normal install flow.
- **SC-002**: Google Play Store listing is live for `com.vaultedmoney.app` at €9.99 paid up-front. Users can complete a purchase end-to-end and receive a working app from Google's normal install flow.
- **SC-003**: A Lemon Squeezy (or Polar.sh) digital product listing exists for the Electron desktop binary at €9.99 with automatic email delivery of a per-customer download URL on purchase.
- **SC-004**: A user who clones the public GitHub repository and runs `pnpm install && pnpm run electron:build` produces a binary functionally identical to the Lemon Squeezy desktop build (same commit, same artifact).
- **SC-005**: A user who sideloads the GitHub-released `.apk` on Android obtains a functionally identical experience to the Play Store purchase (same commit, same artifact).
- **SC-006**: The in-app Settings page contains a working link to an Acknowledgments view that lists all bundled OSS dependencies with versions and license texts, auto-generated from the current lockfile during build.
- **SC-007**: The DonationPage lists App Store, Play Store, and Lemon Squeezy as support channels alongside existing options, with copy that frames the purchase as supporting development.
- **SC-008**: HomePage, SiteFooter, README, and i18n English/Dutch all render the pillars as `Privacy-first. Data-local. Open-sourced.` (or the locale-appropriate parallel form).
- **SC-009**: Application source contains no license-check code, license file parser, license server client, hardware fingerprint, or activation flow. Verifiable by inspecting the diff introduced by this spec: no new runtime code paths that read a license file, hit a license server, evaluate a per-user entitlement, fingerprint hardware, or branch the app's behavior on purchase state. Mechanical `grep` over the full repository is not a reliable check on its own, because terms like `license`, `purchase`, `entitlement`, and `activation` legitimately appear in (a) the existing `LICENSE` file, (b) the generated Acknowledgments content that renders bundled dependency licenses, (c) i18n strings and DonationPage copy referencing the store purchase as a support channel, and (d) Apple/Google store-side terminology in user-visible text. The success criterion is met if no *new runtime logic* of the listed kinds is introduced.
- **SC-010**: No new environment variables, runtime configuration, or API keys are introduced beyond platform-native code-signing requirements (which live in local developer config, not in source).

## Future-Proofing

This specification deliberately preserves the option to later evolve toward a true open-core model without rework. The path, when/if justified by a real Pro feature (e.g., encrypted cloud backup, local-LLM categorization, multi-device sync), is:

1. Create a `vaulted-pro` private GitHub repository.
2. In the public repo, extract the Pro-targeted feature surface into a thin interface (e.g., `src/reports/exporter.ts`) shipped with a basic implementation.
3. Implement the Pro variant in the private repo against the same interface.
4. Add a Vite build-time alias in a `vite.config.pro.ts` (or analogous) that maps the public interface module to the private implementation. The OSS build uses the basic implementation; the Pro build merges the private repo and uses the alias.
5. Publish the Pro build separately on Lemon Squeezy (or the same channel re-purposed for a higher tier), and as a Pro IAP on App Store / Play Store (Pattern A switching: free download with IAP unlock for Pro features).
6. The donationware-paid store listings from this spec can remain as a "support" tier, or be reframed as the entry tier to a two-tier (Free / Pro) lineup.

No code introduced in this spec creates obstacles to that path. No interfaces, abstractions, or runtime checks are added that would need to be unwound.

## Open Decisions

These items are flagged for resolution during planning or shortly after launch; none block writing the implementation plan:

- **OD-001**: Storefront choice — Lemon Squeezy vs Polar.sh. Both meet the requirements. Lemon Squeezy is more established; Polar.sh is more OSS-aligned in branding. Defer until plan phase; the spec does not depend on which is chosen.
- **OD-002**: macOS App Store (Mac Catalyst / Mac native via Capacitor or Electron wrap) — defer. Initial scope is iOS App Store + Play Store + Lemon Squeezy for desktop. macOS App Store distribution adds non-trivial Electron signing and notarization work and can be considered separately.
- **OD-003**: Whether to also create a Microsoft Store listing for Windows desktop — defer. Same as macOS App Store; Lemon Squeezy serves Windows desktop adequately at launch.
- **OD-004**: Whether to publish a marketing landing page at vaultedmoney.com beyond the existing GitHub README — defer, not a hard requirement for store submission.
- **OD-005**: Whether the price localizes to exact "€9.99" or to Apple's nearest pricing tier (which may resolve to e.g., €8.99 or €10.99 in some currencies). The user has indicated €9.99 as the anchor; Apple's localization may diverge slightly per market. Accept Apple's localized equivalents.
