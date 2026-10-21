# Scheduled Run Heartbeat

**GitHub tells you a scheduled run failed. It cannot tell you a run never happened.**

That is the gap this action fills. One step at the top of your job, and your monitor
hears from every run: when it started, when it finished, and whether it failed.

```yaml
- uses: gabriel-dohotaru/cronjobpro-heartbeat-action@v1
  with:
    url: ${{ secrets.HEARTBEAT_URL }}
    status: ${{ job.status }}
```

That is the whole setup. Put it first in the job. You do not add anything at the end.

## Why a scheduled workflow goes quiet

A run that fails is loud: you get the red X and the email. A run that never happens is
silent, and it is the more common way scheduled work rots.

- **GitHub disables scheduled workflows after 60 days** without repository activity. Your
  nightly backup stops on its own, and nothing tells you.
- **`schedule:` is best effort.** Under load, runs are delayed, and during busy periods
  they are dropped outright. A dropped run leaves no record to alert on.
- **The repository changes underneath it.** Archived, billing lapsed, default branch
  renamed, workflow file moved. The schedule simply stops firing.

In all three cases GitHub is behaving as documented, your dashboard is green, and the
work is not being done. A heartbeat catches this because it watches for the absence of a
signal, which is something no amount of logging inside the job can do.

## What it sends

| When | Request | What the monitor learns |
|---|---|---|
| Job starts | `POST <url>/start` | the run began, and the clock is running |
| Job succeeds | `POST <url>` | the run finished, and how long it took |
| Job fails or is cancelled | `POST <url>/fail` | the run finished badly |

Start and finish together are what make duration and overrun visible, so you can also be
told when a job that normally takes two minutes is still going after twenty.

## Works with whatever you already use

The contract is the one Healthchecks established, and several services implement it. Pass
a full `url` and the action does not care who is on the other end.

```yaml
# CronJobPro
url: https://api.cronjobpro.com/ping/<token>
# Healthchecks.io
url: https://hc-ping.com/<uuid>
# anything else speaking the same contract
```

If you use CronJobPro you can pass the token on its own instead:

```yaml
with:
  token: ${{ secrets.CRONJOBPRO_TOKEN }}
  status: ${{ job.status }}
```

## Inputs

| Input | Default | Notes |
|---|---|---|
| `url` | | Full ping URL. Use this or `token`. |
| `token` | | CronJobPro token, when you would rather not paste a URL. |
| `server` | `https://api.cronjobpro.com` | Base URL, used with `token`. |
| `status` | | Pass `${{ job.status }}`. See the warning below. |
| `ping-start` | `true` | Signal the start as well as the finish. |
| `timeout-ms` | `10000` | How long to wait for the endpoint. |
| `retries` | `2` | Retries per ping, with backoff. |

**About `status`.** Without it the action reports every run as a success, and prints a
warning saying so. It cannot read the job outcome on its own: GitHub exposes no
environment variable for it. Pass `${{ job.status }}` and failures are reported properly.

## How it reports failure from a single step

The action does its reporting from a `post` step, which GitHub runs at the end of the job
whether the job passed, failed, or was cancelled. The part that makes this work is that
GitHub re-evaluates the step's inputs when the post step runs, rather than freezing them
when the main step ran.

Verified on a real runner rather than taken on faith. In a job that fails, the main step
reads `status` as `success` and the post step reads the same input as `failure`. State
saved during the main step stays at `success`, which is why this action does not use it.

That is the reason you only need one step, at the top, instead of a `curl` at the bottom
guarded by `if: always()` that still misses cancellations.

## It will not break your build

Every network failure is logged and swallowed. A monitoring helper that fails your
pipeline is worse than no monitoring helper. The only thing that stops the job is a
missing `url` and `token`, which is a configuration mistake worth seeing immediately.

Your token never reaches the log: ping URLs are redacted before anything is printed.

## No dependencies

Plain Node 20, no bundled `dist/`, nothing to audit but the four short files in `src/`.
Tests run with `node --test`.

## Getting a URL

Create a heartbeat monitor and copy its ping URL. On
[CronJobPro](https://cronjobpro.com/heartbeat-monitoring) that is a heartbeat monitor; on
other services it is whatever they call the same thing. Store it as a repository secret,
since anyone holding the URL can report on your behalf.

## License

MIT.
