import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  const requestId = "req_" + Math.random().toString(36).substring(2, 10);
  return NextResponse.json(
    {
      data,
      error: null,
      request_id: requestId,
    },
    { status }
  );
}

export function errorResponse(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: any
): NextResponse<ApiResponse<null>> {
  const requestId = "req_" + Math.random().toString(36).substring(2, 10);
  return NextResponse.json(
    {
      data: null,
      error: {
        code,
        message,
        details,
      },
      request_id: requestId,
    },
    { status }
  );
}
