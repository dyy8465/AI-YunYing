import { prisma } from "@/lib/prisma";
import type { RoleCode } from "@prisma/client";

export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  roleCode: RoleCode;
  roleName: string;
}

export async function listUsers(): Promise<UserWithRole[]> {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { userRoles: { include: { role: true } } },
  });
  return users.map((u) => {
    const userRole = u.userRoles[0];
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      isActive: u.isActive,
      createdAt: u.createdAt,
      roleCode: userRole?.role.code ?? "OPERATOR",
      roleName: userRole?.role.name ?? "运营人员",
    };
  });
}

export async function findUserWithPermissionsByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email, deletedAt: null, isActive: true },
    include: {
      userRoles: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
    },
  });
}

export async function createUserWithRole(input: {
  name: string;
  email: string;
  passwordHash: string;
  roleCode: RoleCode;
}) {
  const role = await prisma.role.findUnique({ where: { code: input.roleCode } });
  if (!role) throw new Error("ROLE_NOT_FOUND");
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      userRoles: { create: { roleId: role.id } },
    },
  });
  return user;
}

export async function updateUserRole(userId: string, roleCode: RoleCode) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) throw new Error("ROLE_NOT_FOUND");
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.create({ data: { userId, roleId: role.id } });
}
