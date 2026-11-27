import { authorize } from "../../../../../lib/authorization.js";
import { createAcademicHistoryHandler } from "../../../../../lib/academicHistory.js";

export const GET = createAcademicHistoryHandler(authorize);
