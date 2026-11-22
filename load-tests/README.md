# Local API performance tests

This opt-in k6 suite measures the public, paginated listing APIs:

- `GET /api/names/swr`
- `GET /api/description/swr`

It exercises page 1 and page 10 in turn, checking response status, pagination shape, page size, and string record IDs. These endpoints count documents and run sorted MongoDB aggregations with lookups, so they are more useful load-test targets than the unbounded `GET /api/names` and `GET /api/description` routes.

## Safety and scope

- Run only against your local Next.js server and a dedicated local MongoDB database.
- The k6 script rejects non-local `BASE_URL` values. It accepts only `http://localhost` or `http://127.0.0.1`.
- The seed utility requires `PERF_TEST_MONGODB_URI` to use local MongoDB and a database name ending in `-perf` or `_perf`.
- Seeding is repeatable and only upserts records with its own prefixes; it never clears a database. Do not point the app at production, shared staging, or the E2E database.
- k6 is an external executable; it is not added as a project dependency. No CI load test is configured because local machine and database capacity affect the results.

## Setup and run (Git Bash on Windows)

Use **Git Bash**, not WSL, so MongoDB, Node.js, and k6 all run in the same Windows environment. In VS Code, open the terminal dropdown next to **+** and select **Git Bash**. To make it the default, use **Terminal: Select Default Profile** from the Command Palette (`Ctrl+Shift+P`).

Install k6 if needed (for example, `choco install k6`), then open a fresh VS Code terminal and verify `k6 version` works. This workflow uses **three terminals**: one stays running for MongoDB, one is reused for seeding and then the app server, and one runs k6.

### Terminal 1 — MongoDB (leave running)

For this machine, use MongoDB **7.0.x** for the local performance database. MongoDB has a reported Windows crash on older CPUs without AVX2/FMA3 after initializing data and restarting: [SERVER-103289](https://jira.mongodb.org/browse/SERVER-103289). This closely matches the reported `0xC000001D` behavior; it is not a bad data-directory path. The current installed executable reports version 8.2.1, despite being in a folder named `8.0`.

MongoDB 7.0 is installed under `D:\Program Files\MongoDB\Server\7.0` on this machine. Verify the executable version:

```bash
"/d/Program Files/MongoDB/Server/7.0/bin/mongod.exe" --version
```

Use a **new, empty** data directory for MongoDB 7.0; it cannot open data files created by MongoDB 8.x. Keep the old `D:\data\perf-db` directory untouched.

```bash
mkdir -p /d/data/perf-db-7
"/d/Program Files/MongoDB/Server/7.0/bin/mongod.exe" --dbpath D:/data/perf-db-7
```

Leave this terminal open. Wait until MongoDB reports **Waiting for connections**. If it says the port is already in use, another MongoDB process/service is running on port `27017`; don't start a second one on that port.

If MongoDB 7.0 also exits with `0xC000001D`, investigate CPU instruction support: MongoDB 5.0+ requires AVX ([MongoDB platform requirements](https://www.mongodb.com/docs/manual/administration/production-notes/#x86_64)). Microsoft's Coreinfo is a separate utility; download it, extract `Coreinfo64.exe` into `~/Downloads/Coreinfo`, and run:

```bash
cd ~/Downloads/Coreinfo
./Coreinfo64.exe -accepteula -f | grep -i AVX
```

In the output, `*` means the feature is present and `-` means absent. If the extracted file is named `Coreinfo.exe` instead, use `./Coreinfo.exe`. Do not delete an existing data directory or lock file to work around a crash.

### Terminal 2 — seed, then app server

First seed the isolated performance database:

```bash
export PERF_TEST_MONGODB_URI="mongodb://127.0.0.1:27017/homeward_tails_perf"
export MONGODB_URI="$PERF_TEST_MONGODB_URI"
export PERF_TEST_RECORDS=1000
pnpm seed:perf
```

You do not need to create the database separately. MongoDB creates it on the seeder's first write. The seeder upserts 1,000 names and 1,000 descriptions by default; `PERF_TEST_RECORDS` can be set from 1 to 10,000 per collection. It does not delete existing documents.

After seeding finishes, keep Terminal 2 open and start the app against the same database:

```bash
export MONGODB_URI="mongodb://127.0.0.1:27017/homeward_tails_perf"
pnpm exec next dev
```

Wait for Next.js to report that it is ready.

### Terminal 3 — smoke check

Run this short test while the app is running. It verifies connection and response checks; it is **not** a performance measurement:

```bash
BASE_URL=http://127.0.0.1:3000 VUS=1 SMOKE=1 pnpm test:perf
```

If it passes, stop the dev server in Terminal 2 with `Ctrl+C`. For meaningful timing results, build and start the app in production mode from Terminal 2:

```bash
export MONGODB_URI="mongodb://127.0.0.1:27017/homeward_tails_perf"
pnpm build
pnpm start
```

Wait for the production server to be ready before running k6 in Terminal 3.

### Terminal 3 — performance runs

Run one measurement at a time:

```bash
BASE_URL=http://127.0.0.1:3000 VUS=10 pnpm test:perf
BASE_URL=http://127.0.0.1:3000 VUS=25 pnpm test:perf
BASE_URL=http://127.0.0.1:3000 VUS=50 pnpm test:perf
```

Each run ramps up for 30 seconds, holds for one minute, then ramps down for 15 seconds. Start low and watch CPU, memory, and MongoDB before increasing load.

### Saving results

To keep the normal terminal summary and save a JSON copy for later comparison, use k6's `--summary-export` option. In Git Bash:

```bash
mkdir -p load-tests/results
BASE_URL=http://127.0.0.1:3000 VUS=10 pnpm exec k6 run \
  --summary-export="load-tests/results/listings-10vus-$(date +%Y%m%d-%H%M%S).json" \
  load-tests/listings.js
```

The timestamp keeps repeated runs from overwriting one another. The summary JSON is saved locally and `load-tests/results/` is gitignored; keep any machine details and observations with the corresponding run when comparing results.

### What to watch while a run is active

Before starting k6, open **Task Manager** (`Ctrl+Shift+Esc`). Under **Performance**, note the CPU and memory graphs. Under **Details**, find `node.exe` (Next.js), `mongod.exe` (MongoDB), and `k6.exe`; use the CPU and Memory columns to see which process is consuming resources. Check again during and after each run. You can also open **Resource Monitor** from Task Manager's Performance page for more detailed per-process CPU and memory views.

For MongoDB activity, use an optional fourth Git Bash terminal:

```bash
mongostat "mongodb://127.0.0.1:27017/homeward_tails_perf" 1
```

It prints server activity approximately once per second; press `Ctrl+C` to stop it. To see activity by collection instead, use `mongotop` with the same URI and interval:

```bash
mongotop "mongodb://127.0.0.1:27017/homeward_tails_perf" 1
```

k6 prints request rate, latency percentiles, HTTP failures, and whether thresholds passed when the run ends. Record those alongside the observed machine/process usage for each VU level. If CPU is near fully utilized or memory pressure rises, pause before increasing VUs: the local machine may be the bottleneck, so higher load would not tell you much about the API or MongoDB alone.

## PowerShell alternative

The Git Bash steps above avoid needing to start MongoDB as a Windows service. If you prefer PowerShell, run MongoDB 7.0 directly in Terminal 1 using the same new `perf-db-7` directory:

```powershell
New-Item -ItemType Directory -Force D:\data\perf-db-7
& "D:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath D:\data\perf-db-7
```

Leave that process running. Use **three terminals** here as well: Terminal 1 runs MongoDB, Terminal 2 runs the seeder then the app, and Terminal 3 runs k6. In Terminal 2, seed:

```powershell
$env:PERF_TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/homeward_tails_perf"
$env:MONGODB_URI = $env:PERF_TEST_MONGODB_URI
$env:PERF_TEST_RECORDS = "1000"
pnpm seed:perf
```

After seeding, run `pnpm exec next dev` in Terminal 2 with `MONGODB_URI` set to the same URI. In Terminal 3, run the smoke test with `$env:BASE_URL = "http://127.0.0.1:3000"; $env:VUS = "1"; $env:SMOKE = "1"; pnpm test:perf`. For production measurements, stop the dev server, run `pnpm build` then `pnpm start` in Terminal 2, and use `$env:VUS = "10"; pnpm test:perf` (repeat with 25 and 50) in Terminal 3.

To save a timestamped summary while keeping it visible in the terminal:

```powershell
New-Item -ItemType Directory -Force load-tests/results
$stamp = Get-Date -Format yyyyMMdd-HHmmss
$env:BASE_URL = "http://127.0.0.1:3000"
$env:VUS = "10"
pnpm exec k6 run "--summary-export=load-tests/results/listings-10vus-$stamp.json" load-tests/listings.js
```

In PowerShell, `$env:NAME = "value"` sets a variable for that terminal session. In Git Bash, use `export NAME=value`; prefixing a single command (`VUS=10 pnpm test:perf`) sets it only for that command.

## Checks and initial thresholds

Each iteration sends a request to each listing API. The requested page alternates between page 1 and page 10. The script checks:

- HTTP status is 200.
- The response includes the pagination fields and a `data` array.
- The requested page is returned, with 1–50 records.
- The first record has a string `_id` and no `__v`.
- Overall checks pass at least 99% of the time and failed HTTP requests stay below 1%.
- Each endpoint's p95 HTTP latency is below 500 ms.

These are initial local targets, not claims about production capacity. A threshold failure should be reported as a result, not hidden by changing the value after a run. Revisit the target only after capturing repeatable baselines and explaining the reason.

## Test-case traceability

Keep these IDs stable so the cases can be linked or imported into a test-management tool later. The table maps the performance checks to existing functional API coverage where the intent overlaps; the k6 runs add load behavior and are not replacements for Playwright.

| Case ID        | Scenario                                                             | Automation/reference |
| -------------- | -------------------------------------------------------------------- | -------------------- |
| `API-LIST-001` | Names listing returns string `_id` values without `__v`              | `e2e/browse.spec.ts` |
| `API-LIST-002` | Descriptions listing returns string `_id` values without `__v`       | `e2e/browse.spec.ts` |
| `PERF-API-001` | Names API page 1 responds with valid listing data under load         | `listings.js`        |
| `PERF-API-002` | Names API page 10 responds with valid listing data under load        | `listings.js`        |
| `PERF-API-003` | Descriptions API page 1 responds with valid listing data under load  | `listings.js`        |
| `PERF-API-004` | Descriptions API page 10 responds with valid listing data under load | `listings.js`        |

The current suite does not install Kiwi TCMS or make Docker a project prerequisite. If Kiwi is added later, keep it in a separate local Docker Compose stack and link executions to these IDs rather than copying the automated tests into a second source of truth. Record a genuine observed failure or a clearly identified known issue in a future test run; do not manufacture a failure just to populate the report.

## Recorded baseline — 2026-11-22

These are reported results from production-build runs ramping to each target VU count. k6's figures cover the full run, including ramp-up and ramp-down; they are not steady-state-only measurements.

| Target VUs | Names p95 | Descriptions p95 | Overall median | Requests/sec | Failed requests | Checks passed | Thresholds |
| ---------- | --------- | ---------------- | -------------- | ------------ | --------------- | ------------- | ---------- |
| 10         | 48 ms     | 45 ms            | 31 ms          | 14.8         | 0               | 100%          | Pass       |
| 25         | 44 ms     | 44 ms            | 29 ms          | 37.0         | 0               | 100%          | Pass       |
| 50         | 60 ms     | 58 ms            | 34 ms          | 73.4         | 0               | 100%          | Pass       |
| 75         | 154 ms    | 156 ms           | 48 ms          | 103.9        | 0               | 100%          | Pass       |
| 100        | 395 ms    | 393 ms           | 163 ms         | 115.4        | 0               | 100%          | Pass       |

### Environment and observations

- The runs used a Windows machine with an AMD FX-8350 (8 logical processors) and 24 GB of RAM. MongoDB was 7.0.x. k6, Next.js, MongoDB, and VS Code shared the machine.
- Exact Node.js and k6 versions, the commit used for the runs, and per-run CPU/memory measurements were not recorded. Do not infer or present them as known.
- During the reported 100-VU run, total CPU was about 89% in Task Manager and 93% in Resource Monitor. Process CPU readings also varied slightly by tool: `mongod.exe` about 38–42%, `node.exe` about 10–11%, and `k6.exe` about 1–3%. VS Code also used CPU (the busiest `Code.exe` process was about 12–14%).
- Memory was about 11.8 of 24 GB and remained flat; disk activity on D: was reported at 0%.

The measurements show a latency knee between 50 and 75 target VUs: both endpoint p95 values were at or below 60 ms through 50, then rose to about 155 ms at 75 and about 394 ms at 100. Throughput rose from 103.9 to 115.4 requests/sec between 75 and 100 VUs (about 11%), while p95 latency rose about 2.5 times. There were no failed requests, every check passed, and all thresholds passed.

CPU readings near 90% during the 100-VU run suggest the shared test machine was close to saturation. MongoDB was the largest of the named processes, but these observations do not prove that the database query itself is the root cause; VS Code and the single-machine setup also affect the result. Memory and disk did not appear constrained in the captured readings. Treat this as a local capacity observation, not a production-capacity claim.

The script sleeps for one second per iteration, and k6's reported metrics include the ramp phases. Describe these as runs **ramping to** a target VU count, not measurements at a constant user count. The configured maximum remains 100 VUs.

## Recording and analyzing future results

For future runs, record:

| Field                               | Value |
| ----------------------------------- | ----- |
| Date and commit                     |       |
| OS / CPU / memory                   |       |
| Node.js, k6, and MongoDB versions   |       |
| MongoDB local configuration         |       |
| Seeded names / descriptions         |       |
| VUs and duration                    |       |
| Endpoint                            |       |
| Requests/sec and request count      |       |
| p50 / p95 / p99 latency             |       |
| HTTP failure rate and check rate    |       |
| Threshold outcome                   |       |
| Observations / suspected bottleneck |       |

Compare runs only when the machine, server mode, MongoDB configuration, and data size are held constant. A local result describes that setup; it is not a production-capacity claim. If a bottleneck is found, make and document one focused change, then rerun the same workload and compare before/after metrics.
