import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { updateProductSchema } from "@/lib/validations/product";
import { deleteProduct, getProductById, updateProductGuarded } from "@/services/product.service";

function apiError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === "SKU_EXISTS") return jsonError(code, (error as Error).message, 409);
  if (code === "PRODUCT_NOT_FOUND" || code === "STORE_NOT_FOUND") {
    return jsonError(code ?? "NOT_FOUND", (error as Error).message, 404);
  }
  return handleApiError(error);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("products:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) return jsonError("PRODUCT_NOT_FOUND", "商品不存在", 404);
    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("products:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const input = updateProductSchema.parse(await request.json());
    await updateProductGuarded(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("products:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
