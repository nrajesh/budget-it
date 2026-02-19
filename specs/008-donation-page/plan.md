# Implementation Plan - Donation Page

**Component**: Frontend
**Goal**: Create a new page for donations/funding with Github Sponsors and QR codes.

## Proposed Changes

### [NEW] `src/pages/DonationPage.tsx`
- Create a new page component.
- Use Tailwind CSS for styling.
- Layout:
    - Title: "Support Budget It"
    - Subtitle: "I drink tea & not coffee 😉"
    - Card for Github Sponsors (Link to `https://github.com/sponsors/nrajesh`).
    - Card for Payment (Display QR codes).
    - Responsive design (stack on mobile, side-by-side or grid on desktop).

### [MODIFY] `src/App.tsx`
- Import `DonationPage` (lazy load).
- Add `Route` for `/donate`.

### [MODIFY] `src/components/Layout.tsx`
- Add "Donate" or "Support" link to the sidebar navigation.
- Use a suitable icon (e.g., `Heart` or `Coffee` from `lucide-react`, though user prefers Tea, maybe `Mug` or `Cup`). `lucide-react` has `Coffee`, `CupSoda`? I'll check available icons later or use `Heart` for generic support.

### [NEW] `public/assets/donation-qr.png`
- Place the user-provided QR code image here.

## Verification Plan

### Automated Tests
- Run `pnpm type-check` to ensure no type errors.
- Run `pnpm lint` to ensure code style.
- Run `pnpm build` to verify production build works.

### Manual Verification
1. Start app (`pnpm dev`).
2. Click "Donate" in sidebar.
3. Verify URL is `/donate`.
4. Verify "Github Sponsors" link works.
5. Verify QR code image is visible.
6. Verify "Tea" message is visible.
7. Check responsiveness on mobile view.
