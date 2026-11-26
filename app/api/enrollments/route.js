import { authorize } from "../../../lib/authorization.js";
import { createEnrollmentHandlers } from "../../../lib/enrollmentHandlers.js";

const handlers = createEnrollmentHandlers(authorize);

export const GET = handlers.list;
export const POST = handlers.create;
