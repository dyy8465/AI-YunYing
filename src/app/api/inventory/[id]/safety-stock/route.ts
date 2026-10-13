import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { safetyStockSchema } from "@/lib/validations/inventory";
import { updateSafetyStock } from "@/services/inventory.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("inventory:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const { safetyStock } = safetyStockSchema.parse(await request.json());
    await updateSafetyStock(id, safetyStock);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "INVENTORY_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
    return handleApiError(error);
  }
}
