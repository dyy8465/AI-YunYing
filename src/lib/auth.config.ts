import type { NextAuthConfig } from "next-auth";

// Edge 安全的 Auth 配置（middleware 使用，不引入 Prisma/bcrypt）
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; roleCode: string; roleName: string; permissions: string[] };
        token.id = u.id;
        token.roleCode = u.roleCode;
        token.roleName = u.roleName;
        token.permissions = u.permissions;
      }
      return token;
    },
    session({ session, token }) {
      const t = token as unknown as {
        id: string;
        roleCode: string;
        roleName: string;
        permissions: string[];
      };
      session.user.id = t.id;
      session.user.roleCode = t.roleCode;
      session.user.roleName = t.roleName;
      session.user.permissions = t.permissions;
      return session;
    },
  },
  providers: [], // 完整 providers 在 lib/auth.ts 中组合（Node runtime）
} satisfies NextAuthConfig;
