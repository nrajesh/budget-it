
## 2025-02-11 - Semantic Buttons in Tables
**Learning:** Using `div` with `onClick` for table cell actions (like filtering) makes them inaccessible to keyboard users and screen readers.
**Action:** Replace interactive `div`s with `<button>` elements. Use utility classes like `bg-transparent border-0 p-0 text-left` to reset button styles while maintaining the original look, and add `aria-label` for context. For components like `Badge`, wrap the content in a button or use the component's variant styles on a button element if possible.
