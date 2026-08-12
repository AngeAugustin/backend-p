import { NextResponse } from "next/server";

import { getSalaryRefusal, isSalaryQuestion, sanitizeAssistantReply } from "@/lib/chat/guardrails";
import { buildSystemPrompt } from "@/lib/chat/systemPrompt";
import { chatRequestSchema } from "@/lib/chat/validation";
import { loadKnowledgeBase } from "@/lib/content/loadKnowledge";
import { generateChatReply, isGeminiConfigured, streamChatReply } from "@/lib/gemini";
import { buildRagSystemPrompt } from "@/lib/rag/prompt";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isSupabaseConfigured } from "@/lib/supabase";
import { corsHeaders, options } from "@/lib/api";

/** Streaming Gemini + RAG — allow enough time on Vercel (Hobby caps at 10s). */
export const maxDuration = 60;

function getLastUserMessage(
  messages: { role: string; content: string }[],
): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "user") {
      return message.content;
    }
  }
  return null;
}

async function buildPromptForRequest(
  locale: "fr" | "en",
  lastUserMessage: string,
): Promise<{ systemPrompt: string; mode: "rag" | "baseline" }> {
  if (isSupabaseConfigured()) {
    const chunks = await retrieveRelevantChunks(lastUserMessage, locale);
    return {
      systemPrompt: buildRagSystemPrompt(locale, chunks),
      mode: "rag",
    };
  }

  const knowledgeBase = await loadKnowledgeBase(locale);
  return {
    systemPrompt: buildSystemPrompt(locale, knowledgeBase),
    mode: "baseline",
  };
}

function chatResponseHeaders(
  origin: string | null,
  extra: Record<string, string>,
): Record<string, string> {
  return {
    ...corsHeaders(origin),
    ...extra,
  };
}

export async function OPTIONS(request: Request) {
  return options(request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        {
          status: 503,
          headers: chatResponseHeaders(origin, {}),
        },
      );
    }

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: chatResponseHeaders(origin, {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt),
          }),
        },
      );
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsed.error.flatten() },
        {
          status: 400,
          headers: chatResponseHeaders(origin, {}),
        },
      );
    }

    const { locale, messages } = parsed.data;
    const lastUserMessage = getLastUserMessage(messages);

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "A user message is required." },
        {
          status: 400,
          headers: chatResponseHeaders(origin, {}),
        },
      );
    }

    if (isSalaryQuestion(lastUserMessage)) {
      return NextResponse.json(
        { reply: getSalaryRefusal(locale) },
        {
          headers: chatResponseHeaders(origin, {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-Chat-Mode": isSupabaseConfigured() ? "rag" : "baseline",
          }),
        },
      );
    }

    const { systemPrompt, mode } = await buildPromptForRequest(
      locale,
      lastUserMessage,
    );

    const acceptHeader = request.headers.get("accept") ?? "";
    const wantsStream =
      acceptHeader.includes("text/plain") ||
      acceptHeader.includes("text/event-stream");

    const responseHeaders = chatResponseHeaders(origin, {
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-Chat-Mode": mode,
    });

    if (!wantsStream) {
      const rawReply = await generateChatReply(systemPrompt, messages);
      const reply = sanitizeAssistantReply(rawReply, locale);

      return NextResponse.json({ reply }, { headers: responseHeaders });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatReply(systemPrompt, messages)) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...responseHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[/api/chat]", error);

    return NextResponse.json(
      { error: "Failed to generate a response." },
      {
        status: 500,
        headers: chatResponseHeaders(origin, {}),
      },
    );
  }
}
