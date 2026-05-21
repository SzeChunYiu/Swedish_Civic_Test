#!/usr/bin/env python3
import json, os, random, subprocess, time
from pathlib import Path

RUN = Path('.codex-pr-merge/latest-run-id.txt').read_text().strip()
BEFORE = Path(f'.codex-pr-merge/admin-open-before-{RUN}.json')
RESULTS = Path(f'.codex-pr-merge/admin-results-{RUN}.jsonl')
ORDER = Path(f'.codex-pr-merge/admin-random-order-{RUN}.json')
prs = json.loads(BEFORE.read_text())
seed = int(time.time_ns() ^ (os.getpid() << 8))
r = random.Random(seed)
r.shuffle(prs)
ORDER.write_text(json.dumps({'seed': seed, 'order': [p['number'] for p in prs]}, indent=2) + '\n')
RESULTS.write_text('')
print(f'admin_random_seed={seed} first_random_pr={prs[0]["number"] if prs else "NONE"} total={len(prs)}', flush=True)

def run(cmd, timeout=180):
    try:
        return subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        cp = subprocess.CompletedProcess(cmd, 124, e.stdout or '', e.stderr or '')
        return cp

def gh_json(args):
    cp = run(['rtk','proxy','gh'] + args, timeout=60)
    if cp.returncode != 0:
        return None, cp
    try:
        return json.loads(cp.stdout), cp
    except Exception:
        return None, cp

def checks_state(rollups):
    if not rollups:
        return 'NO_CHECKS', []
    out=[]; pending=False; failed=False
    for x in rollups:
        item={'name': x.get('name') or x.get('context') or x.get('__typename') or 'check', 'status': x.get('status') or '', 'conclusion': x.get('conclusion') or ''}
        out.append(item)
        if item['status'] != 'COMPLETED' or not item['conclusion']:
            pending=True
        elif item['conclusion'] not in ('SUCCESS','NEUTRAL','SKIPPED'):
            failed=True
    if failed: return 'FAILED', out
    if pending: return 'PENDING', out
    return 'PASSED', out

for idx, p0 in enumerate(prs, 1):
    n=p0['number']
    entry={'number': n, 'order_index': idx, 'initial_title': p0.get('title'), 'initial_url': p0.get('url')}
    view, cp = gh_json(['pr','view',str(n),'--json','number,title,state,isDraft,mergeStateStatus,mergeable,headRefName,headRefOid,baseRefName,statusCheckRollup,url'])
    if view is None:
        entry.update({'result':'view_failed','view_returncode':cp.returncode,'view_stdout':(cp.stdout or '')[-2000:],'view_stderr':(cp.stderr or '')[-2000:]})
        RESULTS.open('a').write(json.dumps(entry)+'\n')
        print(f'[{idx}/{len(prs)}] #{n} view_failed', flush=True)
        continue
    entry.update({k:view.get(k) for k in ('title','state','isDraft','mergeStateStatus','mergeable','headRefName','headRefOid','baseRefName','url')})
    cstate, checks=checks_state(view.get('statusCheckRollup') or [])
    entry['checks_state']=cstate; entry['checks']=checks
    if view.get('state') != 'OPEN':
        entry['result']='not_open_at_processing_time'
        RESULTS.open('a').write(json.dumps(entry)+'\n')
        print(f'[{idx}/{len(prs)}] #{n} not_open', flush=True)
        continue
    if view.get('isDraft'):
        ready_cmd=['rtk','gh','pr','ready',str(n)]
        ready=run(ready_cmd, timeout=120)
        entry['ready_command']=' '.join(ready_cmd)
        entry['ready_returncode']=ready.returncode
        entry['ready_stdout']=(ready.stdout or '')[-3000:]
        entry['ready_stderr']=(ready.stderr or '')[-3000:]
        # Refresh head after ready in case state changed.
        view2, cp2 = gh_json(['pr','view',str(n),'--json','number,state,isDraft,mergeStateStatus,mergeable,headRefOid,statusCheckRollup,url,title'])
        if view2 is not None:
            view.update(view2)
            entry.update({'state_after_ready':view2.get('state'),'isDraft_after_ready':view2.get('isDraft'),'mergeStateStatus_after_ready':view2.get('mergeStateStatus'),'mergeable_after_ready':view2.get('mergeable'),'headRefOid_after_ready':view2.get('headRefOid')})
        if ready.returncode != 0:
            entry['result']='saved_failed_ready_command'
            entry['failure_reason']='Could not mark draft PR ready before admin merge.'
            RESULTS.open('a').write(json.dumps(entry)+'\n')
            print(f'[{idx}/{len(prs)}] #{n} ready_failed', flush=True)
            continue
    merge_cmd=['rtk','gh','pr','merge',str(n),'--admin','--merge','--delete-branch']
    head=view.get('headRefOid') or entry.get('headRefOid_after_ready')
    if head:
        merge_cmd += ['--match-head-commit', head]
    m=run(merge_cmd, timeout=180)
    entry['merge_command']=' '.join(merge_cmd)
    entry['merge_returncode']=m.returncode
    entry['merge_stdout']=(m.stdout or '')[-5000:]
    entry['merge_stderr']=(m.stderr or '')[-5000:]
    if m.returncode == 0:
        entry['result']='admin_merged'
    else:
        entry['result']='saved_failed_admin_merge'
        entry['failure_reason']='Admin merge command failed; usually merge conflict, already-closed race, or head changed.'
    RESULTS.open('a').write(json.dumps(entry)+'\n')
    print(f'[{idx}/{len(prs)}] #{n} {entry["result"]} (draft={entry.get("isDraft")}, checks={cstate}, mergeable={entry.get("mergeable")}, state={entry.get("mergeStateStatus")})', flush=True)
