# Convex first-push reproduction

The first push to a new Convex preview deployment fails about half the time if the app has a `"use node"` file. This repo is the smallest app that shows it, and a workflow that pushes it to new previews one at a time.

## Results

From [one run](https://github.com/a-fatah/convex-preview-first-push/actions/runs/41686094551) on 3 November 2026, 17:38 to 18:38 UTC, on a project and team created for this test. It used `convex` 1.45.0, and newer versions weren't tried. The `control-*` pushes delete `convex/probeNode.ts` first, so that file is the only difference.

| Arm | Pushes | Deployed | 408 | 400 | Time when deployed |
| --- | --: | --: | --: | --: | --: |
| `node-*` | 20 | 9 | 8 | 3 | 10 to 20 s |
| `control-*` | 5 | 5 | 0 | 0 | 2 to 3 s |

Both failures come from `POST /api/deploy2/start_push`. The 408 arrives after 300 s. The 400 says:

```
400 Bad Request: InvalidModules: Hit an error while pushing:
Loading the pushed modules encountered the following
    error:
Uncaught Cannot read properties of undefined (reading 'error')
```

Every push, with seconds for the whole command:

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

Order may matter. Node pushes straight after a failed Node push deployed 0 of 6 times, and straight after a control push 4 of 4. The run wasn't designed to test this, and a control also adds about 20 s before the next push, so it can't separate the two.

## The app

An empty schema, one query, and this file:

```ts
"use node";
import { action } from "./_generated/server";

export const hello = action({ args: {}, handler: async () => "ok" });
```

## Run it yourself

1. Fork this repo and enable Actions.
2. Create a new Convex project and generate a key under **Project Settings > Preview Deploy Keys**. A deployment's own deploy keys won't work.
3. Add the key as a repository secret named `CONVEX_DEPLOY_KEY`.
4. Start the **First push** workflow from the Actions tab.

A run takes about an hour and makes 25 previews, which count against your team's deployment limit until they expire. Each push runs:

```sh
timeout -k 10 330 npx convex deploy --yes --typecheck=disable --preview-create <name>
```

Logs on a public fork are public, so the workflow masks your team and project names and never passes `--verbose`.
