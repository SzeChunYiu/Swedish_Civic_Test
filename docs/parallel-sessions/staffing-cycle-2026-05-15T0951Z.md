# CEO staffing cycle — 2026-05-15T09:51Z

## Required docs read

- `/projects/hep/fs10/shared/codex-tooling/supervisor/docs/parallel-sessions/ceo-executive.md`
- `/projects/hep/fs10/shared/codex-tooling/supervisor/docs/company-operating-model.md` (project-local `docs/company-operating-model.md` is absent)
- `/projects/hep/fs10/shared/codex-tooling/supervisor/docs/ai-factory.md` (project-local `docs/ai-factory.md` is absent)
- `/projects/hep/fs10/shared/codex-tooling/supervisor/docs/ceo-staffing.md` (project-local `docs/ceo-staffing.md` is absent)
- `docs/parallel-sessions/TEAM_PLAN.md`
- `codex-tasks/*.txt`

## Workload

Queue snapshot at 2026-05-15T09:49Z:

| Queue | /goal count |
|---|---:|
| `codex-tasks/blockers.txt` | 1 |
| `codex-tasks/ceo.txt` | 1 |
| `codex-tasks/content.txt` | 3 |
| `codex-tasks/gm.txt` | 3 |
| `codex-tasks/open.txt` | 0 |
| `codex-tasks/setup.txt` | 3 |
| `codex-tasks/validator.txt` | 2 |

Acceptance rows A1-A8 are all `open`. Live civic panes before staffing: one pane in `civic-test-station-1` (CEO only).

## Node / station resources

- Host: `cn062`, user `scyiu`, project path `/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test`.
- SLURM: job `3067596` named `AI-factory-csup-b` running on one node `cn062`.
- CPU visible to this process: `nproc` reports 1.
- Memory: 250 GiB total, 235 GiB available.
- Disk: `/projects/hep/fs10` has 245T available; `/` has 53G available.
- Load average: about `3.47 4.09 7.02`.
- `csup hosts` reports `civic-lunarc local up job=3067596 node=cn062`, but station allocation still fails below.

## Staffing commands

Dry-run:

```text
$ csup staff --scenario=resume --dry-run
STAFF-UP civic-test/civic-lunarc reason=queued_work work=13 blockers=1 prompts=2 scenario=resume action=factory-run mode=dry-run
FACTORY-RUN civic-test/civic-lunarc scenario=resume work=13 blockers=1 sessions=1 workers=5 panes=6 mode=dry-run
csup: station mode=dry-run project=/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test host=civic-lunarc sessions=1 workers=5 panes_per_session=6
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/civic-lunarc sessions_waiting=1 reason=login_unreachable
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/civic-lunarc sessions_waiting=1 reason=no_station_capacity
```

Apply (run because dry-run reported `STAFF-UP` / understaffed):

```text
$ csup staff --scenario=resume --apply
STAFF-UP civic-test/civic-lunarc reason=queued_work work=13 blockers=1 prompts=2 scenario=resume action=factory-run mode=apply
FACTORY-RUN civic-test/civic-lunarc scenario=resume work=13 blockers=1 sessions=1 workers=5 panes=6 mode=apply
csup: station mode=apply project=/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test host=civic-lunarc sessions=1 workers=5 panes_per_session=6
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/civic-lunarc sessions_waiting=1 reason=login_unreachable
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/civic-lunarc sessions_waiting=1 reason=no_station_capacity
```

Post-apply pane check still shows only one civic pane:

```text
civic-test-station-1:0.1 active=1 dead=0 current=/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test cmd=node
```

## CEO decision

Decision: **hold worker dispatch**. Demand exists and node RAM/disk look adequate, but `csup staff --apply` cannot open the requested manager/worker session. B3 remains a stop-the-line infrastructure blocker until station reachability/capacity is fixed, then `csup staff --scenario=resume --dry-run` and `--apply` should be rerun.
