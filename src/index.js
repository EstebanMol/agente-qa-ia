
import { analyzeRequirement } from "./agents/requirement-agent.js";
import { validateAnalysis } from "./validators/analysis-validator.js";
import { designTests } from "./agents/qa-agent.js";
import { validateQaDesign } from "./validators/qa-validator.js";
import { readFile } from "node:fs/promises";

async function main() {
    console.log("==================================");
    console.log("       AGENTE DE QA CON IA");
    console.log("==================================");

    try {
        const requirement = await readFile(
            new URL("../input/requirement.txt", import.meta.url),
            "utf-8"
        );
        
        if (typeof requirement !== "string" || requirement.trim() === "") {
            throw new Error(
                "El archivo de requerimiento está vacío o no contiene texto válido."
            );
        }

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

        // Mostrar resumen de datos de prueba por estado.
        console.log("\n=== RESUMEN DE DATOS DE PRUEBA ===");

        const testDataCounts = {
            defined: 0,
            example: 0,
            pending: 0
        };

        qaResult.qaDesign.testCases.forEach(testCase => {
            testCase.testData.forEach(data => {
                if (Object.hasOwn(testDataCounts, data.status)) {
                    testDataCounts[data.status]++;
                }
            });
        });

        const totalTestData = Object.values(testDataCounts).reduce(
            (total, count) => total + count,
            0
        );

        console.log(`Total de elementos: ${totalTestData}`);
        console.log(`Definidos: ${testDataCounts.defined}`);
        console.log(`Ejemplos por confirmar: ${testDataCounts.example}`);
        console.log(`Pendientes: ${testDataCounts.pending}`);

        // Mostrar métricas de preparación para ejecución.
        console.log("\n=== PREPARACION PARA EJECUCION (TEST READINESS) ===");

        if (qaValidation.executionReadiness) {
            const readiness = qaValidation.executionReadiness;

            console.log(`Total de casos: ${readiness.total}`);
            console.log(`Casos listos: ${readiness.ready}`);
            console.log(`Casos pendientes: ${readiness.notReady}`);
            console.log(`Porcentaje de preparación: ${readiness.percentage}%`);
             
            if (readiness.details.length > 0) {
                console.log("\nDetalle por caso:");

                readiness.details.forEach(detail => {
                    const status = detail.status === "ready"
                        ? "LISTO"
                        : "PENDIENTE";

                    console.log(`\n${detail.testCaseId}: ${status}`);

                    if (detail.missingElements.length > 0) {
                        console.log(
                            `  Requiere completar: ${detail.missingElements.join(", ")}`
                        );
                    } else {
                        console.log("  Sin observaciones.");
                    }
                });
            }
        }

        if (!qaValidation.valid) {
            throw new Error(
                "El diseño de QA contiene errores. No se considerará válido."
            );
        }

        // ETAPA 5: Mostrar resultados.
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
