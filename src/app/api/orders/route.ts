import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { orderQuerySchema } from "@/lib/validations/order";
import { getOrders } from "@/services/order.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("orders:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = orderQuerySchema.parse(params);
    return NextResponse.json(await getOrders(query));
  } catch (error) {
    return handleApiError(error);
  }
}
