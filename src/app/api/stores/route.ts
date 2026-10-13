import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { createStoreSchema } from "@/lib/validations/store";
import { createStoreGuarded, getStoresWithStats } from "@/services/store.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("stores:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    return NextResponse.json(await getStoresWithStats());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("stores:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const input = createStoreSchema.parse(await request.json());
    const store = await createStoreGuarded(input);
    return NextResponse.json({ id: store.id }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "SELLER_ID_EXISTS") {
      return jsonError("SELLER_ID_EXISTS", (error as Error).message, 409);
    }
    return handleApiError(error);
  }
}
