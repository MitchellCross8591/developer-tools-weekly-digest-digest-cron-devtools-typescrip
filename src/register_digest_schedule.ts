import { z } from "zod";
import { infrai } from "./infrai_cron.js";

const environmentSchema = z.object({
  DIGEST_TASK_URL: z.string().url()
});

const { DIGEST_TASK_URL } = environmentSchema.parse(process.env);
const result = await infrai.cron.create(
  { cron_expr: "0 9 * * 1", task: DIGEST_TASK_URL },
  `developer-tools-weekly:${DIGEST_TASK_URL}`
);

console.log(JSON.stringify({ state: "scheduled", jobId: result.job_id }, null, 2));
