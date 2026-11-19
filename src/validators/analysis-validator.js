
export function validateAnalysis(analysis) {
    const errors = [];
    const warnings = [];

    // 1. Verificar que exista un análisis.
    if (!analysis || typeof analysis !== "object") {
        return {
            valid: false,
            errors: ["El análisis no existe o no es un objeto válido."],
            warnings
        };
    }

    const collections = [
        "businessRules",
        "positiveScenarios",
        "negativeScenarios",
        "testCases",
        "openQuestions"
    ];

    // 2. Verificar IDs duplicados.
    const registeredIds = new Set();

    for (const collectionName of collections) {
        const items = analysis[collectionName] ?? [];

        for (const item of items) {
            if (!item.id) {
                errors.push(
                    `Existe un elemento sin ID en ${collectionName}.`
                );
                continue;
            }

            if (registeredIds.has(item.id)) {
                errors.push(`ID duplicado: ${item.id}`);
            } else {
                registeredIds.add(item.id);
            }
        }
    }

    // 3. Verificar evidencia de reglas explícitas.
    for (const rule of analysis.businessRules ?? []) {
        if (
            rule.classification === "explicit" &&
            (!rule.evidence || !rule.evidence.trim())
        ) {
            errors.push(
                `La regla ${rule.id} está clasificada como explícita, pero no tiene evidencia.`
            );
        }

        if (
            rule.classification === "inferred" &&
            (!rule.evidence || !rule.evidence.trim())
        ) {
            warnings.push(
                `La regla ${rule.id} es inferida y no tiene evidencia o justificación.`
            );
        }
    }

    // 4. Verificar referencias a reglas existentes.
    const ruleIds = new Set(
        (analysis.businessRules ?? []).map(rule => rule.id)
    );

    for (const testCase of analysis.testCases ?? []) {
        for (const relatedRule of testCase.relatedRules ?? []) {
            if (!ruleIds.has(relatedRule)) {
                errors.push(
                    `El caso ${testCase.id} referencia una regla inexistente: ${relatedRule}.`
                );
            }
        }
    }

    // 5. Verificar justificación de prioridades.
    for (const testCase of analysis.testCases ?? []) {
        if (
            !testCase.priorityReason ||
            !testCase.priorityReason.trim()
        ) {
            errors.push(
                `El caso ${testCase.id} no tiene justificación de prioridad.`
            );
        }
    }

    // 6. Verificar coherencia del resultado esperado.
    for (const testCase of analysis.testCases ?? []) {
        const expectedResult = testCase.expectedResult?.trim() ?? "";

        if (
            testCase.expectedResultStatus === "defined" &&
            (
                !expectedResult ||
                expectedResult.toLowerCase().includes("pendiente de definición")
            )
        ) {
            errors.push(
                `El caso ${testCase.id} está marcado como definido, pero su resultado esperado está pendiente o vacío.`
            );
        }

        if (
            testCase.expectedResultStatus === "pending" &&
            !expectedResult
        ) {
            errors.push(
                `El caso ${testCase.id} está marcado como pendiente, pero no explica el resultado esperado.`
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
