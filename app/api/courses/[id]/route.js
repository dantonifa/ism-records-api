import { authorize } from "../../../../lib/authorization.js";
import { createCourseHandlers } from "../../../../lib/courseHandlers.js";

const handlers = createCourseHandlers(authorize);

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.archive;
