# Loopia deploy runbook for `almostswedish.se`

Use this when an operator/AI session must publish the committed static site in
`site/` to Loopia shared hosting.

## Hard rules

- Do **not** run `vercel deploy`, `vercel --prod`, or `vercel link` from this
  repo. See `AGENTS.md` for the Vercel CLI incident history.
- Deploy only the contents of `site/` to Loopia. Do not upload the repo root,
  `node_modules/`, `.git/`, or Expo/native build folders.
- Keep credentials out of logs and commits. If a password appears in chat or a
  shell transcript, rotate it after the deployment.
- Take a remote backup before using `rsync --delete`.

## Current verified Loopia configuration

- Loopia customer zone: <https://customerzone.loopia.se/>
- Domain: `almostswedish.se`
- Domain setting: `Website with Loopia` -> `Unix` hosting
- Web root over SSH: `almostswedish.se/public_html`
- SSH host: `ssh.loopia.se`
- SSH user: visible in Loopia Customer Zone -> `SSH`
- FTP server shown by Loopia: `ftpcluster.loopia.se`
- Existing FTP account: `almostswedish` with `Complete account` scope

The 2026-05-21 manual deployment used SSH because FTP authentication worked,
but FTP directory listing/transfer failed from the local network data channel.
SSH/SFTP was reliable.

## One-time browser setup in Loopia

1. Log in to Loopia Customer Zone.
2. Open `Domain names` -> `almostswedish.se`.
3. Ensure `Website with Loopia` is selected.
4. Select `Unix` hosting. The default `PHP 8.3, Apache 2.4` is fine for this
   static site.
5. Keep `"www" is alias to almostswedish.se` unless product requirements say
   otherwise.
6. Save.
7. Open `SSH`.
8. Add a temporary deploy public key. Use an Ed25519 key unless Loopia rejects
   it.

Example local key generation:

```bash
ssh-keygen -t ed25519 -N '' \
  -C 'codex-loopia-deploy-YYYYMMDD' \
  -f /tmp/loopia_deploy_ed25519
cat /tmp/loopia_deploy_ed25519.pub
```

Paste the `.pub` contents into Loopia. Never paste or upload the private key.

## Verify SSH and locate the web root

Replace `SSH_USER` with the username shown in Loopia -> `SSH`.

```bash
ssh -i /tmp/loopia_deploy_ed25519 \
  -o StrictHostKeyChecking=accept-new \
  -o UserKnownHostsFile=/tmp/loopia_known_hosts \
  -o BatchMode=yes \
  SSH_USER@ssh.loopia.se \
  'pwd; find . -maxdepth 2 -type d | sort'
```

Expected relevant directory:

```text
./almostswedish.se/public_html
```

## Deploy `site/` over SSH

Run from repo root:

```bash
set -euo pipefail
SSH_USER='replace-with-loopia-ssh-user'
KEY='/tmp/loopia_deploy_ed25519'
KNOWN_HOSTS='/tmp/loopia_known_hosts'
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SSH_OPTS=(
  -i "$KEY"
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile="$KNOWN_HOSTS"
  -o BatchMode=yes
  -o ConnectTimeout=20
)

# Backup current remote web root before deleting/replacing files.
ssh "${SSH_OPTS[@]}" "$SSH_USER@ssh.loopia.se" \
  "set -e; mkdir -p deploy_backups; tar -czf deploy_backups/public_html-before-$TS.tgz -C almostswedish.se public_html; ls -lh deploy_backups/public_html-before-$TS.tgz"

# Upload exactly the committed static site surface.
rsync -av --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  site/ "$SSH_USER@ssh.loopia.se:almostswedish.se/public_html/"

# Confirm expected files exist remotely.
ssh "${SSH_OPTS[@]}" "$SSH_USER@ssh.loopia.se" \
  "find almostswedish.se/public_html -maxdepth 2 -type f | sort | sed -n '1,80p'; cksum almostswedish.se/public_html/index.html"
```

## Verify production

```bash
for url in https://almostswedish.se/ https://www.almostswedish.se/; do
  echo "=== $url ==="
  curl -L --max-time 20 -sS -D /tmp/almostswedish.headers \
    -o /tmp/almostswedish.html "$url"
  sed -n '1,12p' /tmp/almostswedish.headers
  grep -q 'app.js' /tmp/almostswedish.html && echo 'app.js: present'
  perl -0777 -ne 'if(/<title[^>]*>(.*?)<\/title>/is){$t=$1;$t=~s/\s+/ /g; print "title: $t\n"}' /tmp/almostswedish.html
  wc -c /tmp/almostswedish.html
 done
```

Also open <https://almostswedish.se/> in the in-app browser and confirm the
home page renders (`Almost Swedish`, `Start practising`, chapter list, etc.).

## GitHub Actions option

`.github/workflows/loopia-deploy.yml` can deploy via FTPS when these repository
secrets exist:

- `LOOPIA_FTP_HOST` (usually `ftpcluster.loopia.se`)
- `LOOPIA_FTP_USER`
- `LOOPIA_FTP_PASSWORD`
- `LOOPIA_REMOTE_DIR` (likely `/almostswedish.se/public_html`)

If the current GitHub token cannot set secrets, ask the repo owner to add them
under GitHub -> Settings -> Secrets and variables -> Actions, then run the
workflow manually. Prefer SSH manual deploy when FTP data-channel issues recur.
