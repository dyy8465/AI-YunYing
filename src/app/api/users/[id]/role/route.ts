import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { updateRoleSchema } from "@/lib/validations/auth";
import { changeUserRole } from "@/services/user.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("users:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const { id } = await params;
    const body = await request.json();
    const { roleCode } = updateRoleSchema.parse(body);
    await changeUserRole(id, roleCode);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
