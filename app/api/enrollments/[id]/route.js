import { authorize } from "../../../../lib/authorization.js";
import { createEnrollmentHandlers } from "../../../../lib/enrollmentHandlers.js";

const handlers = createEnrollmentHandlers(authorize);

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.archive;
