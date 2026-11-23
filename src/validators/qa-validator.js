// Verificar si un valor es compatible con JSON.
function isJsonValue(value, seen = new WeakSet()) {

    // Los valores null, string y boolean son válidos.
    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "boolean"
    ) {
        return true;
    }

    // Los números deben ser finitos.
    if (typeof value === "number") {
        return Number.isFinite(value);
    }

    // Rechazar tipos que no sean objetos o arrays.
    if (typeof value !== "object") {
        return false;
    }

    // Detectar referencias circulares.
    if (seen.has(value)) {
        return false;
    }

    seen.add(value);

    let valid = false;

    if (Array.isArray(value)) {
        valid = value.every(item => isJsonValue(item, seen));
    } else if (
        Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null
    ) {
        valid = Object.values(value).every(
            item => isJsonValue(item, seen)
        );
    }

    seen.delete(value);

    return valid;
}

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

    // Validar los elementos de la colección de casos de prueba.
    let validTestCases = [];

    if (!Array.isArray(qaDesign.testCases)) {
        errors.push("La colección de casos de prueba no es válida.");
    } else {
        validTestCases = qaDesign.testCases.filter((testCase, index) => {
            if (
                !testCase ||
                typeof testCase !== "object" ||
                Array.isArray(testCase)
            ) {
                errors.push(
                    `El elemento ${index + 1} de testCases no es válido.`
                );

                return false;
            }

            return true;
        });

        
        // Validar que todos los casos tengan IDs válidos.
        validTestCases.forEach((testCase, index) => {
            if (
                typeof testCase.id !== "string" ||
                testCase.id.trim() === ""
            ) {
                errors.push(
                    `El caso de prueba en la posición ${index + 1} tiene un ID inválido.`
                );
            }
        });

        // Verificar que los casos válidos tengan IDs únicos.
        const testCaseIds = validTestCases
            .map(testCase => testCase.id)
            .filter(id => typeof id === "string" && id.trim() !== "");

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

    // Obtener los elementos válidos de cada colección.
    const getValidItems = (collection) => {
        const items = Array.isArray(functionalAnalysis[collection])
            ? functionalAnalysis[collection]
            : [];

        return items.filter((item, index) => {
            if (
                !item ||
                typeof item !== "object" ||
                Array.isArray(item)
            ) {
                errors.push(
                    `El elemento ${index + 1} de ${collection} no es válido.`
                );

                return false;
            }

            // Validar que el ID sea un string no vacío.
            if (
                typeof item.id !== "string" ||
                item.id.trim() === ""
            ) {
                errors.push(
                    `El elemento ${index + 1} de ${collection} tiene un ID inválido.`
                );

                return false;
            }

            return true;
        });
    };

    // Obtener los IDs de reglas y escenarios del análisis funcional.
    const ruleIds = new Set(
        getValidItems("businessRules").map(rule => rule.id)
    );

    const scenarioIds = new Set([
        ...getValidItems("positiveScenarios").map(scenario => scenario.id),
        ...getValidItems("negativeScenarios").map(scenario => scenario.id)
    ]);

    // Validar referencias de cada caso de prueba.
    if (Array.isArray(qaDesign.testCases)) {
        validTestCases.forEach(testCase => {

            // Validar la coherencia entre el tipo de prueba y la técnica.
            if (
                testCase.testType === "boundary" &&
                testCase.designTechnique !== "boundary_value_analysis"
            ) {
                errors.push(
                    `${testCase.id}: una prueba de tipo boundary debe utilizar boundary_value_analysis como designTechnique.`
                );
            }
            if (
                testCase.designTechnique === "boundary_value_analysis" &&
                testCase.testType !== "boundary"
            ) {
                errors.push(
                    `${testCase.id}: la técnica boundary_value_analysis requiere que el tipo de prueba sea boundary.`
                );
            }

            // Validar que las pruebas boundary tengan datos de prueba.
            if (
                testCase.testType === "boundary" &&
                (
                    !Array.isArray(testCase.testData) ||
                    testCase.testData.length === 0
                )
            ) {
                errors.push(
                    `${testCase.id}: una prueba de tipo boundary debe incluir datos de prueba (testData).`
                );
            }

            // Verificar reglas relacionadas.
            if (!Array.isArray(testCase.relatedRules)) {
                errors.push(
                    `${testCase.id}: relatedRules debe ser un array.`
                );
            } else {
                testCase.relatedRules.forEach(ruleId => {
                    if (!ruleIds.has(ruleId)) {
                        errors.push(
                            `${testCase.id}: referencia a una regla inexistente (${ruleId}).`
                        );
                    }
                });
            }

            // Verificar escenarios relacionados.
            if (!Array.isArray(testCase.relatedScenarios)) {
                errors.push(
                    `${testCase.id}: relatedScenarios debe ser un array.`
                );
            } else {
                testCase.relatedScenarios.forEach(scenarioId => {
                    if (!scenarioIds.has(scenarioId)) {
                        errors.push(
                            `${testCase.id}: referencia a un escenario inexistente (${scenarioId}).`
                        );
                    }
                });
            }

            // Validar coherencia entre el tipo de prueba y los escenarios relacionados.
            if (Array.isArray(testCase.relatedScenarios)) {

                const positiveScenarioIds = new Set(
                    (functionalAnalysis.positiveScenarios || [])
                        .map(scenario => scenario.id)
                );

                const negativeScenarioIds = new Set(
                    (functionalAnalysis.negativeScenarios || [])
                        .map(scenario => scenario.id)
                );

                if (
                    testCase.testType === "positive" &&
                    !testCase.relatedScenarios.some(
                        scenarioId => positiveScenarioIds.has(scenarioId)
                    )
                ) {
                    errors.push(
                        `${testCase.id}: un caso de prueba positivo debe estar relacionado con al menos un escenario positivo.`
                    );
                }

                if (
                    testCase.testType === "negative" &&
                    !testCase.relatedScenarios.some(
                        scenarioId => negativeScenarioIds.has(scenarioId)
                    )
                ) {
                    errors.push(
                        `${testCase.id}: un caso de prueba negativo debe estar relacionado con al menos un escenario negativo.`
                    );
                }
            }

        });
    }

    // Validar prioridades y sus justificaciones.
    if (Array.isArray(qaDesign.testCases)) {
        validTestCases.forEach(testCase => {

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
        validTestCases.forEach(testCase => {

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
    if (
        !qaDesign.coverage ||
        typeof qaDesign.coverage !== "object" ||
        Array.isArray(qaDesign.coverage)
    ) {
        errors.push("La información de cobertura no existe o no es válida.");
    } else {
        const coveredRules = qaDesign.coverage.coveredRules;
        const uncoveredRules = qaDesign.coverage.uncoveredRules;

        // Validar el formato de las colecciones.
        if (!Array.isArray(coveredRules)) {
            errors.push("coveredRules debe ser un array.");
        }

        if (!Array.isArray(uncoveredRules)) {
            errors.push("uncoveredRules debe ser un array.");
        }

        // Procesar únicamente colecciones válidas.
        const validCoveredRules = Array.isArray(coveredRules)
            ? coveredRules
            : [];

        const validUncoveredRules = Array.isArray(uncoveredRules)
            ? uncoveredRules
            : [];

        const allCoverageIds = [
            ...validCoveredRules,
            ...validUncoveredRules
        ];


        // Validar los identificadores de cada colección.
        const validateCoverageIds = (collection, collectionName) => {
            collection.forEach((ruleId, index) => {

                if (typeof ruleId !== "string" || ruleId.trim() === "") {
                    errors.push(
                        `${collectionName}: elemento inválido en la posición ${index + 1}.`
                    );

                    return;
                }

                if (!ruleIds.has(ruleId)) {
                    errors.push(
                        `${collectionName}: referencia a una regla inexistente (${ruleId}).`
                    );
                }
            });
        };

        validateCoverageIds(validCoveredRules, "coveredRules");
        validateCoverageIds(validUncoveredRules, "uncoveredRules");

        // Detectar reglas duplicadas.
        if (new Set(allCoverageIds).size !== allCoverageIds.length) {
            errors.push(
                "Hay reglas duplicadas en la información de cobertura."
            );
        }

        // Comprobar que cada regla cubierta tenga un caso asociado.
        validCoveredRules.forEach(ruleId => {
            const hasTestCase = validTestCases.some(testCase =>
                Array.isArray(testCase.relatedRules) &&
                testCase.relatedRules.includes(ruleId)
            );

            if (!hasTestCase) {
                errors.push(
                    `La regla ${ruleId} figura como cubierta, pero no tiene casos de prueba asociados.`
                );
            }
        });

        // Comprobar que las reglas no cubiertas no tengan casos asociados.
        validUncoveredRules.forEach(ruleId => {
            const hasTestCase = validTestCases.some(testCase =>
                Array.isArray(testCase.relatedRules) &&
                testCase.relatedRules.includes(ruleId)
            );

            if (hasTestCase) {
                errors.push(
                    `La regla ${ruleId} figura como no cubierta, pero tiene casos de prueba asociados.`
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

        // Validar la cobertura de escenarios funcionales.
        const coveredScenarios = qaDesign.coverage.coveredScenarios;
        const uncoveredScenarios = qaDesign.coverage.uncoveredScenarios;

        // Validar el formato de las colecciones.
        if (!Array.isArray(coveredScenarios)) {
            errors.push("coveredScenarios debe ser un array.");
        }

        if (!Array.isArray(uncoveredScenarios)) {
            errors.push("uncoveredScenarios debe ser un array.");
        }

        // Procesar únicamente colecciones válidas.
        const validCoveredScenarios = Array.isArray(coveredScenarios)
            ? coveredScenarios
            : [];

        const validUncoveredScenarios = Array.isArray(uncoveredScenarios)
            ? uncoveredScenarios
            : [];

        const allScenarioCoverageIds = [
            ...validCoveredScenarios,
            ...validUncoveredScenarios
        ];

        // Validar los identificadores de cada colección.
        const validateScenarioCoverageIds = (collection, collectionName) => {
            collection.forEach((scenarioId, index) => {

                if (
                    typeof scenarioId !== "string" ||
                    scenarioId.trim() === ""
                ) {
                    errors.push(
                        `${collectionName}: elemento inválido en la posición ${index + 1}.`
                    );

                    return;
                }

                if (!scenarioIds.has(scenarioId)) {
                    errors.push(
                        `${collectionName}: referencia a un escenario inexistente (${scenarioId}).`
                    );
                }
            });
        };

        validateScenarioCoverageIds(
            validCoveredScenarios,
            "coveredScenarios"
        );

        validateScenarioCoverageIds(
            validUncoveredScenarios,
            "uncoveredScenarios"
        );

        // Detectar escenarios duplicados.
        if (
            new Set(allScenarioCoverageIds).size !==
            allScenarioCoverageIds.length
        ) {
            errors.push(
                "Hay escenarios duplicados en la información de cobertura."
            );
        }

        // Comprobar que cada escenario cubierto tenga un caso asociado.
        validCoveredScenarios.forEach(scenarioId => {
            const hasTestCase = validTestCases.some(testCase =>
                Array.isArray(testCase.relatedScenarios) &&
                testCase.relatedScenarios.includes(scenarioId)
            );

            if (!hasTestCase) {
                errors.push(
                    `El escenario ${scenarioId} figura como cubierto, pero no tiene casos de prueba asociados.`
                );
            }
        });

        // Comprobar que los escenarios no cubiertos no tengan casos asociados.
        validUncoveredScenarios.forEach(scenarioId => {
            const hasTestCase = validTestCases.some(testCase =>
                Array.isArray(testCase.relatedScenarios) &&
                testCase.relatedScenarios.includes(scenarioId)
            );

            if (hasTestCase) {
                errors.push(
                    `El escenario ${scenarioId} figura como no cubierto, pero tiene casos de prueba asociados.`
                );
            }
        });

        // Detectar escenarios que no fueron clasificados.
        scenarioIds.forEach(scenarioId => {
            if (!allScenarioCoverageIds.includes(scenarioId)) {
                warnings.push(
                    `El escenario ${scenarioId} no fue clasificado en la cobertura.`
                );
            }
        });
    }

    // Evaluar la preparación de los casos para su ejecución.
    if (Array.isArray(qaDesign.testCases)) {
        validTestCases.forEach(testCase => {

            const missingElements = [];

            if (
                !Array.isArray(testCase.preconditions) ||
                testCase.preconditions.length === 0
            ) {
                missingElements.push("precondiciones");
            } else {
                testCase.preconditions.forEach((precondition, index) => {
                    if (
                        typeof precondition !== "string" ||
                        precondition.trim() === ""
                    ) {
                        errors.push(
                            `${testCase.id}: el elemento ${index + 1} de preconditions no es válido.`
                        );
                    }
                });
            }

            if (
                !Array.isArray(testCase.steps) ||
                testCase.steps.length === 0
            ) {
                missingElements.push("pasos");
            } else {
                testCase.steps.forEach((step, index) => {
                    if (
                        typeof step !== "string" ||
                        step.trim() === ""
                    ) {
                        errors.push(
                            `${testCase.id}: el elemento ${index + 1} de steps no es válido.`
                        );
                    }
                });
            }

            if (
                !Array.isArray(testCase.testData) ||
                testCase.testData.length === 0
            ) {
                missingElements.push("datos de prueba");
            } else {
                    const validTestData = testCase.testData.filter((data, index) => {
                        if (
                            !data ||
                            typeof data !== "object" ||
                            Array.isArray(data)
                        ) {
                            errors.push(
                                `${testCase.id}: el elemento ${index + 1} de testData no es válido.`
                            );

                            return false;
                        }

                        
                        // Validar el nombre del dato de prueba.
                        if (
                            typeof data.name !== "string" ||
                            data.name.trim() === ""
                        ) {
                            errors.push(
                                `${testCase.id}: el elemento ${index + 1} de testData tiene un nombre inválido.`
                            );

                            return false;
                        }

                        // Validar el estado del dato de prueba.
                        const validStatuses = ["defined", "pending", "example"];

                        if (!validStatuses.includes(data.status)) {
                            errors.push(
                                `${testCase.id}: el elemento ${index + 1} de testData tiene un status inválido.`
                            );

                            return false;
                        }

                        // Validar que los datos definidos tengan un valor.
                        if (data.status === "defined") {
                            const value = data.value;

                            // Rechazar valores ausentes o vacíos.
                            if (
                                value === undefined ||
                                value === null ||
                                (typeof value === "string" && value.trim() === "")
                            ) {
                                errors.push(
                                    `${testCase.id}: el elemento ${index + 1} de testData tiene un value inválido para un dato definido.`
                                );

                                return false;
                            }

                        // Validar que el valor sea compatible con JSON.
                        if (!isJsonValue(value)) {
                            errors.push(
                                `${testCase.id}: el elemento ${index + 1} de testData tiene un tipo de value no permitido.`
                            );

                            return false;
                        }
                    }

                        return true;

                    });

                    const hasPendingData = validTestData.some(
                        data => data.status === "pending"
                    );

                    const allDataPending =
                        validTestData.length > 0 &&
                        validTestData.every(
                            data => data.status === "pending"
                        );

                    if (hasPendingData && !allDataPending) {
                        missingElements.push("datos de prueba pendientes");
                    }

                    if (allDataPending) {
                        warnings.push(
                            `${testCase.id}: todos los datos de prueba están pendientes. El caso todavía no está preparado para ejecutarse.`
                        );
                    }

                    // Advertir cuando todos los datos de prueba están pendientes.
                    if (
                        validTestData.length > 0 &&
                        validTestData.every(
                            data => data.status === "pending"
                        )
                    ) {
                        warnings.push(
                            `${testCase.id}: todos los datos de prueba están pendientes. El caso todavía no está preparado para ejecutarse.`
                        );
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