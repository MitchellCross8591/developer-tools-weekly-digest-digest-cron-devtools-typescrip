import assert from "node:assert/strict";
import test from "node:test";
import { decideDigest, digestRequestSchema } from "../src/digest_policy.js";

test("keeps releases and actionable diagnostics while dropping routine build noise", () => {
  const input = digestRequestSchema.parse({
    audience: "developer-tools",
    weekEnding: "2026-09-04",
    events: [
      { type: "build", project: "docs", status: "passed", summary: "Main branch is green", occurredAt: "2026-09-04T08:00:00.000Z" },
      { type: "diagnostic", project: "cli", severity: "info", summary: "Cache warmed", occurredAt: "2026-09-03T08:00:00.000Z" },
      { type: "release", project: "studio", version: "2.4.0", summary: "Added timeline markers", occurredAt: "2026-09-02T08:00:00.000Z" },
      { type: "build", project: "renderer", status: "failed", summary: "Snapshot mismatch", occurredAt: "2026-09-01T08:00:00.000Z" }
    ]
  });

  assert.deepEqual(decideDigest(input), {
    shouldSend: true,
    subject: "Developer tools weekly: 2026-09-04",
    highlights: [
      "studio 2.4.0: Added timeline markers",
      "renderer build failed: Snapshot mismatch"
    ],
    omittedCount: 2
  });
});
