export function validateQaDesign(qaDesign, functionalAnalysis) {
    const errors = [];
    const warnings = [];

    // Verificar que exista el diseño de QA.
    if (!qaDesign || typeof qaDesign !== "object") {
        return {
            valid: false,
            errors: ["El diseño de QA no existe o no es válido."],
            warnings
        };
    }

    // Verificar que exista el análisis funcional de origen.
    if (!functionalAnalysis || typeof functionalAnalysis !== "object") {
        return {
            valid: false,
            errors: ["El análisis funcional de origen no existe o no es válido."],
            warnings
        };
    }

    // Verificar que los casos de prueba tengan IDs únicos.
    if (!Array.isArray(qaDesign.testCases)) {
        errors.push("La colección de casos de prueba no es válida.");
    } else {
        const testCaseIds = qaDesign.testCases.map(testCase => testCase.id);

        const duplicatedIds = testCaseIds.filter(
            (id, index) => testCaseIds.indexOf(id) !== index
        );

        if (duplicatedIds.length > 0) {
            errors.push(
                `Se encontraron IDs duplicados en los casos de prueba: ${[...new Set(duplicatedIds)].join(", ")}`
            );
        }
    }
    
    // Validar las colecciones del análisis funcional.
    const collections = [
        "businessRules",
        "positiveScenarios",
        "negativeScenarios"
    ];

    collections.forEach(collection => {
        if (!Array.isArray(functionalAnalysis[collection])) {
            errors.push(
                `La colección ${collection} del análisis funcional no es válida.`
            );
        }
    });

    // Obtener los IDs de reglas y escenarios del análisis funcional.
    const ruleIds = new Set(
        (Array.isArray(functionalAnalysis.businessRules)
            ? functionalAnalysis.businessRules
            : []
        ).map(rule => rule.id)
    );

    const scenarioIds = new Set([
        ...(Array.isArray(functionalAnalysis.positiveScenarios)
            ? functionalAnalysis.positiveScenarios
            : []
        ).map(scenario => scenario.id),

        ...(Array.isArray(functionalAnalysis.negativeScenarios)
            ? functionalAnalysis.negativeScenarios
            : []
        ).map(scenario => scenario.id)
    ]);

    // Validar referencias de cada caso de prueba.
    if (Array.isArray(qaDesign.testCases)) {
        qaDesign.testCases.forEach(testCase => {

            // Verificar reglas relacionadas.
            (testCase.relatedRules || []).forEach(ruleId => {
                if (!ruleIds.has(ruleId)) {
                    errors.push(
                        `${testCase.id}: referencia a una regla inexistente (${ruleId}).`
                    );
                }
            });

            // Verificar escenarios relacionados.
            (testCase.relatedScenarios || []).forEach(scenarioId => {
                if (!scenarioIds.has(scenarioId)) {
                    errors.push(
                        `${testCase.id}: referencia a un escenario inexistente (${scenarioId}).`
                    );
                }
            });
        });
    }

    // Validar prioridades y sus justificaciones.
    if (Array.isArray(qaDesign.testCases)) {
        qaDesign.testCases.forEach(testCase => {

            const validPriorities = [
                "critical",
                "high",
                "medium",
                "low"
            ];

            if (!validPriorities.includes(testCase.priority)) {
                errors.push(
                    `${testCase.id}: prioridad inválida (${testCase.priority}).`
                );
            }

            if (
                typeof testCase.priorityReason !== "string" ||
                testCase.priorityReason.trim() === ""
            ) {
                errors.push(
                    `${testCase.id}: no tiene una justificación de prioridad.`
                );
            }
        });
    }

    // Validar coherencia del resultado esperado.
    if (Array.isArray(qaDesign.testCases)) {
        qaDesign.testCases.forEach(testCase => {

            const hasExpectedResult =
                typeof testCase.expectedResult === "string" &&
                testCase.expectedResult.trim() !== "";

            if (
                testCase.expectedResultStatus === "defined" &&
                !hasExpectedResult
            ) {
                errors.push(
                    `${testCase.id}: el resultado está definido pero no tiene descripción.`
                );
            }

            if (
                testCase.expectedResultStatus === "pending" &&
                hasExpectedResult
            ) {
                warnings.push(
                    `${testCase.id}: tiene una descripción de resultado esperado, pero su estado figura como pendiente. Revisar si se trata de un ejemplo o de una definición confirmada.`
                );
            }
        });
    }

    // Validar la cobertura de reglas de negocio.
    if (!qaDesign.coverage || typeof qaDesign.coverage !== "object") {
        errors.push("La información de cobertura no existe o no es válida.");
    } else {
        const coveredRules = qaDesign.coverage.coveredRules || [];
        const uncoveredRules = qaDesign.coverage.uncoveredRules || [];

        const allCoverageIds = [
            ...coveredRules,
            ...uncoveredRules
        ];

        // Detectar reglas inexistentes.
        allCoverageIds.forEach(ruleId => {
            if (!ruleIds.has(ruleId)) {
                errors.push(
                    `La cobertura referencia una regla inexistente (${ruleId}).`
                );
            }
        });

        // Detectar reglas duplicadas.
        if (new Set(allCoverageIds).size !== allCoverageIds.length) {
            errors.push(
                "Hay reglas duplicadas en la información de cobertura."
            );
        }

        // Comprobar que cada regla cubierta tenga un caso asociado.
        coveredRules.forEach(ruleId => {

            const hasTestCase = Array.isArray(qaDesign.testCases) &&
                qaDesign.testCases.some(testCase =>
                    (testCase.relatedRules || []).includes(ruleId)
                );

            if (!hasTestCase) {
                errors.push(
                    `La regla ${ruleId} figura como cubierta, pero no tiene casos de prueba asociados.`
                );
            }
        });

        // Detectar reglas que no fueron clasificadas.
        ruleIds.forEach(ruleId => {
            if (!allCoverageIds.includes(ruleId)) {
                warnings.push(
                    `La regla ${ruleId} no fue clasificada en la cobertura.`
                );
            }
        });
    }

    // Evaluar la preparación de los casos para su ejecución.
    if (Array.isArray(qaDesign.testCases)) {
        qaDesign.testCases.forEach(testCase => {

            const missingElements = [];

            if (
                !Array.isArray(testCase.preconditions) ||
                testCase.preconditions.length === 0
            ) {
                missingElements.push("precondiciones");
            }

            if (
                !Array.isArray(testCase.steps) ||
                testCase.steps.length === 0
            ) {
                missingElements.push("pasos");
            }

            if (
                !Array.isArray(testCase.testData) ||
                testCase.testData.length === 0
            ) {
                missingElements.push("datos de prueba");
            } else {
                const hasPendingData = testCase.testData.some(
                    data => data.status === "pending"
                );

                if (hasPendingData) {
                    missingElements.push("datos de prueba pendientes");
                }
            }

            if (testCase.expectedResultStatus !== "defined") {
                missingElements.push("resultado esperado pendiente");
            }

            if (missingElements.length > 0) {
                warnings.push(
                    `${testCase.id}: requiere completar ${missingElements.join(", ")} antes de su ejecución.`
                );
            }
        });
    }


    
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}