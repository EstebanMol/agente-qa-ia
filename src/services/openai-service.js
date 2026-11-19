import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI();

const MODEL = "gpt-5.5";

export async function generateResponse(instructions, input) {
    const response = await client.responses.create({
        model: MODEL,
        instructions,
        input
    });

    return response.output_text;
}