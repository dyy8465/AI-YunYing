import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { transferInventorySchema } from "@/lib/validations/inventory";
import { transferInventoryTx } from "@/services/inventory.service";

function apiError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "INVENTORY_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
  if (code === "INSUFFICIENT_STOCK" || code === "SAME_WAREHOUSE") {
    return jsonError(code, (error as Error).message, 409);
  }
  return handleApiError(error);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("inventory:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const input = transferInventorySchema.parse(await request.json());
    await transferInventoryTx(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
