import { auth } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { aiChatSchema } from "@/lib/validations/ai";
import { aiChatStream } from "@/services/ai.service";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user.permissions.includes("ai:view")) {
      return jsonError("FORBIDDEN", "无权访问", 403);
    }
    const input = aiChatSchema.parse(await request.json());

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of aiChatStream(input.messages, input.temperature ?? 0.4)) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch {
          // 中途断流：以明文标记结束，前端可直接展示
          controller.enqueue(encoder.encode("\n\n> ⚠️ AI 连接中断，请重试。"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "LLM_NOT_CONFIGURED") return jsonError(code, (error as Error).message, 503);
    if (code === "LLM_ERROR" || code === "LLM_EMPTY") {
      return jsonError(code, (error as Error).message, 502);
    }
    const { handleApiError } = await import("@/lib/api");
    return handleApiError(error);
  }
}
