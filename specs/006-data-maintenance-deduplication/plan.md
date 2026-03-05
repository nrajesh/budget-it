# Implementation Plan: Data Maintenance

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**Components**:
- `EntityManagementPage`: Main hub.
- `AccountDeduplicationDialog`: Account merge UI.
- `CategoryDeduplicationDialog`: Category merge UI.
- `CleanupEntitiesDialog`: Bulk delete UI.

**Logic**:
- `dataProvider.mergePayees`: Transactional update of foreign keys.
- `dataProvider.mergeCategories`: Similar logic + sub-category handling.

## Project Structure

### Source Code Impact

```text
src/
├── components/
│   └── management/
│       ├── AccountDeduplicationDialog.tsx
│       ├── CategoryDeduplicationDialog.tsx
│       ├── CleanupEntitiesDialog.tsx
│       └── EntityManagementPage.tsx
```

## Implementation Strategy

### Merge Logic
- **Critical Section**: Merging involves updating potentially thousands of transactions.
- **Transaction Safety**: Must use `db.transaction` (Dexie) to ensure atomicity.
- **Validation**: Ensure "Master" entity is not in the "Duplicates" list.

### Cleanup Logic
- **Safety**: Only show entities with `totalTransactions === 0`.
- **Constraint**: Cannot delete System entities (e.g., "Transfer").
