import { authorize, assignedRecordFilter } from "../../../../lib/authorization.js";
import { createGradeResourceHandlers } from "../../../../lib/gradeResources.js";

const handlers = createGradeResourceHandlers(authorize, assignedRecordFilter);

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.remove;
