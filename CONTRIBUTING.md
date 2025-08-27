# Contributing Guide

Welcome! This repo uses a lightweight, review‑friendly flow: short feature branches, Pull Requests, automated checks (tests, coverage, Codacy), and conventional commit messages.

## 1. Branch & Workflow

Main (`main`) should always be green and deployable.

Typical cycle:

```bash
git switch main
git pull --ff-only
git switch -c feat/<area>-<summary>
# commit work ...
git push -u origin feat/<area>-<summary>
# open PR -> get review -> merge (squash or rebase)
```

Keep PRs focused (ideally < ~400 changed lines). Separate refactors from behavioral changes when possible.

## 2. Commit Messages (Conventional Commits)

Format:

```text
<type>(<optional scope>): <short imperative summary>

Body (optional, wrapped at 72 cols)

Footer: Closes #123 (optional)
```

Common types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`.

Examples:

- `feat(chat): persist recent turns`
- `fix(memory): guard null vector index`
- `chore(ci): add coverage non-empty check`

## 3. Pre‑Commit Hooks (Husky)

Hooks run automatically:

- `pre-commit`: typecheck + lightweight export lint
- `commit-msg`: enforces commit message format via commitlint

If a hook fails you can fix issues then re‑run:

```bash
git commit --amend
```

To skip hooks (rare, last resort): `git commit --no-verify`.

## 4. Tests & Coverage

Run all tests locally before opening a PR:

```bash
pnpm test
pnpm coverage:all  # optional check combined lcov
```

CI will upload `coverage/combined.lcov` to Codacy on PRs and main.

## 5. Code Quality

General guidelines:

- Keep functions small & purposeful.
- Prefer pure functions for logic (ease of testing) and isolate side effects.
- Add or expand tests for new branches / edge cases you touch.
- Avoid committing commented‑out code; rely on git history.

## 6. Environment & Secrets

Never commit real secrets. Use `.env.local` for development overrides (ignored). Feature flags live in `.env` templates.

## 7. Pull Request Template

Fill all sections (summary, type, testing notes, checklist). A clear PR body reduces review time.

## 8. Keeping Branch Up To Date

Rebase (preferred) to keep history linear:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

`--force-with-lease` protects against overwriting others' work.

## 9. Large / Multi‑Step Changes

Split into stacked PRs where possible:

1. Mechanical refactor / prep
2. Feature logic
3. Follow‑up optimizations

## 10. Tools Summary

| Tool | Purpose |
|------|---------|
| Vitest | Unit tests & coverage |
| Husky | Git hooks (pre-commit, commit-msg) |
| Commitlint | Enforce commit message format |
| Codacy | Coverage + static analysis |

## 11. Questions

Open a draft PR early or start a discussion if unsure about design direction.

Happy hacking!
