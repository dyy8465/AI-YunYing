import "server-only";
import bcrypt from "bcryptjs";
import type { RoleCode } from "@prisma/client";
import {
  createUserWithRole,
  listUsers,
  updateUserRole,
} from "@/repositories/user.repository";

export { listUsers };

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  roleCode: RoleCode;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return createUserWithRole({ ...input, passwordHash });
}

export async function changeUserRole(userId: string, roleCode: RoleCode) {
  return updateUserRole(userId, roleCode);
}
