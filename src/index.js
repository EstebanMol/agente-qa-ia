
import { analyzeRequirement } from "./agents/requirement-agent.js";

async function main() {
    console.log("==================================");
    console.log("       AGENTE DE QA CON IA");
    console.log("==================================");

    const requirement = `
    Como usuario autorizado de SIPREC quiero consultar
    si un celular figura como sustraído mediante su IMEI,
    para conocer si tiene una sustracción vigente registrada
    por el organismo correspondiente.

    La consulta debe permitir ingresar un IMEI y devolver
    información sobre su situación registral.
    `;

    try {
        const result = await analyzeRequirement(requirement);

        console.log("\n=== RESULTADO DEL PROCESAMIENTO ===");
        console.log(result.analysis);

    } catch (error) {
        console.error("\nError durante el análisis:");
        console.error(error.message);
    }
}

main();
