---
name: docker-verify-deploy
description: Rebuild the EcoRoute Spring Boot app's Docker image, run it locally against Supabase, verify startup logs and API endpoints are healthy, then automatically commit, push to GitHub, and let Render's auto-deploy pick it up. Use whenever the user wants to rebuild/verify the Docker image, check container logs, confirm the app still connects to Supabase after a code change, or ship a change to Render.
allowed-tools: Bash, Read, Edit, Grep, Glob
---

# Docker Build, Verify & Deploy (EcoRoute backend)

This project's Spring Boot backend (`demo/`) runs on Supabase Postgres and
deploys to Render as a Docker container. This skill rebuilds the image,
proves it actually works (not just that it compiles), and walks the
commit/push/redeploy steps.

## 0. Prerequisites

- Docker Desktop must be running. Check with:
  ```
  docker info >/dev/null 2>&1 && echo ready || echo "not running"
  ```
  If not running, launch it and poll until ready instead of guessing a fixed wait:
  ```
  # PowerShell: Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  until docker info >/dev/null 2>&1; do sleep 5; done
  ```

- These three env vars must be available to pass into the container. They are
  **never** hardcoded into `application.properties`, the Dockerfile, or this
  skill — always sourced from the environment or asked from the user:
  - `SUPABASE_DB_URL` — pooler JDBC URL, e.g.
    `jdbc:postgresql://aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require`
    (must be the **Session pooler** host, not the direct `db.<ref>.supabase.co`
    host — that one is IPv6-only and times out on most networks)
  - `SUPABASE_DB_USER` — pooler-qualified username, e.g. `postgres.<project-ref>`
  - `SUPABASE_DB_PASSWORD` — the Supabase DB password
  - If these aren't already set in the current shell, ask the user rather than
    guessing. A permanently-persisted Windows user env var (`setx` /
    `[Environment]::SetEnvironmentVariable(...,"User")`) does **not** carry into
    an already-running shell — only new shells started after it was set.

## 1. Build the image

Render's build context is the **repo root**, not `demo/`, even though
`demo/Dockerfile` is the Dockerfile path. Always build the same way Render
does, from the repo root:

```
cd <repo-root>
docker build -f demo/Dockerfile -t ecoroute-demo:local .
```

Use `--no-cache` when the goal is a from-scratch confidence check (e.g. before
telling the user "everything works"); a plain cached build is fine for quick
iteration.

**Known pitfall (already fixed in this repo's Dockerfile, but watch for regressions):**
`demo/Dockerfile`'s `COPY` sources are prefixed with `demo/` (e.g.
`COPY demo/src ./src`) specifically because the build context is the repo
root. If someone "simplifies" these back to bare `COPY src ./src`, the Render
build will fail with `"/src": not found` even though it builds fine locally
if you (incorrectly) `cd demo && docker build .` there. Always verify with the
repo-root invocation above, not a `demo/`-context build.

## 2. Run it and capture full logs

```
docker rm -f ecoroute-test >/dev/null 2>&1
docker run -d --name ecoroute-test -p 8081:8080 \
  -e SUPABASE_DB_URL="$SUPABASE_DB_URL" \
  -e SUPABASE_DB_USER="$SUPABASE_DB_USER" \
  -e SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD" \
  ecoroute-demo:local
sleep 15
docker logs ecoroute-test 2>&1
```

**What a healthy log looks like** — confirm all of these appear, in order,
with no exception stack trace in between:
1. `HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection@...`
   (proves it actually reached Supabase, not just that config parsed)
2. `Initialized JPA EntityManagerFactory for persistence unit 'default'`
3. `Tomcat started on port 8080 (http) with context path ''`
4. `Started DemoApplication in ... seconds`

If instead you see `PSQLException: ... SCRAM-based authentication, but no
password was provided` or a `NullPointerException` inside
`JdbcEnvironmentInitiator`/`JdbcIsolationDelegate`, that's the same root cause
either way: `SUPABASE_DB_PASSWORD` was empty when the container started (the
NPE is just Hibernate's confusing wrapper around the same connection
failure). Re-run with the env vars actually populated — don't debug the
Dockerfile for this one.

## 3. Verify real endpoints, not guessed ones

Check the actual `@GetMapping`/`@PostMapping` paths in
`demo/src/main/java/com/ecorouteoptimizer/demo/controller/*.java` before
curling — this app does **not** expose plain collection endpoints like
`GET /api/routes` or `GET /api/vehicles`; those return 404 (or did return a
misleading 500 before the fix in step 5) by design. Known-good real endpoints:

```
curl -s http://127.0.0.1:8081/api/users
curl -s http://127.0.0.1:8081/api/routes/history/1
curl -s http://127.0.0.1:8081/api/vehicles/user/1
```

Confirm the response contains real data (user names, route origins/destinations,
`co2Emitted` values) — not an error JSON — and that an intentionally-unmapped
path returns a proper 404:

```
curl -s -o /dev/null -w "status: %{http_code}\n" http://127.0.0.1:8081/
```
(expect `status: 404`)

## 4. Clean up the test container

```
docker rm -f ecoroute-test >/dev/null 2>&1
```

Don't leave test containers running — each verification run should start
from a clean slate so results aren't contaminated by a stale container.

## 5. Known app-level pitfall: 404s reported as 500

`GlobalExceptionHandler` (`demo/src/main/java/.../exception/GlobalExceptionHandler.java`)
has a catch-all `@ExceptionHandler(Exception.class)` returning 500. Since
Spring Framework 6.1 (Spring Boot 3.2+), an unmatched route throws
`org.springframework.web.servlet.resource.NoResourceFoundException` — a real
exception — instead of silently sending a 404, so the catch-all was
swallowing it into a wrong 500. Already fixed by adding a specific
`@ExceptionHandler(NoResourceFoundException.class)` returning 404. If a
future refactor of this file drops that handler, this regresses silently
(the app still "works", it just misreports 404s as 500s) — the check in
step 3 above is what catches it.

## 6. Once verified, ship it automatically — don't stop and ask

This is the point of this skill: steps 0-4 passing is the gate, not a place
to check back in with the user. As soon as the container proves healthy
(step 2's log signature) and the endpoints respond correctly (step 3), go
straight into commit → push → confirm-deploy without waiting for a
"should I proceed?" — the user invoked this skill precisely so they don't
have to approve each of these steps by hand. Only stop early if step 2 or 3
actually fails (bad logs, wrong data, a real error) — that's a genuine
blocker worth surfacing, not a routine checkpoint.

**Commit — stage explicitly by filename, never `git add -A` / `git add .`:**
This repo often has unrelated in-progress changes sitting in the working
tree (frontend work, IDE files, other worktrees) that must not get swept
into this commit.
```
git add <only the files this task actually touched>
git status   # confirm nothing unintended got staged before committing
git commit -m "..."
```

**Push:**
```
git push origin main
```
A `.git/hooks/pre-push` hook already exists in this repo that runs
`docker build -f demo/Dockerfile .` and aborts the push (non-zero exit) if
it fails — this is the actual "only push when the Docker build has no
errors" gate, and it applies to every push through this hook (yours,
mine, or a manual one), not just this skill's own verification steps above.

If the auto-mode classifier blocks the push itself (it does by default in
this environment — `git push` is treated as a shared-state action requiring
explicit permission, separately from anything the pre-push hook checks),
don't just stop silently: tell the user plainly that the commit is made
locally, give them the exact `git push origin main` command to run (the
hook will still gate it for them the same way), and mention that adding
`"Bash(git push:*)"` to `.claude/settings.local.json`'s permissions.allow
would let future runs of this skill push automatically too. Do **not**
attempt to edit that settings file yourself, even via the `update-config`
skill — granting tool permissions is blocked for the agent the same way
`git push` itself is, and both must come from the user directly.

**Confirm the deploy actually landed, don't just assume it did:**
Render auto-deploys on push to `main` (confirm this is enabled on the
service if it's ever in doubt). After pushing, poll the production URL
rather than declaring victory immediately — a Render deploy typically takes
1-3 minutes:
```
until curl -s -o /dev/null -w "%{http_code}" https://<service>.onrender.com/api/users | grep -q 200; do
  sleep 15
done
curl -s https://<service>.onrender.com/api/users
```
Only report the task complete once this production check actually returns
the expected data — a successful `git push` is not itself confirmation that
the new version is live and healthy.

### Render service settings reference
- **Dockerfile Path** (relative to repo root): `demo/Dockerfile`
- **Root Directory**: leave unset / repo root (build context must stay the
  repo root to match the `COPY demo/...` paths in the Dockerfile — see step 1)
- **Required environment variables** (set in Render's dashboard, never in
  committed files): `SUPABASE_DB_URL`, `SUPABASE_DB_USER`,
  `SUPABASE_DB_PASSWORD`, plus `GOOGLE_MAPS_API_KEY`, `CLIMATIQ_API_KEY`,
  `OPENAI_API_KEY` for full feature coverage. `PORT` is injected by Render
  automatically — don't set it.
