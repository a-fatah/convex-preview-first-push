# Convex first-push reproduction

Does the first push to a new Convex preview deployment fail when the push contains a `"use node"` file?

This repository holds the smallest app that tests it, and a workflow that pushes that app to new preview deployments, one at a time, and records what happened to each push.

## Results

No runs yet.

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
2. Create a new Convex project and generate a preview deploy key in its settings.
3. Add the key to the fork as a repository secret named `CONVEX_DEPLOY_KEY`.
4. Start the **First push** workflow from the Actions tab.

One run makes 25 preview deployments. Each one counts against your team's deployment limit until it expires.
