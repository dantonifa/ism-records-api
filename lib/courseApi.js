import { apiRequest } from "./apiRequest";

export function courseRequest(path, options = {}) {
  return apiRequest(path, options, "Unable to complete the course request.");
}
