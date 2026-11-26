import { apiRequest } from "./apiRequest";

export function courseRequest<T = unknown>(path: string, options: RequestInit = {}) {
  return apiRequest<T>(path, options, "Unable to complete the course request.");
}
