
import "dotenv/config";
import OpenAI from "openai";
import { requirementAnalysisSchema } from "../schemas/requirement-analysis-schema.js";

const client = new OpenAI();

const MODEL = "gpt-5.5";

export async function generateResponse(
    instructions,
    input,
    {
        schema = requirementAnalysisSchema,
        schemaName = "requirement_analysis"
    } = {}
) {
    const response = await client.responses.create({
        model: MODEL,
        instructions,
        input,
        text: {
            format: {
                type: "json_schema",
                name: schemaName,
                strict: true,
                schema
            }
        }
    });

    if (response.status !== "completed") {
        throw new Error(
            `La respuesta de OpenAI no se completó. Estado: ${response.status}`
        );
    }

    const output = response.output_text;

    if (!output) {
        throw new Error("OpenAI no devolvió contenido.");
    }

    try {
        return JSON.parse(output);
    } catch (error) {
        throw new Error(
            `No se pudo interpretar la respuesta JSON: ${error.message}`
        );
    }
}
