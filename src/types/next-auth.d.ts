import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleCode: string;
      roleName: string;
      permissions: string[];
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roleCode: string;
    roleName: string;
    permissions: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roleCode: string;
    roleName: string;
    permissions: string[];
  }
}
