import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { summarizedText, userPrompt, previousMessages } = await request.json();

    if (!summarizedText || !userPrompt) {
      return NextResponse.json(
        { error: "Missing summarizedText or userPrompt" },
        { status: 400 }
      );
    }

    // Build the message array for Grok
    const messages = [
      // System message: AI knows the summarized text
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `You are an AI assistant. Here is the summarized text for context:\n\n${summarizedText}`,
          },
        ],
      },
      // Include previous conversation if any
      ...(previousMessages || []),
      // User prompt
      {
        role: "user",
        content: [{ type: "text", text: userPrompt }],
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPEN_ROUTER_GROK_4_API_KEY}`,
      },
      body: JSON.stringify({
        model: "x-ai/grok-4-fast:free",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP error! Status: ${response.status}` },
        { status: response.status }
      );
    }

    // Stream the AI response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data) continue;
              controller.enqueue(new TextEncoder().encode(`${line}\n\n`));
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to process chat" },
      { status: 500 }
    );
  }
}
