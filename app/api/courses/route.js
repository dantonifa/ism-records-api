import { authorize } from "../../../lib/authorization.js";
import { createCourseHandlers } from "../../../lib/courseHandlers.js";

const handlers = createCourseHandlers(authorize);

export const GET = handlers.list;
export const POST = handlers.create;
