# Implementation Plan - Compact Left Menu

We will implement a compact left menu that displays icons by default, expands to overlay content on hover, and allows users to "pin" it to a permanently expanded state.

## User Review Required

> [!IMPORTANT]
> The "Pin" functionality will reuse the existing `SidebarTrigger` logic but with a new UI element. The "Unpinned" state will now correlate to "Collapsed + Hover Expandable", whereas previously "Collapsed" was static. This is a behavior change for the collapsed state.

## Proposed Changes

### UI Components

#### [MODIFY] [sidebar.tsx](file:///Users/nrajesh/Github/budget-it/src/components/ui/sidebar.tsx)

- Update `Sidebar` component to track `isHovered` state.
- Implement "Floating Expansion" logic:
    - **Crucial Implementation**: The "Gap Div" (reserving layout space) MUST be forcibly locked to `w-[var(--sidebar-width-icon)]` when `state="collapsed"`, regardless of hover. This ensures the main content never shifts during hover expansion.
    - The "Fixed Div" (visible sidebar) expands over the content (`z-50`).
    - **Interaction**: Remove any `onClick` handler on the sidebar container to prevent accidental pinning during navigation.
    - **Pinning**: Implement `PinTrigger` with `e.stopPropagation()` to handle manual pinning.

#### [MODIFY] [Layout.tsx](file:///Users/nrajesh/Github/budget-it/src/components/Layout.tsx)

- Update `<Sidebar>` prop to `collapsible="icon"`.
- Add a "Pin/Unpin" toggle button to the `SidebarHeader` or `SidebarFooter`.
- Use the existing `toggleSidebar` from `useSidebar` hook.
- Icon selection:
    - `Pin` icon when Sidebar is Collapsed (Unpinned) -> Clicking it expands and pins.
    - `PinOff` icon when Sidebar is Expanded (Pinned) -> Clicking it unpins and collapses.
- Set default `defaultOpen={false}` in `SidebarProvider` (or verify it reads from cookie correctly, defaulting to closed if no cookie).

## Verification Plan

### Manual Verification

1.  **Compact Default State**:
    -   Clear cookies/local storage.
    -   Reload app.
    -   Verify sidebar is collapsed (icons only).
    -   Verify content takes up remaining width.

2.  **Hover Expansion**:
    -   Hover over the collapsed sidebar.
    -   Verify it expands to show text labels.
    -   **CRITICAL**: Verify the main content (e.g. Dashboard grid) DOES NOT move/shift. The sidebar should overlay it.
    -   Move mouse away. Verify it collapses instantly.

3.  **Pinning**:
    -   Click the "Pin" icon (visible on hover or always?).
    -   Verify sidebar stays expanded when mouse moves away.
    -   Verify main content SHIFTS to accommodate the fixed sidebar width (standard behavior).
    -   Reload page. Verify it stays Pinned.

4.  **Unpinning**:
    -   Click "Unpin" icon.
    -   Verify sidebar collapses.
    -   Reload page. Verify it stays Unpinned.
