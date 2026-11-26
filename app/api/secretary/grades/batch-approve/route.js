import { authorize } from "../../../../../lib/authorization.js";
import { createBatchApprovalHandler } from "../../../../../lib/gradeReview.js";

export const PUT = createBatchApprovalHandler(async () => {
  const access = await authorize(["admin", "staff"]);
  return access.response || true;
});
