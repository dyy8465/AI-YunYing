import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { createUserSchema } from "@/lib/validations/auth";
import { createUser, listUsers } from "@/services/user.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("users:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("users:manage")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const body = await request.json();
    const input = createUserSchema.parse(body);
    const user = await createUser(input);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
