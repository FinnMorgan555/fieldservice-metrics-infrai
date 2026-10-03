import assert from "node:assert/strict";
import { decideMetric, workOrderSchema } from "./fieldservice_report.js";

const order = workOrderSchema.parse({ work_order_id: "WO-1", status: "follow_up", technician_id: "tech-2", photo_count: 1, follow_up_required: true });
assert.deepEqual(decideMetric(order), {
  name: "fieldservice.open_followups",
  value: 1,
  tags: { status: "follow_up", technician_id: "tech-2" }
});
console.log("follow-up decision test passed");
