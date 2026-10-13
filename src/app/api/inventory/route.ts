import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { inventoryQuerySchema } from "@/lib/validations/inventory";
import { getInventories } from "@/services/inventory.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("inventory:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = inventoryQuerySchema.parse(params);
    return NextResponse.json(await getInventories(query));
  } catch (error) {
    return handleApiError(error);
  }
}
