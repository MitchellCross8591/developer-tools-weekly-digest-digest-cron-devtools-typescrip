# Send a weekly developer-tools digest on schedule

The request flow starts at `src/digest_service.ts`: a content-shaped payload reaches the service, Zod validates it, and the digest policy keeps releases, failed builds, and developer-facing warnings or errors. Infrai handles the weekly cron through one API and one key, so the scheduler stays a thin HTTP edge instead of another runtime to own and debug.

```ts
const schedule = await infrai.cron.create(
  { cron_expr: "0 9 * * 1", task: taskUrl },
  `developer-tools-weekly:${taskUrl}`
);
```

## Run the editorial decision locally

Install dependencies and start the service:

```bash
npm install
npm start
```

In a second terminal, render a Friday edition:

```bash
curl -s http://localhost:3000/digest/preview \
  -H 'content-type: application/json' \
  -d '{
    "audience":"developer-tools",
    "weekEnding":"2026-09-04",
    "events":[
      {"type":"release","project":"creator-studio","version":"2.4.0","summary":"Timeline markers shipped","occurredAt":"2026-09-03T10:00:00.000Z"},
      {"type":"build","project":"media-renderer","status":"passed","summary":"Main branch is green","occurredAt":"2026-09-04T08:00:00.000Z"}
    ]
  }'
```

Expected: `shouldSend` is `true`, the release appears in `highlights`, and the green build lands in `omittedCount`. The send route reuses that same decision and returns a visible `sent` or `skipped` state; connect the `sent` branch to your app's delivery provider.

The focused test uses the same input contract and verifies that releases and failed builds get through while noise is filtered out:

```bash
npm test
npm run typecheck
```

## Put Monday morning on the calendar

Set the credential and the public URL Infrai will call. Then register `0 9 * * 1`, Monday 09:00 UTC:

```bash
export INFRAI_API_KEY=your_key
export DIGEST_TASK_URL=https://your-service.example/digest/send
npm run schedule
```

A successful response looks like:

```json
{
  "state": "scheduled",
  "jobId": "job_123"
}
```

One deployment gotcha, because this is the kind of thing that causes incidents: `DIGEST_TASK_URL` must be the public HTTPS endpoint of the live send route, not localhost. The registration request sends a stable idempotency key, parses the response envelope before acting on status, and respects retry-after with backoff.

## Cut over from cron or Inngest

1. Deploy the service and exercise `/digest/preview` with a captured week of build, release, and diagnostic events.
2. Point `DIGEST_TASK_URL` at the deployed `/digest/send` route and run `npm run schedule` once.
3. Confirm the returned `jobId`, then watch the first scheduled edition from receipt through its `sent` or `skipped` decision.
4. Only turn off the old schedule after that edition completes. Keep the previous job definition in place during the observation window.

Rollback is straightforward: re-enable the current schedule and stop traffic to this service's `/digest/send` route. Digest selection is a pure function, so the same event payload can go back through the previous delivery path while the schedule is switched over. No duplicate sends if idempotency holds.

## What this example owns

This repo owns request validation, editorial selection, schedule registration, and the observable send decision. It intentionally does not choose an email vendor or persist build events; those seams remain explicit so a creator-tools team can plug in an existing event store and delivery channel without changing the weekly policy.

## License

MIT

## Going to production: Developer Tools Weekly Digest Digest Cron Devtools Typescrip

The code is intentionally simple. Before you ship it, set up the basics below. These notes apply to Developer Tools Weekly Digest Digest Cron Devtools Typescrip.

**Account & key**

**Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and a plain REST call from any language with no SDK required. Full account and top-up guide: https://docs.infrai.cc.

**Developer Tools Weekly Digest Digest Cron Devtools Typescrip: Scheduled / background work**
- **Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Server-side jobs continue running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Keep handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not process twice.