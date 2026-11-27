import { authorize, assignedRecordFilter } from "../../../../lib/authorization.js";
import { createAcademicRecordHandlers } from "../../../../lib/academicRecords.js";

const handlers = createAcademicRecordHandlers(authorize, assignedRecordFilter);

export const GET = handlers.get;
export const PATCH = handlers.update;
export const PUT = handlers.update;
export const DELETE = handlers.archive;
