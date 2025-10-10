import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing text in request body" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPEN_ROUTER_API}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this PDF text carefully and give me a clear, natural explanation in simple language. 
Explain it like I’m reading my own document aloud, in a text-to-speech style (fluent, engaging, and easy to follow). 
Here is the text: ${text}`,
                },
              ],
            },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP error! Status: ${response.status}` },
        { status: response.status }
      );
    }

    // Create a ReadableStream to forward the streaming response
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

            // Split by SSE message boundary (\n\n)
            const lines = buffer.split("\n\n");
            buffer = lines.pop(); // Keep incomplete data in buffer

            for (const line of lines) {
              if (line.trim() === "" || !line.startsWith("data:")) continue; // Skip empty or non-data lines
              const data = line.slice(5).trim();
              if (data === "[DONE]") {
                controller.enqueue(
                  new TextEncoder().encode("data: [DONE]\n\n")
                );
                continue;
              }
              if (data) {
                try {
                  JSON.parse(data); // Validate JSON
                  controller.enqueue(new TextEncoder().encode(`${line}\n\n`));
                } catch (error) {
                  console.error(
                    "Server: Invalid JSON chunk skipped:",
                    data,
                    error
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Server: Stream error:", error);
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
    console.error("Server: API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize text" },
      { status: 500 }
    );
  }
}
