import "dotenv/config";
import OpenAI from "openai";

async function testConnection() {
    try {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("No se encontró OPENAI_API_KEY en el archivo .env");
        }

        const client = new OpenAI();

        console.log("Conectando con OpenAI...");

        const response = await client.responses.create({
            model: "gpt-5.5",
            input: "Respondé brevemente en español: ¿qué es un caso de prueba de software?"
        });

        console.log("\n=== RESPUESTA DE LA IA ===");
        console.log(response.output_text);

        console.log("\nConexión realizada correctamente.");

    } catch (error) {
        console.error("\nError al conectar con OpenAI:");

        if (error.status) {
            console.error("Código HTTP:", error.status);
        }

        console.error(error.message);
    }
}

testConnection();