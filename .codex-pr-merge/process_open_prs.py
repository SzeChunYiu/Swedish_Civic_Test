#!/usr/bin/env python3
import json, os, random, subprocess, sys, time
from pathlib import Path

RUN = Path('.codex-pr-merge/latest-run-id.txt').read_text().strip()
IN = Path(f'.codex-pr-merge/open-prs-start-{RUN}.json')
RESULTS = Path(f'.codex-pr-merge/results-{RUN}.jsonl')
ORDER = Path(f'.codex-pr-merge/random-order-{RUN}.json')
START_NOTE = Path(f'.codex-pr-merge/random-start-{RUN}.txt')

prs = json.loads(IN.read_text())
seed = int(time.time_ns() ^ os.getpid())
rng = random.Random(seed)
rng.shuffle(prs)
ORDER.write_text(json.dumps({'seed': seed, 'order': [p['number'] for p in prs]}, indent=2) + '\n')
START_NOTE.write_text(f"seed={seed}\nfirst_random_pr={prs[0]['number'] if prs else 'NONE'}\n")
print(f"random_seed={seed} first_random_pr={prs[0]['number'] if prs else 'NONE'} total={len(prs)}")

# Start a fresh results file for this run.
RESULTS.write_text('')

def gh_json(args):
    cp = subprocess.run(['gh'] + args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if cp.returncode != 0:
        return None, cp
    try:
        return json.loads(cp.stdout), cp
    except Exception:
        return None, cp

def run(args):
    return subprocess.run(['gh'] + args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def checks_state(rollups):
    if not rollups:
        return 'NO_CHECKS', []
    normalized=[]
    any_pending=False
    any_failed=False
    for r in rollups:
        name=r.get('name') or r.get('context') or r.get('__typename') or 'check'
        status=r.get('status') or ''
        conclusion=r.get('conclusion') or ''
        normalized.append({'name': name, 'status': status, 'conclusion': conclusion})
        if status != 'COMPLETED' or not conclusion:
            any_pending=True
        elif conclusion not in ('SUCCESS', 'NEUTRAL', 'SKIPPED'):
            any_failed=True
    if any_failed:
        return 'FAILED', normalized
    if any_pending:
        return 'PENDING', normalized
    return 'PASSED', normalized

for i, p0 in enumerate(prs, 1):
    n = p0['number']
    entry = {'number': n, 'order_index': i, 'url': p0.get('url'), 'title': p0.get('title')}
    view, cp = gh_json(['pr','view',str(n),'--json','number,title,state,isDraft,mergeStateStatus,mergeable,headRefName,headRefOid,baseRefName,statusCheckRollup,url'])
    if view is None:
        entry.update({'result': 'view_failed', 'returncode': cp.returncode, 'stdout': cp.stdout[-2000:], 'stderr': cp.stderr[-2000:]})
        RESULTS.open('a').write(json.dumps(entry) + '\n')
        print(f"[{i}/{len(prs)}] PR #{n}: view_failed")
        continue
    entry.update({k: view.get(k) for k in ('state','isDraft','mergeStateStatus','mergeable','headRefName','headRefOid','baseRefName')})
    entry['url'] = view.get('url')
    entry['title'] = view.get('title')
    cstate, checks = checks_state(view.get('statusCheckRollup') or [])
    entry['checks_state'] = cstate
    entry['checks'] = checks
    if view.get('state') != 'OPEN':
        entry['result'] = 'not_open_at_processing_time'
    elif view.get('isDraft'):
        entry['result'] = 'saved_failed_draft'
        entry['failure_reason'] = 'PR is draft and cannot be merged to main.'
    elif view.get('mergeable') == 'CONFLICTING' or view.get('mergeStateStatus') == 'DIRTY':
        entry['result'] = 'saved_failed_conflict'
        entry['failure_reason'] = 'PR has merge conflicts / dirty merge state.'
    elif cstate == 'FAILED':
        entry['result'] = 'saved_failed_checks'
        entry['failure_reason'] = 'Required/status check rollup contains a failed check.'
    elif cstate == 'PENDING':
        args = ['pr','merge',str(n),'--auto','--merge']
        if view.get('headRefOid'):
            args += ['--match-head-commit', view['headRefOid']]
        m = run(args)
        entry['merge_command'] = 'gh ' + ' '.join(args)
        entry['merge_returncode'] = m.returncode
        entry['merge_stdout'] = m.stdout[-4000:]
        entry['merge_stderr'] = m.stderr[-4000:]
        if m.returncode == 0:
            entry['result'] = 'auto_merge_enabled_pending_checks'
        else:
            entry['result'] = 'saved_failed_auto_merge'
            entry['failure_reason'] = 'Auto-merge could not be enabled while checks were pending.'
    else:
        # PASSED or NO_CHECKS: attempt immediate normal merge using repo default method (MERGE).
        args = ['pr','merge',str(n),'--merge']
        if view.get('headRefOid'):
            args += ['--match-head-commit', view['headRefOid']]
        m = run(args)
        entry['merge_command'] = 'gh ' + ' '.join(args)
        entry['merge_returncode'] = m.returncode
        entry['merge_stdout'] = m.stdout[-4000:]
        entry['merge_stderr'] = m.stderr[-4000:]
        if m.returncode == 0:
            entry['result'] = 'merged'
        else:
            entry['result'] = 'saved_failed_merge_command'
            entry['failure_reason'] = 'Immediate merge command failed.'
    RESULTS.open('a').write(json.dumps(entry) + '\n')
    print(f"[{i}/{len(prs)}] PR #{n}: {entry['result']} ({entry.get('checks_state')}, {entry.get('mergeable')}, {entry.get('mergeStateStatus')})")
