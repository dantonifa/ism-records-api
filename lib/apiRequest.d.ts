import type { ApiResponse } from "../types/records";

export function apiRequest<T = unknown>(
  path: string,
  options?: RequestInit,
  fallback?: string,
): Promise<ApiResponse<T>>;
