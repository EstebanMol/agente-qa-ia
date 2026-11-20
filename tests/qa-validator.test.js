import test from "node:test";
import assert from "node:assert/strict";
import { validateQaDesign } from "../src/validators/qa-validator.js";


// Análisis funcional simulado.
const functionalAnalysis = {
    businessRules: [
        { id: "RN-01" },
        { id: "RN-02" }
    ],
    positiveScenarios: [
        { id: "EP-01" }
    ],
    negativeScenarios: [
        { id: "EN-01" }
    ]
};

// Diseño de QA simulado.
const qaDesign = {
    coverage: {
        coveredRules: ["RN-01", "RN-02"],
        uncoveredRules: []
    },
    testCases: [
        {
            id: "TC-01",
            priority: "high",
            priorityReason: "Valida una funcionalidad principal.",
            expectedResult: "El sistema devuelve la información solicitada.",
            expectedResultStatus: "defined",
            preconditions: ["El usuario está autorizado."],
            steps: ["Ingresar el IMEI.", "Ejecutar la consulta."],
            testData: [
                {
                    name: "IMEI",
                    value: "123456789012345",
                    status: "defined"
                }
            ],
            relatedRules: ["RN-01"],
            relatedScenarios: ["EP-01"]
        },
        {
            id: "TC-02",
            priority: "medium",
            priorityReason: "Valida un escenario alternativo.",
            expectedResult: "El sistema informa que no existe una sustracción vigente.",
            expectedResultStatus: "defined",
            preconditions: ["El usuario está autorizado."],
            steps: ["Ingresar un IMEI sin sustracción vigente."],
            testData: [
                {
                    name: "IMEI",
                    value: "987654321098765",
                    status: "defined"
                }
            ],
            relatedRules: ["RN-02"],
            relatedScenarios: ["EN-01"]
        }
    ]
};

test("Debe aceptar un diseño de QA sin inconsistencias", () => {

    const result = validateQaDesign(
        qaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
});

test("Debe detectar IDs duplicados en los casos de prueba", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Provocar un ID duplicado.
    invalidQaDesign.testCases[1].id = "TC-01";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("IDs duplicados"))
    );
});

test("Debe detectar referencias a reglas inexistentes", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Introducir una referencia a una regla inexistente.
    invalidQaDesign.testCases[0].relatedRules.push("RN-99");

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("regla inexistente") &&
            error.includes("RN-99")
        )
    );
});

test("Debe detectar prioridades inválidas", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Introducir una prioridad no permitida.
    invalidQaDesign.testCases[0].priority = "urgent";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("prioridad inválida")
        )
    );
});

test("Debe detectar casos sin justificación de prioridad", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Eliminar la justificación de prioridad.
    invalidQaDesign.testCases[0].priorityReason = "";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("no tiene una justificación de prioridad")
        )
    );
});

test("Debe detectar resultados esperados definidos sin descripción", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Eliminar el resultado esperado.
    invalidQaDesign.testCases[0].expectedResult = "";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("resultado está definido")
        )
    );
});

test("Debe detectar reglas cubiertas sin casos de prueba asociados", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Eliminar la referencia a RN-02 de todos los casos.
    invalidQaDesign.testCases.forEach(testCase => {
        testCase.relatedRules = testCase.relatedRules.filter(
            ruleId => ruleId !== "RN-02"
        );
    });

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("RN-02") &&
            error.includes("no tiene casos de prueba asociados")
        )
    );
});

test("Debe detectar referencias a escenarios inexistentes", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].relatedScenarios.push("EP-99");

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("EP-99") &&
            error.includes("escenario inexistente")
        )
    );
});

test("Debe advertir cuando un caso tiene datos de prueba pendientes", () => {

    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].testData[0].status = "pending";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("datos de prueba pendientes")
        )
    );
});

test("Debe advertir cuando el resultado esperado está pendiente", () => {

    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].expectedResultStatus = "pending";
    incompleteQaDesign.testCases[0].expectedResult = "";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("resultado esperado")
        )
    );
});

test("Debe advertir cuando un caso no tiene pasos de ejecución", () => {

    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].steps = [];

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("pasos")
        )
    );
});

test("Debe advertir cuando un caso no tiene precondiciones", () => {

    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].preconditions = [];

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("precondiciones")
        )
    );
});

test("Debe detectar colecciones inválidas en el análisis funcional", () => {

    const invalidFunctionalAnalysis = structuredClone(functionalAnalysis);

    invalidFunctionalAnalysis.businessRules = {};

    const result = validateQaDesign(
        qaDesign,
        invalidFunctionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("businessRules")
        )
    );
});




