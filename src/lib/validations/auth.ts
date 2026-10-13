import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空").max(50),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位").max(72),
  roleCode: z.enum(["ADMIN", "OWNER", "OPERATOR", "WAREHOUSE", "FINANCE"]),
});

export const updateRoleSchema = z.object({
  roleCode: z.enum(["ADMIN", "OWNER", "OPERATOR", "WAREHOUSE", "FINANCE"]),
});
