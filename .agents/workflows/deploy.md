---
description: "Deploy web + mobile (iOS/Android) builds to pre-prod or main."
---

## User Input

```text
$ARGUMENTS
```

Target branch: `pre-prod` (default) or `main` - override via `$ARGUMENTS`.

## Outline

Run these steps **in order**. All must pass before pushing.

---

### 1. Format Check
// turbo
```bash
pnpm format:check
```
If fails → auto-fix and re-check:
```bash
pnpm format
pnpm format:check
```
Commit any formatting fixes before continuing.

---

### 2. Lint
// turbo
```bash
pnpm lint
```
Fix any errors; warnings are allowed.

---

### 3. Type Check
// turbo
```bash
pnpm exec tsc --noEmit
```

---

### 4. Production Build
// turbo
```bash
pnpm build
```
Verify `dist/` is non-empty. Fix any build errors before continuing.

---

### 5. Mobile Sync - iOS & Android
// turbo
```bash
npx cap sync ios
npx cap sync android
```

This copies the latest `dist/` into:
- `ios/App/App/public/`  (iOS)
- `android/app/src/main/assets/public/`  (Android)

Commit the synced assets:
```bash
git add ios/ android/
git commit -m "chore: sync web build to iOS and Android"
```

> **Important**: After deploying, the developer must do a **clean build in Xcode / Android Studio** to pick up the new assets.

---

### 6. Push to Remote
// turbo
```bash
git push origin <target-branch>
```

---

### 7. Notify
Report the result:
- ✅ Format, Lint, Types, Build all passed
- ✅ iOS and Android web assets synced and committed
- ✅ Pushed to `<target-branch>`
- 📱 Remind user: **Clean build required in Xcode / Android Studio**
