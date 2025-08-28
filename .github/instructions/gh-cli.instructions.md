# GitHub CLI Branch Protection & Rulesets Usage

Authoritative quick reference for managing protection of the default branch using the `gh` CLI. GitHub now distinguishes between **legacy branch protection** (older per-branch endpoint) and the newer **Rulesets** system. This repository uses a *Ruleset* (ID-based) for `main`, not the legacy branch protection object. The legacy endpoint will return 404 even though protections are active via the ruleset.

## Prerequisites

- Installed `gh` CLI and authenticated (`gh auth status`).
- Permissions: You must have admin (or maintain with branch protection rights) on the repository.
- The status checks you want to require must already have appeared at least once (GitHub won’t accept unknown context names).

## Discover Existing Status Check Contexts

List recent workflow runs (helps you copy the exact `name` values):

```bash
gh run list --limit 20 --json name,headBranch,conclusion | jq -r '.[] | [.name,.headBranch,.conclusion] | @tsv'
```

External checks (e.g. Codacy Static Code Analysis) appear on PRs but not necessarily in `gh run list`. Use a merged PR’s Checks tab to copy the exact context string if needed.

## Inspect Current Protection (Rulesets vs Legacy)

Legacy (will 404 because we use rulesets):

```bash
gh api repos/<OWNER>/<REPO>/branches/main/protection || echo 'Legacy branch protection not present (expected)'
```

Active Rulesets:

```bash
gh api repos/<OWNER>/<REPO>/rulesets | jq '.[] | {id,name,enforcement}'
```

Fetch a specific ruleset (replace ID):

```bash
RULESET_ID=7705494 # example
gh api repos/<OWNER>/<REPO>/rulesets/$RULESET_ID | jq .
```

## Apply / Update (Ruleset)

Rulesets are managed via the `/rulesets/{id}` endpoint (create/update with POST/PATCH). We typically PATCH the existing ruleset to adjust required status checks. The body must include the complete desired rules array.

Important constraints for this repository (policy):
* Keep `required_approving_review_count` at `0` (no mandatory reviewers).
* Do **not** require signed commits or other manual gates.
* Only add status checks once they have produced at least one successful run on `main` (GitHub needs to have seen the context string).

Current effective ruleset (abridged example):

```json
{
  "id": 7705494,
  "name": "main",
  "conditions": {"ref_name": {"include": ["~DEFAULT_BRANCH"], "exclude": []}},
  "rules": [
    {"type": "deletion"},
    {"type": "pull_request", "parameters": {"required_approving_review_count": 0, "dismiss_stale_reviews_on_push": true}},
    {"type": "required_status_checks", "parameters": {"strict_required_status_checks_policy": true, "required_status_checks": [
      {"context": "Codacy Static Code Analysis"}
    ]}}
  ],
  "enforcement": "active"
}
```

### Adding Lint & Coverage Checks (Recommended Once They Pass)

Wait until both `Lint` and `Coverage & Codacy Upload` workflows have a successful run on `main` (they currently fail; adding them now would block merges). Then run:

```bash
RULESET_ID=7705494
OWNER=<OWNER>
REPO=<REPO>
gh api repos/$OWNER/$REPO/rulesets/$RULESET_ID \
  --method PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  --input <(cat <<'JSON'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": true, "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false, "automatic_copilot_code_review_enabled": false, "allowed_merge_methods": ["merge","squash","rebase"] } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true, "do_not_enforce_on_create": false, "required_status_checks": [
      { "context": "Codacy Static Code Analysis" },
      { "context": "Lint" },
      { "context": "Coverage & Codacy Upload" }
    ] } }
  ],
  "bypass_actors": []
}
JSON
)
```

### Adding Format Later

After the `Format` workflow runs successfully on `main`, re-run the PATCH adding:

```json
{ "context": "Format" }
```

into the `required_status_checks` array (order irrelevant).

### Adding a New Required Check Later (e.g. Format)

1. Merge the new workflow file to `main`.
2. Let it run successfully once (push or PR merge to main).
3. Re-run the protection update with the added context:

```bash
"contexts": [ "Lint", "Format", "Coverage & Codacy Upload", "Codacy Static Code Analysis" ]
```

### Minimal Variant (Ruleset with Only Status Checks)

You could strip the pull request rule entirely, but we keep it to ensure PR-based merging while still requiring 0 approvals. If you ever need a pure status-check ruleset, remove the `pull_request` entry in the `rules` array.

### Removing Protection Entirely

```bash
gh api -X DELETE repos/<OWNER>/<REPO>/branches/main/protection
```

Be cautious—this allows direct pushes until a new rule is created.

## Common Errors & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| 404 Branch not protected (legacy endpoint) | Using legacy endpoint while rulesets in use | Query `/rulesets` instead. |
| 422 “No subschema in anyOf matched” | Using form flags or malformed JSON | Use single JSON body with `--input`. |
| Context not enforced after update | Context never ran on default branch | Trigger workflow run on `main` then re-run update. |
| Merge blocked: missing check never appears | Required context name typo | Verify exact context from PR Checks tab; update rule. |

## Troubleshooting Tips

- Echo body before sending: `BODY=$(cat protection.json); echo "$BODY"; gh api ... --input <(echo "$BODY")`.
- Verify after update: `gh api repos/<OWNER>/<REPO>/branches/main/protection | jq .`.
- For interactive experimentation you can pipe from a file; version control `protection.template.json` if team wants reproducibility.

## Security & Governance

- Keep `enforce_admins` true so admins follow same gates.
- Periodically audit required contexts vs active workflows to remove stale ones (dead workflows slow merges due to perpetual pending checks).
- Document any rule changes in `docs/development/ci-pipeline.md` (Rule Changes Log section) to maintain traceability.

## Template JSON Snippet (Ruleset Patch Body Core)

Embed inside the PATCH above, adding/removing contexts as needed:

```json
{
  "rules": [
    { "type": "deletion" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": true } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true, "required_status_checks": [
      { "context": "Codacy Static Code Analysis" }
    ] } }
  ]
}
```

Add further status check contexts only after first successful run on `main`.

---
Last updated: 2025-08-27