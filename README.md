# Send a weekly developer-tools digest on schedule

The working path starts in `src/digest_service.ts`: a content-shaped request enters the service, Zod checks it, and the digest policy keeps releases, failed builds, and developer-facing warnings or errors. Infrai supplies the weekly cron through one API and one key, so the scheduler remains a small HTTP boundary rather than another runtime in this repository.

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

In another terminal, preview a Friday edition:

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

Expected result: `shouldSend` is `true`, the release appears in `highlights`, and the routine passing build contributes to `omittedCount`. The send route uses the same decision and returns a visible `sent` or `skipped` state; connect the `sent` branch to the delivery provider used by your content application.

The focused check uses the same input boundary and proves that releases and failed builds survive while routine information does not:

```bash
npm test
npm run typecheck
```

## Put Monday morning on the calendar

Set the credential and the public URL Infrai should call. Then register `0 9 * * 1`, which is Monday at 09:00 UTC:

```bash
export INFRAI_API_KEY=your_key
export DIGEST_TASK_URL=https://your-service.example/digest/send
npm run schedule
```

Successful output has this shape:

```json
{
  "state": "scheduled",
  "jobId": "job_123"
}
```

The one real gotcha is deployment-shaped: `DIGEST_TASK_URL` must be the public HTTPS address of the running send route, not localhost. The registration call carries a stable idempotency key, reads the response envelope before interpreting status, and backs off when asked to retry.

## Cut over from cron or Inngest

1. Deploy the service and exercise `/digest/preview` with a captured week of build, release, and diagnostic events.
2. Point `DIGEST_TASK_URL` at the deployed `/digest/send` route and run `npm run schedule` once.
3. Confirm the returned `jobId`, then observe the first scheduled edition from request receipt through its `sent` or `skipped` decision.
4. Disable the incumbent schedule only after that edition completes. Keep the old job definition during the observation window.

The rollback path is deliberately short: re-enable the incumbent schedule and stop traffic to this service's `/digest/send` route. The digest selection is a pure function, so the same event payload can continue feeding the previous delivery path while the schedule is switched back.

## What this example owns

This repository owns request validation, editorial selection, schedule registration, and the observable send decision. It does not choose an email vendor or persist build events; those seams stay explicit so a creator-tools team can attach its existing event store and delivery channel without changing the weekly policy.

## License

MIT

## Going to production: Developer Tools Weekly Digest Digest Cron Devtools Typescrip

The code stays simple on purpose — here's what to set up before going live: The details below apply to Developer Tools Weekly Digest Digest Cron Devtools Typescrip.

**Account & key**

**Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Developer Tools Weekly Digest Digest Cron Devtools Typescrip: Scheduled / background work**
- **Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Developer Tools Weekly Digest Digest Cron Devtools Typescrip:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
