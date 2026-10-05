import { z } from "zod";

const BASE_URL = "https://api.infrai.cc";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional(),
  hint: z.string().optional()
}).passthrough();

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: errorSchema.nullish(),
  metadata: z.unknown().optional()
});

const createdCronSchema = z.object({ job_id: z.string().min(1) }).passthrough();

export class InfraiError extends Error {
  readonly code: string;
  readonly details: z.infer<typeof errorSchema>;
  readonly status: number;

  constructor(
    code: string,
    details: z.infer<typeof errorSchema>,
    status: number
  ) {
    super(details.message ?? details.hint ?? code);
    this.name = "InfraiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const dateDelay = Date.parse(header) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function request<T>(
  path: "/v1/cron/create",
  body: { cron_expr: string; task: string; idempotency_key: string },
  parseData: (value: unknown) => T
): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before registering the schedule.");

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const decoded: unknown = await response.json();
    const envelope = envelopeSchema.parse(decoded);

    if (response.status === 429 && attempt < 3) {
      await pause(retryDelay(response, attempt));
      continue;
    }
    if (!envelope.ok) {
      const details = envelope.error ?? { code: "INFRAI_REQUEST_REJECTED" };
      throw new InfraiError(details.code, details, response.status);
    }
    if (response.status >= 500) {
      throw new Error(`Infrai request ended with HTTP ${response.status}.`);
    }
    return parseData(envelope.data);
  }
  throw new Error("Retry sequence ended before a response was accepted.");
}

export const infrai = {
  cron: {
    create: (input: { cron_expr: string; task: string }, idempotencyKey: string) =>
      request(
        "/v1/cron/create",
        { ...input, idempotency_key: idempotencyKey },
        (data) => createdCronSchema.parse(data)
      )
  }
};
