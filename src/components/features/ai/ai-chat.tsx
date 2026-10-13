"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, SendHorizonal, User, TrendingDown, FileText, Boxes, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  {
    icon: TrendingDown,
    label: "利润归因分析",
    prompt: "对比最近两个 30 天的数据，分析利润变化的主要原因，并按影响程度排序给出改进建议。",
  },
  {
    icon: FileText,
    label: "Listing 优化",
    prompt: "从销量 TOP5 中挑一个商品，基于它的表现给出 Listing 标题、五点描述和 Search Terms 的优化方案。",
  },
  {
    icon: Boxes,
    label: "补货建议",
    prompt: "基于库存预警数据，列出最紧急的补货清单，给出建议补货数量和优先级排序。",
  },
];

function AssistantBubble({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] rounded-xl bg-muted/50 px-4 py-3 text-sm leading-relaxed">
        <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse rounded-sm bg-primary align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamText]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setStreamText("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "AI 服务暂时不可用");
      }

      // 流式读取：逐 chunk 追加渲染
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamText(acc);
      }
      acc += decoder.decode();
      if (!acc.trim()) throw new Error("模型未返回内容，请重试");
      setMessages([...nextMessages, { role: "assistant", content: acc }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setStreamText("");
      setLoading(false);
    }
  }

  return (
    <Card className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-4">
        {/* 消息区 */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold">AI 运营助手 · 已接入真实经营数据</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  我能看到近 30 天利润、销量排行、库存预警和广告指标，试试下面的快捷提问
                </p>
              </div>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => send(q.prompt)}
                    className="group rounded-xl border bg-muted/30 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <q.icon className="mb-2 h-5 w-5 text-primary" />
                    <div className="text-sm font-medium">{q.label}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <AssistantBubble key={i} content={m.content} />
            ) : (
              <div key={i} className="flex flex-row-reverse gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <User className="h-4 w-4" />
                </div>
                <div className="max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ),
          )}

          {/* 推理中（首个 token 之前） */}
          {loading && !streamText && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                深度思考中…
              </div>
            </div>
          )}

          {/* 流式正文 */}
          {streamText && <AssistantBubble content={streamText} streaming />}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {/* 输入区 */}
        <form
          className="flex items-center gap-2 rounded-xl border bg-background p-2"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <input
            className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="问点什么，例如：为什么这个月广告花费涨了但销量没涨？"
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="sm" className="gap-1.5" disabled={loading || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
            发送
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

