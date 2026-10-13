import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { syncStore } from "@/services/store.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("stores:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const store = await syncStore(id);
    return NextResponse.json({ ok: true, lastSyncedAt: store.lastSyncedAt });
  } catch (error) {
    if ((error as { code?: string }).code === "STORE_NOT_FOUND") {
      return jsonError("STORE_NOT_FOUND", (error as Error).message, 404);
    }
    return handleApiError(error);
  }
}
