# Factory blocker schema — Sweden Citizenship Test Prep

Use this schema for every shared blocker queue line in `codex-tasks/blockers.txt`
and every blocker row in `docs/parallel-sessions/TEAM_PLAN.md`.

## Queue line shape

```text
/goal [BID=<id>] [type=code|data|approval|infra|empirical|external] [blocks=<acceptance-id>] [owner=<lane>] <short unblocker>. Read docs/parallel-sessions.md and docs/parallel-sessions/AI_FACTORY.md first.
```

## Required fields

- `BID` — stable blocker id, e.g. `BID=B-001`
- `type=code|data|approval|infra|empirical|external` — blocker class
- `blocks` — TEAM_PLAN.md acceptance item stopped by this blocker
- `owner` — lane expected to make the next attempt, or `VALIDATOR` when unclear

## Type semantics

| Type | Meaning | Valid next action |
|---|---|---|
| `code` | Source/test defect blocks acceptance | Small patch + targeted verification |
| `data` | Missing/stale content, question, or reference | Add content or mark data wall |
| `approval` | Human/maintainer decision required | Prepare evidence and stop; do not bypass |
| `infra` | Runtime, build, or dependency issue | Repair or route to operator |
| `empirical` | Needs live test, simulator run, or device verification | Collect evidence; code-complete does not clear it |
| `external` | Third-party dependency (AdMob, App Store, UHR PDF access) | Monitor or document; do not patch around it |

## Acceptance rule

A blocker is closed only when `TEAM_PLAN.md` records the evidence path or command
that resolved it, or when explicitly downgraded to `external` or `approval` with
the next human decision recorded.

## Current blockers (Batch 0)

None — `codex-tasks/blockers.txt` is empty.
