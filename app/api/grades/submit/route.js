import { createGradeSubmissionHandler } from "../../../../lib/submitGrade.js";
import { authorize } from "../../../../lib/authorization.js";

export const POST = createGradeSubmissionHandler(authorize);
