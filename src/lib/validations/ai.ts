import { z } from "zod";

export const aiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1, "消息不能为空").max(2000, "单条消息最多 2000 字"),
      }),
    )
    .min(1, "至少包含一条消息")
    .max(20, "对话历史最多 20 条"),
  temperature: z.coerce.number().min(0).max(1).optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
