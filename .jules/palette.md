
## 2025-02-11 - Semantic Buttons in Tables
**Learning:** Using `div` with `onClick` for table cell actions (like filtering) makes them inaccessible to keyboard users and screen readers.
**Action:** Replace interactive `div`s with `<button>` elements. Use utility classes like `bg-transparent border-0 p-0 text-left` to reset button styles while maintaining the original look, and add `aria-label` for context. For components like `Badge`, wrap the content in a button or use the component's variant styles on a button element if possible.

## 2026-02-11 - Global Tooltip Availability
**Learning:** The `SidebarProvider` in `Layout.tsx` wraps the application content with a `TooltipProvider`. This means `Tooltip` components can be used anywhere within the main layout without needing a local `TooltipProvider`.
**Action:** When adding tooltips to components inside the main layout, directly use `Tooltip`, `TooltipTrigger`, and `TooltipContent` without wrapping them in a new provider.

## 2026-02-16 - Sortable Table Headers
**Learning:** Making `<th>` elements interactive via `onClick` breaks keyboard accessibility (tab focus) and semantic structure. Screen readers expect `aria-sort` on the `<th>` but interaction on a child button.
**Action:** Wrap header content in a semantic `<button type="button">` that fills the cell. Move event handlers to the button, but keep `aria-sort` on the parent `<th>`. Use flex utilities to handle alignment (e.g., `justify-end` for right-aligned columns).

## 2026-02-17 - Combobox Interaction Pattern
**Learning:** The `Combobox` component (specifically in `AddEditTransactionDialog`) renders as a direct text input (via `cmdk`) rather than a button-triggered popover. Automation scripts targeting these fields should look for `input` elements by placeholder text (e.g., "Search accounts...") instead of `button[role='combobox']`.
**Action:** When automating or testing forms using `Combobox`, target the input field directly for typing and filtering, and use `role="option"` or `[cmdk-item]` to select results.
