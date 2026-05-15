# GitHub remote — 2026-05-15

## Purpose

Record the remote repository created after local `main` integration, replacing
the earlier no-remote limitation.

## Remote repository

- GitHub repository: https://github.com/Babbloo-studio/Swedish_Civic_Test
- Visibility: private
- Default branch: `main`
- Local remote: `origin`

## Commands and evidence

```bash
gh repo create Swedish_Civic_Test --private --source=. --remote=origin --push
git push -u origin batch/2026-05-15-foundation
gh repo view --json nameWithOwner,isPrivate,url,defaultBranchRef
```

Observed evidence:

```json
{
  "nameWithOwner": "Babbloo-studio/Swedish_Civic_Test",
  "isPrivate": true,
  "url": "https://github.com/Babbloo-studio/Swedish_Civic_Test",
  "defaultBranchRef": { "name": "main" }
}
```

Local tracking branches after push:

- `main` tracks `origin/main` at `e16b8cd docs: record local main integration`.
- `batch/2026-05-15-foundation` tracks `origin/batch/2026-05-15-foundation` at
  `4cab819 chore: add native prebuild release gate`.

## Scope and limitation

The private GitHub remote provides source control backup and review/publishing
infrastructure. It does not resolve Expo/EAS auth, physical-device testing,
Apple/Google store records, hosted support/privacy URLs, final screenshots,
internal testing, production submission, or post-launch monitoring evidence.
