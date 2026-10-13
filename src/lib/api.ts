import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function jsonError(code: string, message: string, status: number, details?: unknown) {
  const body: ApiError = { code, message, ...(details !== undefined ? { details } : {}) };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("VALIDATION_ERROR", "参数校验失败", 422, error.flatten().fieldErrors);
  }
  console.error("[api] unhandled error:", error);
  return jsonError("INTERNAL_ERROR", "服务器内部错误", 500);
}
