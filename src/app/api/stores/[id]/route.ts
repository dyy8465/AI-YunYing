import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { updateStoreSchema } from "@/lib/validations/store";
import { updateStoreGuarded } from "@/services/store.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("stores:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const input = updateStoreSchema.parse(await request.json());
    await updateStoreGuarded(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "SELLER_ID_EXISTS") {
      return jsonError("SELLER_ID_EXISTS", (error as Error).message, 409);
    }
    if ((error as { code?: string }).code === "STORE_NOT_FOUND") {
      return jsonError("STORE_NOT_FOUND", (error as Error).message, 404);
    }
    return handleApiError(error);
  }
}
