import { authorize } from "../../../../lib/authorization.js";
import { createAccountHandlers } from "../../../../lib/accountHandlers.js";

const handlers = createAccountHandlers(authorize);

export const PUT = handlers.changePassword;
