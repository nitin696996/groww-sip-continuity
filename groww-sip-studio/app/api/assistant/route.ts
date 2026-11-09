import { sebiPrecheck, SEBI_REFUSAL, type GuardrailStatus } from "@/lib/guardrails";
import { GROQ_MODEL, OPENROUTER_MODEL } from "@/lib/models";
import { chunkText, mockAnswer, TIMEOUT_FALLBACK } from "@/lib/mock-stream";
import { buildSystemPrompt } from "@/lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  messages: { role: string; content: string }[];
  sipState: unknown;
  provider: "groq" | "openrouter";
  simulateTimeout?: boolean;
};

function sse(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function streamText(
  send: (o: unknown) => void,
  text: string,
  meta: {
    ttftMs: number;
    provider: string;
    model: string;
    guardrail: GuardrailStatus;
    fallback: boolean;
  },
) {
  send({ type: "meta", ...meta });
  for (const part of chunkText(text)) {
    send({ type: "token", text: part });
    await sleep(12);
  }
  send({ type: "done" });
}

async function callChat(opts: {
  url: string;
  key: string;
  model: string;
  system: string;
  user: string;
  extraHeaders?: Record<string, string>;
  foldSystemIntoUser?: boolean;
}) {
  const started = Date.now();
  const messages = opts.foldSystemIntoUser
    ? [{ role: "user", content: `${opts.system}\n\nUser question:\n${opts.user}` }]
    : [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ];
  const res = await fetch(opts.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.key}`,
      "Content-Type": "application/json",
      ...opts.extraHeaders,
    },
    signal: AbortSignal.timeout(12_000),
    body: JSON.stringify({
      model: opts.model,
      stream: true,
      temperature: 0.2,
      max_completion_tokens: 1024,
      reasoning_effort: "low",
      messages,
    }),
  });
  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "");
    console.error("chat fail", opts.model, res.status, err.slice(0, 240));
    throw new Error(`${res.status} ${err.slice(0, 180)}`);
  }
  return { body: res.body, started };
}

async function readOpenAiStream(
  body: ReadableStream<Uint8Array>,
  send: (o: unknown) => void,
  started: number,
  metaBase: {
    provider: string;
    model: string;
    guardrail: GuardrailStatus;
    fallback: boolean;
  },
) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let first = true;
  let emitted = 0;

  const consume = (chunk: string) => {
    const lines = chunk.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      let json: { choices?: { delta?: { content?: string | null } }[] };
      try {
        json = JSON.parse(raw);
      } catch {
        continue;
      }
      const token = json.choices?.[0]?.delta?.content ?? "";
      if (!token) continue;
      if (first) {
        send({
          type: "meta",
          ttftMs: Date.now() - started,
          ...metaBase,
        });
        first = false;
      }
      send({ type: "token", text: token });
      emitted += token.length;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    consume(buf);
  }
  if (buf.trim()) consume(buf + "\n");
  if (emitted === 0) return 0;
  send({ type: "done" });
  return emitted;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const user = body.messages?.at(-1)?.content ?? "";
  const guardrail = sebiPrecheck(user);
  const system = buildSystemPrompt(body.sipState);
  const groqKey = process.env.GROQ_API_KEY || "";
  const orKey = process.env.OPENROUTER_API_KEY || "";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (o: unknown) => controller.enqueue(enc.encode(sse(o)));
      try {
        if (body.simulateTimeout) {
          await streamText(send, TIMEOUT_FALLBACK, {
            ttftMs: 0,
            provider: "mock",
            model: "deterministic-timeout",
            guardrail: "PASS",
            fallback: true,
          });
          controller.close();
          return;
        }

        if (guardrail === "BLOCKED_SEBI_RIA") {
          await streamText(send, SEBI_REFUSAL, {
            ttftMs: 8,
            provider: "guardrail",
            model: "sebi-precheck",
            guardrail,
            fallback: false,
          });
          controller.close();
          return;
        }

        const preferOr = body.provider === "openrouter";
        const tryGroq = !preferOr && Boolean(groqKey);
        const tryOr = Boolean(orKey);

        if (!tryGroq && !tryOr) {
          await streamText(send, mockAnswer(user, guardrail), {
            ttftMs: 18,
            provider: "mock",
            model: "deterministic",
            guardrail,
            fallback: true,
          });
          controller.close();
          return;
        }

        try {
          if (tryGroq) {
            const { body: b, started } = await callChat({
              url: "https://api.groq.com/openai/v1/chat/completions",
              key: groqKey,
              model: GROQ_MODEL,
              system,
              user,
              foldSystemIntoUser: true,
            });
            const n = await readOpenAiStream(b, send, started, {
              provider: "groq",
              model: "live",
              guardrail,
              fallback: false,
            });
            if (n > 0) {
              controller.close();
              return;
            }
          }
        } catch (e) {
          console.error("groq path", e);
        }

        try {
          if (tryOr) {
            const { body: b, started } = await callChat({
              url: "https://openrouter.ai/api/v1/chat/completions",
              key: orKey,
              model: OPENROUTER_MODEL,
              system,
              user,
              extraHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Groww SIP Continuity Studio",
              },
            });
            const emitted = await readOpenAiStream(b, send, started, {
              provider: "openrouter",
              model: "live",
              guardrail,
              fallback: false,
            });
            if (emitted > 0) {
              controller.close();
              return;
            }
          }
        } catch (e) {
          console.error("openrouter path", e);
        }

        await streamText(send, mockAnswer(user, guardrail), {
          ttftMs: 22,
          provider: "mock",
          model: "deterministic",
          guardrail,
          fallback: true,
        });
      } catch {
        await streamText(send, mockAnswer(user, guardrail), {
          ttftMs: 0,
          provider: "mock",
          model: "deterministic",
          guardrail,
          fallback: true,
        });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
