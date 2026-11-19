
import "dotenv/config";
import OpenAI from "openai";
import { requirementAnalysisSchema } from "../schemas/requirement-analysis-schema.js";

const client = new OpenAI();

const MODEL = "gpt-5.5";

export async function generateResponse(instructions, input) {
    const response = await client.responses.create({
        model: MODEL,

        instructions,
        input,

        text: {
            format: {
                type: "json_schema",
                name: "requirement_analysis",
                strict: true,
                schema: requirementAnalysisSchema
            }
        }
    });

    // Verificamos si la respuesta se completó correctamente.
    if (response.status !== "completed") {
        throw new Error(
            `La respuesta de OpenAI no se completó. Estado: ${response.status}`
        );
    }

    // Obtenemos el contenido generado por el modelo.
    const output = response.output_text;

    if (!output) {
        throw new Error("OpenAI no devolvió contenido.");
    }

    // Convertimos el JSON recibido en un objeto JavaScript.
    try {
        return JSON.parse(output);
    } catch (error) {
        throw new Error(
            `No se pudo interpretar la respuesta JSON: ${error.message}`
        );
    }
}
