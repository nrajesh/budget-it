# Quality Checklist: Compact Left Menu

## Core Functionality

- [ ] **Default State**:
    - [ ] Sidebar starts collapsed (icon only) for new users.
    - [ ] Layout renders correctly with collapsed sidebar.
- [ ] **Hover Expansion**:
    - [ ] Hovering over sidebar expands it to full width.
    - [ ] Text labels become visible on expansion.
    - [ ] **Main content DOES NOT shift** during hover expansion (overlay/floating behavior).
    - [ ] Moving mouse away collapses sidebar instantly.
- [ ] **Pinning**:
    - [ ] "Pin" button visible when sidebar is expanded.
    - [ ] Clicking "Pin" forces sidebar to stay expanded.
    - [ ] Main content shifts to accommodate pinned sidebar.
    - [ ] "Unpin" button visible when sidebar is pinned.
    - [ ] Clicking "Unpin" returns sidebar to collapsed/hover state.
- [ ] **Persistence**:
    - [ ] Pinned state persists across page reloads.
    - [ ] Unpinned state persists across page reloads.

## Edge Cases

- [ ] **Mobile View**:
    - [ ] Ensure mobile behavior remains unaffected (sheets/drawers).
    - [ ] Hover logic disabled/irrelevant on touch devices.
- [ ] **Rapid interactions**:
    - [ ] Rapidly entering/leaving the sidebar doesn't cause flickering or stuck state.
- [ ] **Keyboard Navigation**:
    - [ ] Tabbing into the sidebar expands it? (Nice to have, but verify behavior).

## Visual Polish

- [ ] **Transitions**: Smooth expansion/collapse animation.
- [ ] **Z-Index**: Expanded sidebar correctly overlays all other content (e.g. modals, charts).
- [ ] **Theme**: Works in both Light and Dark modes.
