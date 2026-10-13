import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import { findUserWithPermissionsByEmail } from "@/repositories/user.repository";

export async function verifyLogin(email: string, password: string): Promise<User | null> {
  const user = await findUserWithPermissionsByEmail(email);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const userRole = user.userRoles[0];
  const role = userRole?.role;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: null,
    roleCode: role?.code ?? "OPERATOR",
    roleName: role?.name ?? "运营人员",
    permissions: (role?.permissions ?? []).map((rp) => rp.permission.code),
  };
}


