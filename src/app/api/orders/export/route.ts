import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { orderQuerySchema } from "@/lib/validations/order";
import { exportOrdersCsv } from "@/services/order.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("orders:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    delete params.page; // 导出忽略分页，导出当前筛选下的全部（上限 1000）
    const query = orderQuerySchema.parse(params);
    const csv = await exportOrdersCsv(query);
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
