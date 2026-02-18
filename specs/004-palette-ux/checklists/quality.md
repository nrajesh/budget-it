# Quality Checklist: Icon-Only Button Accessibility

## Palette-Specific Checks

- [ ] All modified buttons have ARIA labels present
- [ ] Labels are concise and action-oriented  
- [ ] Keyboard navigable — no regressions (buttons remain focusable)
- [ ] Existing design patterns followed (`aria-label` consistent with existing `Checkbox` usage)
- [ ] No backend logic changes
- [ ] No new UI dependencies added
- [ ] No visual changes to the interface
- [ ] Total diff is under 50 lines

## Spec vs Plan Consistency

- [ ] All files listed in plan are covered in spec's functional requirements
- [ ] Non-goals (no visual changes, no new deps) are respected in plan
- [ ] Verification plan includes lint, type-check, and build

## Project Constitution Alignment

- [ ] Accessibility improvement aligns with project values
- [ ] Changes are minimal and focused
