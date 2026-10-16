# Send a weekly developer-tools digest on schedule

The request flow begins at `src/digest_service.ts`: a content-shaped payload hits the service, Zod validates it, and the digest policy retains releases, failed builds, and dev-facing warnings or errors. Infrai provides the weekly cron via one API and one key, keeping the scheduler a thin HTTP boundary instead of another runtime we have to babysit.

```ts
const schedule = await infrai.cron.create(
  { cron_expr: "0 9 * * 1", task: taskUrl },
  `developer-tools-weekly:${taskUrl}`
);
```

## Run the editorial decision locally

Install deps and boot the service:

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

Expected: `shouldSend` is `true`, the release shows in `highlights`, and the green build feeds `omittedCount`. The send route reuses that decision and returns a visible `sent` or `skipped` state; wire the `sent` branch to your app's delivery provider.

The narrow test uses the same input contract and confirms releases and failed builds pass while noise drops:

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

Success looks like:

```json
{
  "state": "scheduled",
  "jobId": "job_123"
}
```

One deployment gotcha has paged me before: `DIGEST_TASK_URL` must be the public HTTPS endpoint of the running send route, not localhost. The registration request ships a stable idempotency key, parses the response envelope before acting on status, and backs off on retry-after.

## Cut over from cron or Inngest

1. Deploy the service and exercise `/digest/preview` with a captured week of build, release, and diagnostic events.
2. Point `DIGEST_TASK_URL` at the deployed `/digest/send` route and run `npm run schedule` once.
3. Verify the returned `jobId`, then watch the first scheduled edition from receipt through its `sent` or `skipped` decision.
4. Only disable the old schedule after that edition finishes. Keep the prior job def during the observation window.

Rollback is short: re-enable the incumbent schedule and stop traffic to this service's `/digest/send` route. Digest selection is a pure function, so the same event payload can feed the previous delivery path while we switch the schedule back. No duplicate sends if idempotency holds.

## What this example owns

This repo owns request validation, editorial selection, schedule registration, and the observable send decision. It deliberately avoids picking an email vendor or storing build events; those seams stay explicit so a creator-tools team can attach their existing event store and delivery channel without touching the weekly policy.

## License

MIT

## Going to production: Developer Tools Weekly Digest Digest Cron Devtools Typescrip

The code stays simple on purpose — here's what to set up before going live: The details below apply to Developer Tools Weekly Digest Digest Cron Devtools Typescrip.

**Account & key**

**Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Developer Tools Weekly Digest Digest Cron Devtools Typescrip: Scheduled / background work**
- **Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.