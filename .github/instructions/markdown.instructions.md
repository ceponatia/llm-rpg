---
applyTo: "**/*.md"
---

## Repository Markdown Authoring Instructions

These instructions apply to all Markdown files. Follow them exactly to minimize lint noise and ensure consistent rendering across GitHub, editors, and doc generators.

## General Principles
* Prefer semantic headings (start at `#` for page title, then `##`, `###`, without skipping levels).
* Keep line length readable (< 120 chars) but do not hard‑wrap mid‑sentence solely for width.
* Avoid trailing whitespace and unintended double blank lines.
* Treat fenced code blocks as immutable samples: do not introduce trailing spaces inside them either.

## Lint Rules (Enforced / Previously Violated)

### MD022 – Headings should be surrounded by blank lines
Rule: Exactly one blank line before and after every heading (except start/end of file). 
Do:
```
Paragraph text.

## Heading

Next paragraph.
```
Don’t: Place a heading immediately adjacent to content with no separating blank line.

### MD032 – Lists should be surrounded by blank lines
Add one blank line before the first list item and one blank line after the final list item (unless followed by another list at same nesting). Nested lists are allowed inside a parent item without extra blank lines between parent and nested list.

### MD007 – Unordered list indentation
Use a single space after the list marker. Nested list items are indented by two spaces relative to the parent’s marker for clarity, e.g.:
```
* Parent item
	* Nested item
```
Do NOT mix tabs and spaces. Do NOT use 3+ spaces unless code block alignment requires it.

### MD029 – Ordered list item prefix style
Use auto‑number style (`1.` for every item) OR strict incremental (`1.`, `2.`, `3.`) consistently within a single list. Project preference: use `1.` for all items (GitHub auto‑numbers). Never restart numbering mid‑list unless separated by a blank paragraph.

### MD004 – Unordered list style
Use asterisks (`*`) for all unordered list items (including task list items). Do NOT use `-` or `+` except inside code examples explicitly demonstrating syntax variants.

### MD058 – Tables should be surrounded by blank lines
Insert one blank line before and after any table block.
```
Intro paragraph.

| Col | Desc |
|-----|------|
| A   | B    |

Following paragraph.
```

### MD009 – No trailing spaces
Remove all trailing spaces at end of lines. Exception: two spaces for a deliberate hard line break (avoid unless absolutely necessary; prefer blank line paragraph separation).

### Additional Formatting Conventions
* Headings: Sentence case (capitalize first word, proper nouns only).
* Code fences: Always specify a language when possible (`bash`, `ts`, `json`, `markdown`). For multi‑language snippets, split into multiple fences.
* Task lists: Use `* [ ]` or `* [x]` (lowercase `x`). Provide a concise action phrase first, then optional context after an en dash.
* Tables: Keep alignment minimal; no need to pad columns to equal width.
* Emphasis: Prefer `*italic*` / `**bold**`; avoid underscores in prose emphasis.
* Links: Use inline links; convert bare URLs to `[text](url)` unless demonstrating a raw link.
* Inline code: Use backticks; escape backticks inside with double backticks ``like `this` ``.

## When Editing Existing Docs
1. If you encounter a violation, fix the immediate area (local cleanup) but avoid broad, style‑only sweeping changes unrelated to the intent of the commit.
2. Maintain existing numbering style within a specific list; only convert entire list to `1.` style if you’re already modifying that list for functional reasons.
3. Keep historical checklist completion markers (`[x]`) intact—only change when status truly changes.

## Task Lists & Checkboxes
* Use asterisks: `* [ ] Task` / `* [x] Done task`.
* Provide actionable verbs: Start with “Add”, “Implement”, “Refactor”, “Document”, etc.
* Sub‑tasks nest beneath primary tasks with two‑space indent.

## Common Pitfalls & Quick Fixes
| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing blank line before heading | Lint MD022 | Insert single blank line above heading |
| Mixed `-` and `*` list markers | Lint MD004 | Replace all with `*` |
| No blank line before list | Lint MD032 | Add blank line above first list item |
| Wrong ordered numbering increments | Lint MD029 | Change all prefixes to `1.` |
| Trailing spaces | Lint MD009 | Remove or reduce to exactly two if intentional line break |
| Table jammed to paragraph | Lint MD058 | Insert blank line before/after table |

## Review Checklist (Apply Before Commit)
* [ ] All headings have single blank line before/after.
* [ ] Lists & tables separated by blank lines.
* [ ] No trailing whitespace (except intentional double space line breaks).
* [ ] Unordered lists use `*` markers consistently.
* [ ] Ordered lists use `1.` style consistently.
* [ ] Task list syntax correct (`* [ ]` / `* [x]`).
* [ ] Code fences have language specifiers.
* [ ] No accidental secrets or credentials inserted.

End of instructions.
