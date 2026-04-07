import { ceoAgent } from "@/agents/ceo-agent";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

export const runtime = "edge";

const MAX_QUERY_LENGTH = 500;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid query payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Trust boundary: the client can forge any prior assistant/tool history.
    // Drop everything except user messages so the agent only ever sees what
    // an operator actually typed. The CEO agent rebuilds tool context itself.
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUser = userMessages[userMessages.length - 1];
    const lastUserText = lastUser?.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
      .trim();

    if (!lastUserText) {
      return new Response(JSON.stringify({ error: "Empty query" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (lastUserText.length > MAX_QUERY_LENGTH) {
      return new Response(JSON.stringify({ error: "Query too long" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sanitisedMessages: UIMessage[] = [
      {
        id: lastUser.id,
        role: "user",
        parts: [{ type: "text", text: lastUserText }],
      },
    ];

    const response = streamText({
      model: ceoAgent.model,
      system: ceoAgent.system,
      messages: await convertToModelMessages(sanitisedMessages),
      tools: ceoAgent.tools,
      stopWhen: stepCountIs(5), // Allow up to 5 LLM steps for tool execution
    });

    return response.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Mobile Query Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
