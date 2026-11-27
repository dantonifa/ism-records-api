import { authorize, assignedRecordFilter } from "../../../lib/authorization.js";
import { createAcademicRecordHandlers } from "../../../lib/academicRecords.js";

const handlers = createAcademicRecordHandlers(authorize, assignedRecordFilter);

export const GET = handlers.list;
export const POST = handlers.create;
