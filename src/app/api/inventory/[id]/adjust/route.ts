import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { adjustInventorySchema } from "@/lib/validations/inventory";
import { adjustInventoryTx } from "@/services/inventory.service";

function apiError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "INVENTORY_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
  if (code === "INSUFFICIENT_STOCK") return jsonError(code, (error as Error).message, 409);
  return handleApiError(error);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("inventory:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const input = adjustInventorySchema.parse(await request.json());
    await adjustInventoryTx(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
