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
    valid = value.every((item) => isJsonValue(item, seen));
  } else if (
    Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null
  ) {
    valid = Object.values(value).every((item) => isJsonValue(item, seen));
  }

  seen.delete(value);

  return valid;
}

// Validar la cobertura de reglas o escenarios funcionales.
function validateCoverage({
  coverage,
  coveredKey,
  uncoveredKey,
  validIds,
  relatedField,
  entityLabel,
  indefiniteArticle,
  definiteArticle,
  coveredStatus,
  uncoveredStatus,
  pluralLabel,
  errors,
  warnings,
  testCases,
}) {
  const coveredItems = coverage[coveredKey];
  const uncoveredItems = coverage[uncoveredKey];

  // Validar el formato de las colecciones.
  if (!Array.isArray(coveredItems)) {
    errors.push(`${coveredKey} debe ser un array.`);
  }

  if (!Array.isArray(uncoveredItems)) {
    errors.push(`${uncoveredKey} debe ser un array.`);
  }

  // Procesar únicamente colecciones válidas.
  const validCoveredItems = Array.isArray(coveredItems) ? coveredItems : [];

  const validUncoveredItems = Array.isArray(uncoveredItems)
    ? uncoveredItems
    : [];

  const allCoverageIds = [...validCoveredItems, ...validUncoveredItems];

  // Validar los identificadores de cada colección.
  const validateCoverageIds = (collection, collectionName) => {
    collection.forEach((itemId, index) => {
      if (typeof itemId !== "string" || itemId.trim() === "") {
        errors.push(
          `${collectionName}: elemento inválido en la posición ${index + 1}.`,
        );

        return;
      }

      if (!validIds.has(itemId)) {
        errors.push(
          `${collectionName}: referencia a ${indefiniteArticle} ${entityLabel} inexistente (${itemId}).`,
        );
      }
    });
  };

  validateCoverageIds(validCoveredItems, coveredKey);
  validateCoverageIds(validUncoveredItems, uncoveredKey);

  // Detectar elementos duplicados.
  if (new Set(allCoverageIds).size !== allCoverageIds.length) {
    errors.push(
      `Hay ${pluralLabel} duplicados en la información de cobertura.`,
    );
  }

  // Comprobar que cada elemento cubierto tenga un caso asociado.
  validCoveredItems.forEach((itemId) => {
    const hasTestCase = testCases.some(
      (testCase) =>
        Array.isArray(testCase[relatedField]) &&
        testCase[relatedField].includes(itemId),
    );

    if (!hasTestCase) {
      errors.push(
        `${definiteArticle} ${entityLabel} ${itemId} figura como ${coveredStatus}, pero no tiene casos de prueba asociados.`,
      );
    }
  });

  // Comprobar que los elementos no cubiertos no tengan casos asociados.
  validUncoveredItems.forEach((itemId) => {
    const hasTestCase = testCases.some(
      (testCase) =>
        Array.isArray(testCase[relatedField]) &&
        testCase[relatedField].includes(itemId),
    );

    if (hasTestCase) {
      errors.push(
        `${definiteArticle} ${entityLabel} ${itemId} figura como ${uncoveredStatus}, pero tiene casos de prueba asociados.`,
      );
    }
  });

  // Detectar elementos que no fueron clasificados.
  validIds.forEach((itemId) => {
    if (!allCoverageIds.includes(itemId)) {
      warnings.push(
        `${definiteArticle} ${entityLabel} ${itemId} no fue clasificado en la cobertura.`,
      );
    }
  });
}

// Calcular la cobertura efectiva a partir de las referencias reales.
function calculateEffectiveCoverage({
  validIds,
  testCases,
  relatedField,
}) {
  const coveredIds = new Set();

  testCases.forEach((testCase) => {
    if (!Array.isArray(testCase[relatedField])) {
      return;
    }

    testCase[relatedField].forEach((itemId) => {
      if (validIds.has(itemId)) {
        coveredIds.add(itemId);
      }
    });
  });

  const total = validIds.size;
  const covered = coveredIds.size;
  const uncovered = total - covered;

  const percentage =
    total === 0 ? 0 : Math.round((covered / total) * 100);

  return {
    total,
    covered,
    uncovered,
    percentage,
  };
}

export function validateQaDesign(qaDesign, functionalAnalysis) {
  const errors = [];
  const warnings = [];

  // Verificar que exista el diseño de QA.
  if (!qaDesign || typeof qaDesign !== "object") {
    return {
      valid: false,
      errors: ["El diseño de QA no existe o no es válido."],
      warnings,
    };
  }

  // Verificar que exista el análisis funcional de origen.
  if (!functionalAnalysis || typeof functionalAnalysis !== "object") {
    return {
      valid: false,
      errors: ["El análisis funcional de origen no existe o no es válido."],
      warnings,
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
        errors.push(`El elemento ${index + 1} de testCases no es válido.`);

        return false;
      }

      return true;
    });

    // Validar que todos los casos tengan IDs válidos.
    validTestCases.forEach((testCase, index) => {
      if (typeof testCase.id !== "string" || testCase.id.trim() === "") {
        errors.push(
          `El caso de prueba en la posición ${index + 1} tiene un ID inválido.`,
        );
      }
    });

    // Verificar que los casos válidos tengan IDs únicos.
    const testCaseIds = validTestCases
      .map((testCase) => testCase.id)
      .filter((id) => typeof id === "string" && id.trim() !== "");

    const duplicatedIds = testCaseIds.filter(
      (id, index) => testCaseIds.indexOf(id) !== index,
    );

    if (duplicatedIds.length > 0) {
      errors.push(
        `Se encontraron IDs duplicados en los casos de prueba: ${[...new Set(duplicatedIds)].join(", ")}`,
      );
    }
  }

  // Validar las colecciones del análisis funcional.
  const collections = [
    "businessRules",
    "positiveScenarios",
    "negativeScenarios",
  ];

  collections.forEach((collection) => {
    if (!Array.isArray(functionalAnalysis[collection])) {
      errors.push(
        `La colección ${collection} del análisis funcional no es válida.`,
      );
    }
  });

  // Obtener los elementos válidos de cada colección.
  const getValidItems = (collection) => {
    const items = Array.isArray(functionalAnalysis[collection])
      ? functionalAnalysis[collection]
      : [];

    return items.filter((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`El elemento ${index + 1} de ${collection} no es válido.`);

        return false;
      }

      // Validar que el ID sea un string no vacío.
      if (typeof item.id !== "string" || item.id.trim() === "") {
        errors.push(
          `El elemento ${index + 1} de ${collection} tiene un ID inválido.`,
        );

        return false;
      }

      return true;
    });
  };

   // Obtener las colecciones válidas del análisis funcional.
  const businessRules = getValidItems("businessRules");
  const positiveScenarios = getValidItems("positiveScenarios");
  const negativeScenarios = getValidItems("negativeScenarios");

  // Detectar IDs duplicados dentro de una colección.
  const detectDuplicateIds = (items, collectionName) => {
    const seenIds = new Set();
    const reportedIds = new Set();

    items.forEach((item) => {
      if (seenIds.has(item.id)) {
        if (!reportedIds.has(item.id)) {
          errors.push(
            `El ID ${item.id} está duplicado en ${collectionName}.`,
          );
          reportedIds.add(item.id);
        }
      } else {
        seenIds.add(item.id);
      }
    });
  };

    // Detectar referencias duplicadas dentro de un caso de prueba.
    const detectDuplicateReferences = (references, fieldName, testCaseId) => {
    const seenIds = new Set();
    const reportedIds = new Set();

    references.forEach((referenceId) => {
      if (seenIds.has(referenceId)) {
        if (!reportedIds.has(referenceId)) {
          errors.push(
            `${testCaseId}: el ID ${referenceId} está duplicado en ${fieldName}.`,
          );
          reportedIds.add(referenceId);
        }
      } else {
        seenIds.add(referenceId);
      }
    });
  };

  // Validar duplicados en cada colección.
  detectDuplicateIds(businessRules, "businessRules");
  detectDuplicateIds(positiveScenarios, "positiveScenarios");
  detectDuplicateIds(negativeScenarios, "negativeScenarios");

  // Obtener los IDs de reglas y escenarios.
  const ruleIds = new Set(businessRules.map((rule) => rule.id));

  const positiveScenarioIds = new Set(
    positiveScenarios.map((scenario) => scenario.id),
  );

  const negativeScenarioIds = new Set(
    negativeScenarios.map((scenario) => scenario.id),
  );

  // Detectar colisiones entre escenarios positivos y negativos.
  positiveScenarioIds.forEach((scenarioId) => {
    if (negativeScenarioIds.has(scenarioId)) {
      errors.push(
        `El ID ${scenarioId} está duplicado entre positiveScenarios y negativeScenarios.`,
      );
    }
  });

  const scenarioIds = new Set([
    ...positiveScenarioIds,
    ...negativeScenarioIds,
  ]);

  // Validar referencias de cada caso de prueba.
  if (Array.isArray(qaDesign.testCases)) {
    validTestCases.forEach((testCase) => {
      // Validar la coherencia entre el tipo de prueba y la técnica.
      if (
        testCase.testType === "boundary" &&
        testCase.designTechnique !== "boundary_value_analysis"
      ) {
        errors.push(
          `${testCase.id}: una prueba de tipo boundary debe utilizar boundary_value_analysis como designTechnique.`,
        );
      }
      if (
        testCase.designTechnique === "boundary_value_analysis" &&
        testCase.testType !== "boundary"
      ) {
        errors.push(
          `${testCase.id}: la técnica boundary_value_analysis requiere que el tipo de prueba sea boundary.`,
        );
      }

      // Validar que las pruebas boundary tengan datos de prueba.
      if (
        testCase.testType === "boundary" &&
        (!Array.isArray(testCase.testData) || testCase.testData.length === 0)
      ) {
        errors.push(
          `${testCase.id}: una prueba de tipo boundary debe incluir datos de prueba (testData).`,
        );
      }

      // Verificar reglas relacionadas.
      if (!Array.isArray(testCase.relatedRules)) {
        errors.push(`${testCase.id}: relatedRules debe ser un array.`);
      } else {
        detectDuplicateReferences(
          testCase.relatedRules,
          "relatedRules",
          testCase.id,
        );

        testCase.relatedRules.forEach((ruleId) => {
          if (!ruleIds.has(ruleId)) {
            errors.push(
              `${testCase.id}: referencia a una regla inexistente (${ruleId}).`,
            );
          }
        });
      }

      // Verificar escenarios relacionados.
      if (!Array.isArray(testCase.relatedScenarios)) {
        errors.push(`${testCase.id}: relatedScenarios debe ser un array.`);
      } else {
        detectDuplicateReferences(
          testCase.relatedScenarios,
          "relatedScenarios",
          testCase.id,
        );

        testCase.relatedScenarios.forEach((scenarioId) => {
          if (!scenarioIds.has(scenarioId)) {
            errors.push(
              `${testCase.id}: referencia a un escenario inexistente (${scenarioId}).`,
            );
          }
        });
      }

      // Validar coherencia entre el tipo de prueba y los escenarios relacionados.
      if (Array.isArray(testCase.relatedScenarios)) {
        if (
          testCase.testType === "positive" &&
          !testCase.relatedScenarios.some((scenarioId) =>
            positiveScenarioIds.has(scenarioId),
          )
        ) {
          errors.push(
            `${testCase.id}: un caso de prueba positivo debe estar relacionado con al menos un escenario positivo.`,
          );
        }

        if (
          testCase.testType === "negative" &&
          !testCase.relatedScenarios.some((scenarioId) =>
            negativeScenarioIds.has(scenarioId),
          )
        ) {
          errors.push(
            `${testCase.id}: un caso de prueba negativo debe estar relacionado con al menos un escenario negativo.`,
          );
        }
      }
    });
  }

  // Validar prioridades y sus justificaciones.
  if (Array.isArray(qaDesign.testCases)) {
    validTestCases.forEach((testCase) => {
      const validPriorities = ["critical", "high", "medium", "low"];

      if (!validPriorities.includes(testCase.priority)) {
        errors.push(
          `${testCase.id}: prioridad inválida (${testCase.priority}).`,
        );
      }

      if (
        typeof testCase.priorityReason !== "string" ||
        testCase.priorityReason.trim() === ""
      ) {
        errors.push(`${testCase.id}: no tiene una justificación de prioridad.`);
      }
      if (
        typeof testCase.designTechniqueReason !== "string" ||
        testCase.designTechniqueReason.trim() === ""
      ) {
        errors.push(
            `${testCase.id}: no tiene una justificación de la técnica de diseño.`
        );
      }
    });
  }

  // Validar coherencia del resultado esperado.
  if (Array.isArray(qaDesign.testCases)) {
    validTestCases.forEach((testCase) => {
      const hasExpectedResult =
        typeof testCase.expectedResult === "string" &&
        testCase.expectedResult.trim() !== "";

      if (testCase.expectedResultStatus === "defined" && !hasExpectedResult) {
        errors.push(
          `${testCase.id}: el resultado está definido pero no tiene descripción.`,
        );
      }

      if (testCase.expectedResultStatus === "pending" && hasExpectedResult) {
        warnings.push(
          `${testCase.id}: tiene una descripción de resultado esperado, pero su estado figura como pendiente. Revisar si se trata de un ejemplo o de una definición confirmada.`,
        );
      }
    });
  }


  let effectiveRulesCoverage = null;
  let effectiveScenariosCoverage = null;
  // Validar la estructura de la información de cobertura.
  if (
    !qaDesign.coverage ||
    typeof qaDesign.coverage !== "object" ||
    Array.isArray(qaDesign.coverage)
  ) {
    errors.push("La información de cobertura no existe o no es válida.");
  } else {
    // Validar la cobertura de reglas de negocio.
    validateCoverage({
      coverage: qaDesign.coverage,
      coveredKey: "coveredRules",
      uncoveredKey: "uncoveredRules",
      validIds: ruleIds,
      relatedField: "relatedRules",
      entityLabel: "regla",
      indefiniteArticle: "una",
      definiteArticle: "La",
      coveredStatus: "cubierta",
      uncoveredStatus: "no cubierta",
      pluralLabel: "reglas",
      errors,
      warnings,
      testCases: validTestCases,
    });

    effectiveRulesCoverage = calculateEffectiveCoverage({
      validIds: ruleIds,
      testCases: validTestCases,
      relatedField: "relatedRules",
    });


    // Validar la cobertura de escenarios funcionales.
    validateCoverage({
      coverage: qaDesign.coverage,
      coveredKey: "coveredScenarios",
      uncoveredKey: "uncoveredScenarios",
      validIds: scenarioIds,
      relatedField: "relatedScenarios",
      entityLabel: "escenario",
      indefiniteArticle: "un",
      definiteArticle: "El",
      coveredStatus: "cubierto",
      uncoveredStatus: "no cubierto",
      pluralLabel: "escenarios",
      errors,
      warnings,
      testCases: validTestCases,
    });

    effectiveScenariosCoverage = calculateEffectiveCoverage({
      validIds: scenarioIds,
      testCases: validTestCases,
      relatedField: "relatedScenarios",
    });

  }

  // Evaluar la preparación de los casos para su ejecución.
  if (Array.isArray(qaDesign.testCases)) {
    validTestCases.forEach((testCase) => {
      const missingElements = [];

      if (
        !Array.isArray(testCase.preconditions) ||
        testCase.preconditions.length === 0
      ) {
        missingElements.push("precondiciones");
      } else {
        testCase.preconditions.forEach((precondition, index) => {
          if (typeof precondition !== "string" || precondition.trim() === "") {
            errors.push(
              `${testCase.id}: el elemento ${index + 1} de preconditions no es válido.`,
            );
          }
        });
      }

      if (!Array.isArray(testCase.steps) || testCase.steps.length === 0) {
        missingElements.push("pasos");
      } else {
        testCase.steps.forEach((step, index) => {
          if (typeof step !== "string" || step.trim() === "") {
            errors.push(
              `${testCase.id}: el elemento ${index + 1} de steps no es válido.`,
            );
          }
        });
      }

      if (!Array.isArray(testCase.testData) || testCase.testData.length === 0) {
        missingElements.push("datos de prueba");
      } else {
        const validTestData = testCase.testData.filter((data, index) => {
          if (!data || typeof data !== "object" || Array.isArray(data)) {
            errors.push(
              `${testCase.id}: el elemento ${index + 1} de testData no es válido.`,
            );

            return false;
          }

          // Validar el nombre del dato de prueba.
          if (typeof data.name !== "string" || data.name.trim() === "") {
            errors.push(
              `${testCase.id}: el elemento ${index + 1} de testData tiene un nombre inválido.`,
            );

            return false;
          }

          // Validar el estado del dato de prueba.
          const validStatuses = ["defined", "pending", "example"];

          if (!validStatuses.includes(data.status)) {
            errors.push(
              `${testCase.id}: el elemento ${index + 1} de testData tiene un status inválido.`,
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
                `${testCase.id}: el elemento ${index + 1} de testData tiene un value inválido para un dato definido.`,
              );

              return false;
            }
          }

          // Validar cualquier valor proporcionado, independientemente del estado.
          if (data.value !== undefined && !isJsonValue(data.value)) {
            errors.push(
              `${testCase.id}: el elemento ${index + 1} de testData tiene un tipo de value no permitido.`,
            );

            return false;
          }

          return true;
        });

        const hasPendingData = validTestData.some(
          (data) => data.status === "pending",
        );

        const hasExampleData = validTestData.some(
          (data) => data.status === "example",
        );

        const allDataPending =
          validTestData.length > 0 &&
          validTestData.every((data) => data.status === "pending");

        const allDataExample =
          validTestData.length > 0 &&
          validTestData.every((data) => data.status === "example");

        // Identificar datos pendientes cuando no todos lo están.
        if (hasPendingData && !allDataPending) {
          missingElements.push("datos de prueba pendientes");
        }

        // Identificar datos de ejemplo que requieren confirmación.
        if (hasExampleData && !allDataExample) {
          missingElements.push("datos de prueba de ejemplo por confirmar");
        }

        // Advertir cuando todos los datos están pendientes.
        if (allDataPending) {
          warnings.push(
            `${testCase.id}: todos los datos de prueba están pendientes. El caso todavía no está preparado para ejecutarse.`,
          );
        }

        // Advertir cuando todos los datos son ejemplos.
        if (allDataExample) {
          warnings.push(
            `${testCase.id}: todos los datos de prueba son ejemplos y requieren confirmación antes de ejecutar el caso.`,
          );
        }
      }

      if (testCase.expectedResultStatus !== "defined") {
        missingElements.push("resultado esperado pendiente");
      }

      if (missingElements.length > 0) {
        warnings.push(
          `${testCase.id}: requiere completar ${missingElements.join(", ")} antes de su ejecución.`,
        );
      }
    });
  }

 return {
  valid: errors.length === 0,
  errors,
  warnings,
  effectiveRulesCoverage,
  effectiveScenariosCoverage,
};
}
