# Vaulted Money UI/UX Standards

These standards keep screens predictable across financial modules. When a page needs an exception, prefer creating a named variant instead of one-off spacing, borders, or action layouts.

## Page Structure

Every standard module should follow this order:

1. Page title block with `app-page-header`, `app-gradient-title`, and `app-page-title`.
2. Page action panel with `app-action-panel` when actions are available.
3. Search and filters in a dedicated filter area, directly above the data surface.
4. Content surface or table/list shell with `app-table-shell`.
5. Pagination, totals, or secondary table metadata at the bottom of the same surface.

The title/tagline must not share a row with dense action groups on mobile. Keep the title aligned to the same left edge as the filter and table shell.

## Action Buttons

Use this order for module actions:

1. Maintenance actions, such as reconcile, detect transfers, clean up, de-duplicate, or auto-categorize.
2. Import.
3. Export.
4. Primary create action, such as Add Transaction or Add Account.
5. Refresh as an icon-only utility at the end when present.

Desktop actions may use icon plus label. Mobile secondary actions should be icon-first or icon-only with `title`, `aria-label`, and screen-reader text. The primary create action should keep its label because it is the main task entry point.

Import/export should stay local to the module when the data type is module-specific. Global backup, restore, and full-data import/export belong under Data or Settings.

## Search And Filters

Search belongs above the table/list surface, not inside the table header, card body, or page action panel.

Use one search/filter area per screen:

- Transactions, Dashboard, and Reports: shared transaction filter bar.
- Scheduled: scheduled transaction search/filter bar.
- Management modules: `app-filter-panel` with the module search input.

Active filter chips should sit with the filter control, before the table shell.

## Tables And Lists

Every selectable data surface should include:

- A visible outer shell using `app-table-shell`.
- A persistent selection toolbar using `app-table-toolbar`, even when zero rows are selected.
- Disabled bulk actions at zero selections.
- Icon-first bulk actions on mobile, with labels returning on wider screens.
- Consistent selected-row styling with `app-row-selected`.

Desktop tables can use table rows. Mobile tables should render cards, but selection behavior must remain visually equivalent: the selected state should outline all edges of the row/card. Avoid dashed borders for normal data rows because they read like inconsistent selection or incomplete data.

## Section Cards

Section cards should use a visible header divider through `app-section-header`. Section titles should use `app-section-title`, which is intentionally smaller than `app-page-title`.

Use card titles for section names, not page-scale headings. Reserve gradient titles for page headers and major report headers only.

## Borders And Surfaces

Use these shared classes before adding new surface styles:

- `app-action-panel` for page actions.
- `app-filter-panel` for search and filters.
- `app-table-shell` for bordered data surfaces.
- `app-mobile-row` for mobile row cards.
- `app-row-selected` for selected row/card state.
- `app-section-header` and `app-section-title` for section cards.

Avoid local combinations of `rounded-xl border bg-white/50 dark:bg-black/20` when one of the shared classes fits. This keeps light and dark mode borders from drifting independently.

## Implementation Checklist

Before shipping a module screen, check:

- The title, action panel, search/filter area, and table shell are vertically ordered.
- Import appears before export, and both sit after maintenance actions.
- Search is above the data shell.
- Selectable tables show a zero-selection toolbar.
- Mobile bulk actions do not create horizontal scrolling.
- Selected mobile rows/cards have a full perimeter highlight.
- Section headings are smaller than page headings.
- Section headers use the same border treatment.
