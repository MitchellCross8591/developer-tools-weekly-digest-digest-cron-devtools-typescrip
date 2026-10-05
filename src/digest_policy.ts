import { z } from "zod";

const buildEvent = z.object({
  type: z.literal("build"),
  project: z.string().min(1),
  status: z.enum(["passed", "failed"]),
  summary: z.string().min(1),
  occurredAt: z.string().datetime()
});

const releaseEvent = z.object({
  type: z.literal("release"),
  project: z.string().min(1),
  version: z.string().min(1),
  summary: z.string().min(1),
  occurredAt: z.string().datetime()
});

const diagnosticEvent = z.object({
  type: z.literal("diagnostic"),
  project: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  summary: z.string().min(1),
  occurredAt: z.string().datetime()
});

export const digestRequestSchema = z.object({
  audience: z.literal("developer-tools"),
  weekEnding: z.string().date(),
  events: z.array(z.discriminatedUnion("type", [buildEvent, releaseEvent, diagnosticEvent])).max(100)
});

export type DigestRequest = z.infer<typeof digestRequestSchema>;
type DigestEvent = DigestRequest["events"][number];

export type DigestDecision = {
  shouldSend: boolean;
  subject: string;
  highlights: string[];
  omittedCount: number;
};

function isHighlight(event: DigestEvent): boolean {
  if (event.type === "release") return true;
  if (event.type === "build") return event.status === "failed";
  return event.severity !== "info";
}

function render(event: DigestEvent): string {
  if (event.type === "release") return `${event.project} ${event.version}: ${event.summary}`;
  if (event.type === "build") return `${event.project} build failed: ${event.summary}`;
  return `${event.project} ${event.severity}: ${event.summary}`;
}

export function decideDigest(input: DigestRequest): DigestDecision {
  const selected = input.events
    .filter(isHighlight)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  const highlights = selected.slice(0, 6).map(render);

  return {
    shouldSend: highlights.length > 0,
    subject: `Developer tools weekly: ${input.weekEnding}`,
    highlights,
    omittedCount: input.events.length - highlights.length
  };
}
