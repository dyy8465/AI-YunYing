import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { financeQuerySchema } from "@/lib/validations/finance";
import { exportFinanceCsv } from "@/services/finance.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("finance:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = financeQuerySchema.parse(params);
    const csv = await exportFinanceCsv(query);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="finance-profit-${date}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
