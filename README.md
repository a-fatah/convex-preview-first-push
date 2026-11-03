# Convex first-push reproduction

Does the first push to a new Convex preview deployment fail when the push contains a `"use node"` file?

**Yes, about half the time.** On a Convex project and team created for this test, 11 of 20 first pushes with the file failed, and none of the 5 without it.

This repository holds the smallest app that tests it, and a workflow that pushes that app to new preview deployments, one at a time, and records what happened to each push.

## Results

These come from [run 41686094551](https://github.com/a-fatah/convex-preview-first-push/actions/runs/41686094551) on 3 November 2026, 17:38 to 18:38 UTC, with `convex` 1.45.0. Each job's log holds the full output of its push. The run shows as failed because a job goes red when its push didn't deploy.

| Arm | Pushes | Deployed | `408` | `400 InvalidModules` | Time when deployed |
| --- | --: | --: | --: | --: | --: |
| `node-*`, with `convex/probeNode.ts` | 20 | 9 | 8 | 3 | 10 to 20 s |
| `control-*`, without it | 5 | 5 | 0 | 0 | 2 to 3 s |

Both failures come back from the same request. The `408` came with the whole command at 301 to 304 s:

```
✖ Error fetching POST  https://intent-peccary-174.convex.cloud/api/deploy2/start_push 408 Request Timeout
```

The `400` came with the whole command at 116 to 292 s. Nothing in the app's own code reads `.error`:

```
✖ Error fetching POST  https://modest-lemming-996.convex.cloud/api/deploy2/start_push 400 Bad Request: InvalidModules: Hit an error while pushing:
Loading the pushed modules encountered the following
    error:
Uncaught Cannot read properties of undefined (reading 'error')
```

### Every push

Each preview is named `r1a1-` plus the push's name. Seconds cover the whole `convex deploy` command. A failed deployment stays available to inspect until its preview expires.

| # | Push | Deployment | Outcome | Seconds | Started (UTC) |
| --: | --- | --- | --- | --: | --- |
| 1 | `node-01` | `astute-grouse-728` | deployed | 19 | 17:38:04 |
| 2 | `node-02` | `precise-gazelle-52` | deployed | 15 | 17:38:35 |
| 3 | `node-03` | `intent-peccary-174` | 408 | 302 | 17:39:05 |
| 4 | `node-04` | `modest-lemming-996` | 400-InvalidModules | 164 | 17:44:28 |
| 5 | `control-01` | `different-pika-429` | deployed | 3 | 17:47:26 |
| 6 | `node-05` | `brave-swordfish-36` | deployed | 11 | 17:47:46 |
| 7 | `node-06` | `chatty-crocodile-0` | 408 | 302 | 17:48:18 |
| 8 | `node-07` | `merry-corgi-908` | 408 | 302 | 17:53:37 |
| 9 | `node-08` | `good-crab-762` | 400-InvalidModules | 116 | 17:58:54 |
| 10 | `control-02` | `groovy-porcupine-805` | deployed | 3 | 18:01:04 |
| 11 | `node-09` | `hardy-ox-6` | deployed | 10 | 18:01:30 |
| 12 | `node-10` | `groovy-bullfrog-465` | 408 | 302 | 18:02:05 |
| 13 | `node-11` | `sensible-koala-651` | 408 | 302 | 18:07:29 |
| 14 | `node-12` | `perfect-dogfish-507` | 408 | 302 | 18:12:53 |
| 15 | `control-03` | `grandiose-vole-940` | deployed | 2 | 18:18:16 |
| 16 | `node-13` | `precious-labrador-762` | deployed | 14 | 18:18:31 |
| 17 | `node-14` | `wonderful-fox-546` | deployed | 16 | 18:19:01 |
| 18 | `node-15` | `good-badger-72` | 400-InvalidModules | 292 | 18:19:33 |
| 19 | `node-16` | `opulent-wren-464` | 408 | 304 | 18:24:56 |
| 20 | `control-04` | `aware-starfish-423` | deployed | 2 | 18:30:28 |
| 21 | `node-17` | `dynamic-tapir-803` | deployed | 19 | 18:30:45 |
| 22 | `node-18` | `ceaseless-sockeye-853` | deployed | 20 | 18:31:20 |
| 23 | `node-19` | `accomplished-orca-291` | deployed | 17 | 18:32:15 |
| 24 | `node-20` | `steady-stork-710` | 408 | 301 | 18:32:55 |
| 25 | `control-05` | `blessed-buffalo-468` | deployed | 2 | 18:38:19 |

### What this run doesn't show

- It's one run, in one hour, on one project.
- Five controls is a small sample. If the file made no difference, all five would still have deployed about 4% of the time (Fisher's exact test, one-sided).
- It only uses `convex` 1.45.0. The latest version, 1.49.0, wasn't tried.

### Order may matter

The run wasn't designed to test this, and the pattern was only noticed afterwards, so treat it as a lead.

| What came directly before a `node-*` push | Pushes | Deployed |
| --- | --: | --: |
| Nothing, or a `control-*` push | 5 | 5 |
| A `node-*` push that deployed | 9 | 4 |
| A `node-*` push that failed | 6 | 0 |

Every push went to a different deployment. A control push also leaves more time before the next Node push. After a failed push, the next Node push started 34 to 45 s later when a control sat in between, and 15 to 31 s later when none did. So this run can't separate the control push from the extra wait.

## The app

| File | What it is |
| --- | --- |
| `package.json` | Pins `convex` to 1.45.0 |
| `convex/convex.config.ts` | `defineApp()` |
| `convex/schema.ts` | `defineSchema({})` |
| `convex/probePing.ts` | One query |
| `convex/probeNode.ts` | `"use node";` and one action that returns `"ok"` |

There are two arms. `node-*` pushes the app as it is. `control-*` deletes `convex/probeNode.ts` first, so that file is the only difference between them.

## The workflow

[`first-push.yml`](.github/workflows/first-push.yml) runs this once per push, under a new preview name each time, so a failed deployment stays available to inspect until it expires:

```sh
timeout -k 10 330 npx convex deploy --yes --typecheck=disable --preview-create <name>
```

- Pushes run one at a time, with the arms interleaved.
- `timeout` only stops a command that hangs for good. It sits above Convex's own 300 s limit, so a stalled push shows its real `408`.
- Each push prints one line with its preview name, deployment, outcome, seconds and UTC start time. The line starts with `RESULT` in the job's log and also appears on the run's summary page.
- A job goes red when its push didn't deploy.
- The workflow only runs when started by hand, so the deploy key is never offered to a fork or a pull request.
- It never passes `--verbose`, because verbose logs can hold admin keys and these logs are public.
- It masks the team and project names in the logs. Deployment names stay visible, so Convex can look them up.

## Run it yourself

1. Fork this repository and enable Actions on the fork.
2. Create a new Convex project. In its **Project Settings**, generate a key under **Preview Deploy Keys**. A deployment's own **Deploy Keys** are a different kind of key, and `--preview-create` refuses them.
3. Add the key to the fork as a repository secret named `CONVEX_DEPLOY_KEY`.
4. Start the **First push** workflow from the Actions tab.

One run takes about an hour and makes 25 preview deployments. Each one counts against your team's deployment limit until it expires.
