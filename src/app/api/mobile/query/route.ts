import { ceoAgent } from "@/agents/ceo-agent";
import { stepCountIs, streamText } from "ai";
import { z } from "zod";

export const runtime = "edge";

const querySchema = z.object({
  query: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = querySchema.safeParse(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: "Invalid query payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { query } = result.data;

    const response = streamText({
      model: ceoAgent.model,
      system: ceoAgent.system,
      messages: [{ role: "user", content: query }],
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
