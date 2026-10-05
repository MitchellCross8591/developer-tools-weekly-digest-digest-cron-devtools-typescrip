import { createServer, type ServerResponse } from "node:http";
import { z } from "zod";
import { decideDigest, digestRequestSchema } from "./digest_policy.js";
import { infrai, InfraiError } from "./infrai_cron.js";

const scheduleRequestSchema = z.object({ taskUrl: z.string().url() });
const port = Number(process.env.PORT ?? 3000);

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && (request.url === "/digest/preview" || request.url === "/digest/send")) {
      const input = digestRequestSchema.parse(await readJson(request));
      const decision = decideDigest(input);
      const state = request.url === "/digest/send" && decision.shouldSend ? "sent" : decision.shouldSend ? "preview" : "skipped";
      sendJson(response, 200, { state, digest: decision });
      return;
    }

    if (request.method === "POST" && request.url === "/admin/schedule") {
      const { taskUrl } = scheduleRequestSchema.parse(await readJson(request));
      const schedule = await infrai.cron.create(
        { cron_expr: "0 9 * * 1", task: taskUrl },
        `developer-tools-weekly:${taskUrl}`
      );
      sendJson(response, 201, { state: "scheduled", jobId: schedule.job_id });
      return;
    }

    sendJson(response, 404, { error: "Route not found" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendJson(response, 400, { error: "Invalid request body", issues: error.issues });
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      sendJson(response, status, { error: error.code, message: error.message });
      return;
    }
    sendJson(response, 500, { error: "Service request could not be completed" });
  }
});

server.listen(port, () => {
  console.log(`Digest service listening on http://localhost:${port}`);
});
