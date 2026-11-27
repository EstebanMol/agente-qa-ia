
import { analyzeRequirement } from "./agents/requirement-agent.js";
import { validateAnalysis } from "./validators/analysis-validator.js";
import { designTests } from "./agents/qa-agent.js";
import { validateQaDesign } from "./validators/qa-validator.js";

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
        // ETAPA 1: Análisis funcional.
        const result = await analyzeRequirement(requirement);

        console.log("\n=== AGENTE DE ANALISIS FUNCIONAL ===");

        // ETAPA 2: Validación del análisis.
        const validation = validateAnalysis(result.analysis);

        console.log("\n=== VALIDACION DEL ANALISIS ===");

        console.log(
            `Estado: ${validation.valid ? "VALIDO" : "CON ERRORES"}`
        );

        if (validation.errors.length > 0) {
            console.log("\nErrores:");

            validation.errors.forEach(error => {
                console.log(`- ${error}`);
            });
        }

        if (validation.warnings.length > 0) {
            console.log("\nAdvertencias:");

            validation.warnings.forEach(warning => {
                console.log(`- ${warning}`);
            });
        }

        if (!validation.valid) {
            throw new Error(
                "El análisis funcional contiene errores. No se ejecutará el Agente de QA."
            );
        }

        // ETAPA 3: Diseño de pruebas.
        const qaResult = await designTests(result.analysis);

        // ETAPA 4: Validación del diseño de QA.
        const qaValidation = validateQaDesign(
            qaResult.qaDesign,
            result.analysis
        );

        console.log("\n=== VALIDACION DEL DISEÑO DE QA ===");

        console.log(
            `Estado: ${qaValidation.valid ? "VALIDO" : "CON ERRORES"}`
        );

        if (qaValidation.errors.length > 0) {
            console.log("\nErrores:");

            qaValidation.errors.forEach(error => {
                console.log(`- ${error}`);
            });
        }

        if (qaValidation.warnings.length > 0) {
            console.log("\nAdvertencias:");

            qaValidation.warnings.forEach(warning => {
                console.log(`- ${warning}`);
            });
        }

        // Mostrar métricas de cobertura efectiva.
        console.log("\n=== COBERTURA EFECTIVA ===");

        if (qaValidation.effectiveRulesCoverage) {
            const rules = qaValidation.effectiveRulesCoverage;

            console.log("\nReglas de negocio:");
            console.log(`Total: ${rules.total}`);
            console.log(`Cubiertas: ${rules.covered}`);
            console.log(`Sin cobertura: ${rules.uncovered}`);
            console.log(`Porcentaje: ${rules.percentage}%`);
        }

        if (qaValidation.effectiveScenariosCoverage) {
            const scenarios = qaValidation.effectiveScenariosCoverage;

            console.log("\nEscenarios funcionales:");
            console.log(`Total: ${scenarios.total}`);
            console.log(`Cubiertos: ${scenarios.covered}`);
            console.log(`Sin cobertura: ${scenarios.uncovered}`);
            console.log(`Porcentaje: ${scenarios.percentage}%`);
        }

        // Mostrar métricas de preparación para ejecución.
        console.log("\n=== PREPARACION PARA EJECUCION (TEST READINESS) ===");

        if (qaValidation.executionReadiness) {
            const readiness = qaValidation.executionReadiness;

            console.log(`Total de casos: ${readiness.total}`);
            console.log(`Casos listos: ${readiness.ready}`);
            console.log(`Casos pendientes: ${readiness.notReady}`);
            console.log(`Porcentaje de preparación: ${readiness.percentage}%`);
        }

        if (!qaValidation.valid) {
            throw new Error(
                "El diseño de QA contiene errores. No se considerará válido."
            );
        }

        // ETAPA 4: Mostrar resultados.
        console.log("\n=== RESULTADO DEL ANALISIS FUNCIONAL ===");
        console.log(JSON.stringify(result.analysis, null, 2));

        console.log("\n=== RESULTADO DEL AGENTE DE QA ===");
        console.log(JSON.stringify(qaResult.qaDesign, null, 2));

        console.log("\nProcesamiento finalizado correctamente.");

    } catch (error) {
        console.error("\nError durante el procesamiento:");
        console.error(error.message);
    }
}

main();
