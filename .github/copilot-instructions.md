# Copilot Instructions

- Codacy uses ESLint 9, not 8.
- Never create an .eslintignore file, always use flat.
- Utilize Codacy to identify and fix code problems.
- When you change code that is referenced in the /docs folder, such as in the /development subfolder (CI pipeline, sprints, etc.) you must update the relevant documentation.
- When updating documentation, make your updates and then perform another pass in which you clean up the document to remove erroneous or duplicate information, remove outdated information, and improve overall readability. Keep the overall structure intact, though (don't completely rename headings and so on).
