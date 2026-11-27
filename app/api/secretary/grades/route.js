import { authorize } from "../../../../lib/authorization.js";
import { createPendingGradesHandler } from "../../../../lib/gradeReview.js";

export const GET = createPendingGradesHandler(async () => {
  const access = await authorize(["admin", "staff"]);
  return access.response || access.user;
});
