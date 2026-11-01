import { getSessionUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return errorResponse("Unauthenticated", "UNAUTHORIZED", 401);
  }
  return successResponse(user);
}
