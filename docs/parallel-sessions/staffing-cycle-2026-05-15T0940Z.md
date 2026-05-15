# CEO staffing cycle evidence — 2026-05-15T09:40Z

## Workload/resource assessment

- Queue demand at audit time: `work=14` from `csup staff` (includes CEO/GM/VALIDATOR/update queues plus SETUP/CONTENT lane tasks), `blockers=1` (`B3` infra blocker).
- Acceptance checklist: A1-A8 are still open.
- Node snapshot: `cn062`, 250Gi RAM total / 236Gi available, fs10 245T available, root 53G available.
- LUNARC socket precheck: `ssh -O check lunarc ... || /Users/billy/lunarc-init.sh` failed because `/Users/billy/lunarc-init.sh` is not present on this host.

## `csup staff --dry-run`

```text
STAFF-UP civic-test/ng-meta-lunarc reason=queued_work work=14 blockers=1 prompts=2 scenario=resume action=factory-run mode=dry-run
FACTORY-RUN civic-test/ng-meta-lunarc scenario=resume work=14 blockers=1 sessions=1 workers=5 panes=6 mode=dry-run
csup: station mode=dry-run project=/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test host=ng-meta-lunarc sessions=1 workers=5 panes_per_session=6
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/ng-meta-lunarc sessions_waiting=1 reason=login_unreachable
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/ng-meta-lunarc sessions_waiting=1 reason=no_station_capacity
```

## `csup staff --apply`

```text
STAFF-UP civic-test/ng-meta-lunarc reason=queued_work work=14 blockers=1 prompts=2 scenario=resume action=factory-run mode=apply
FACTORY-RUN civic-test/ng-meta-lunarc scenario=resume work=14 blockers=1 sessions=1 workers=5 panes=6 mode=apply
csup: station mode=apply project=/projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test host=ng-meta-lunarc sessions=1 workers=5 panes_per_session=6
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/ng-meta-lunarc sessions_waiting=1 reason=login_unreachable
HOLD /projects/hep/fs10/shared/nnbar/billy/Swedish_Civic_Test/ng-meta-lunarc sessions_waiting=1 reason=no_station_capacity
```

## Decision

Hold worker dispatch. `csup staff` wants one session with five workers but cannot launch until `ng-meta-lunarc` / the shared LUNARC station is reachable and has station capacity. See `codex-tasks/blockers.txt` (`B3`), `codex-tasks/ceo.txt` (`CEO-002`), and manager updates `G-003` / `V-CEO-002`.
