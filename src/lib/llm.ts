/**
 * OpenAI 兼容 LLM 客户端（密钥仅从环境变量读取，绝不硬编码）
 */
export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmResult {
  content: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number };
}

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL);
}

export async function chatCompletion(
  systemPrompt: string,
  messages: LlmMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): Promise<LlmResult> {
  const { temperature = 0.4, maxTokens = 12000, timeoutMs = 60_000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${process.env.LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw Object.assign(new Error(`LLM 服务返回 ${res.status}`), { code: "LLM_ERROR", details: body.slice(0, 300) });
    }

    const data = (await res.json()) as {
      model?: string;
      choices?: { message?: { content?: string; reasoning_content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content?.trim() || "";
    if (!content) {
      throw Object.assign(new Error("模型未返回内容（可能超出 token 上限）"), { code: "LLM_EMPTY" });
    }

    return {
      content,
      model: data.model ?? process.env.LLM_MODEL ?? "unknown",
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}


/**
 * 流式对话：逐 token 产出正文（忽略 reasoning_content，仅用于保持连接）
 */
export async function* chatCompletionStream(
  systemPrompt: string,
  messages: LlmMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
): AsyncGenerator<string> {
  const { temperature = 0.4, maxTokens = 12000, timeoutMs = 300_000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${process.env.LLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      throw Object.assign(new Error(`LLM 服务返回 ${res.status}`), { code: "LLM_ERROR", details: body.slice(0, 300) });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[];
          };
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 忽略无法解析的心跳/注释行
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}
