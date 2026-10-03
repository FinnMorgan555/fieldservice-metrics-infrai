import { z } from "zod";
import { account, metrics } from "./infrai_client.js";

export const workOrderSchema = z.object({
  work_order_id: z.string().min(1),
  status: z.enum(["dispatched", "completed", "follow_up"]),
  technician_id: z.string().min(1),
  photo_count: z.number().int().nonnegative(),
  follow_up_required: z.boolean()
});
export type WorkOrder = z.infer<typeof workOrderSchema>;

export function decideMetric(order: WorkOrder): { name: string; value: number; tags: Record<string, string> } {
  const name = order.status === "completed" ? "fieldservice.completed_orders" : "fieldservice.open_followups";
  const value = order.status === "completed" ? 1 : order.follow_up_required ? 1 : 0;
  return { name, value, tags: { status: order.status, technician_id: order.technician_id } };
}

export async function reportWorkOrder(input: unknown): Promise<{ business: unknown; spend: unknown }> {
  const order = workOrderSchema.parse(input);
  const metric = decideMetric(order);
  const business = await metrics.report({ name: metric.name, value: metric.value, type: "counter", tags: metric.tags });
  const today = new Date().toISOString().slice(0, 10);
  const spend = await account.usageTimeseries(today, today);
  return { business, spend };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { work_order_id: "WO-1042", status: "completed", technician_id: "tech-7", photo_count: 3, follow_up_required: false };
  reportWorkOrder(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
