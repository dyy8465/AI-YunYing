import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { financeQuerySchema } from "@/lib/validations/finance";
import { getFinanceOverview } from "@/services/finance.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("finance:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = financeQuerySchema.parse(params);
    return NextResponse.json(await getFinanceOverview(query));
  } catch (error) {
    return handleApiError(error);
  }
}
