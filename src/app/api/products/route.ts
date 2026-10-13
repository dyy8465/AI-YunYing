import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { createProductSchema, productQuerySchema } from "@/lib/validations/product";
import { createProductGuarded, getProducts } from "@/services/product.service";

function apiError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "SKU_EXISTS") return jsonError(code, (error as Error).message, 409);
  if (code === "STORE_NOT_FOUND") return jsonError(code, (error as Error).message, 404);
  return handleApiError(error);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("products:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = productQuerySchema.parse(params);
    return NextResponse.json(await getProducts(query));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("products:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const input = createProductSchema.parse(await request.json());
    const product = await createProductGuarded(input);
    return NextResponse.json({ id: product.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
