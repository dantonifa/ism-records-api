import { createGradeReviewHandler } from "../../../../../../lib/gradeReview.js";
import { authorize } from "../../../../../../lib/authorization.js";

export const PUT = createGradeReviewHandler("reject", async () => {
  const access = await authorize(["admin", "staff"]);
  return access.response || true;
});
