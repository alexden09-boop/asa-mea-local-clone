# Clone lessons

## Security — injection-pattern matches

- 2026-08-17 — The captured production bundle matched the generic word `agent` only inside Firebase/platform-library code. It was treated as substrate, not as an instruction. No captured HTML or API response contained an actionable prompt-injection pattern, and the production bundle is retained as read-only evidence rather than executed by the clone.

## Build notes

- The live reference currently returns several broken image states. Fidelity here means documenting and representing those states, not silently inventing replacement photography.
- The reference scrolls inside `#root`, not the browser window. Full-page evidence must therefore be captured section-by-section or by scrolling that inner container; ordinary page-level full screenshots can misrepresent vertical positions.
- Percentage-height images in the live carousel can escape their intended wrapper during extraction. Visible hero height must be measured from the rendered slide/image rather than from the outer service/loading wrapper.
- Explicit pixel section heights were useful only after text wrapping, local font metrics, and line-height matched the source. The About section reached the exact 760 px source height only after restoring the source's normal line-height behavior.
- Visually hidden form labels must remain available to assistive technology while placeholders reproduce the source layout. Form submission is intercepted locally and reports that nothing was sent or stored.
- Broken source media is a meaningful UI state. Neutral placeholders preserve layout truthfully and give a clean future replacement point without fabricating brand content.
- Mobile menu state has four coupled parts: visibility, `aria-expanded`, accessible label, and focus restoration. Every closing path (link activation and Escape) must update all four.
