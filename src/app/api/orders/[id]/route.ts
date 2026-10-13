import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { transitionOrderSchema } from "@/lib/validations/order";
import { getOrderById, transitionOrderGuarded } from "@/services/order.service";

function apiError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "ORDER_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
  if (code === "INVALID_TRANSITION") return jsonError(code, (error as Error).message, 409);
  return handleApiError(error);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("orders:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const order = await getOrderById(id);
    if (!order) return jsonError("ORDER_NOT_FOUND", "订单不存在", 404);
    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("orders:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const { target } = transitionOrderSchema.parse(await request.json());
    await transitionOrderGuarded(id, target);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
