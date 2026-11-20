
import test from "node:test";
import assert from "node:assert/strict";

import { validateAnalysis } from "../src/validators/analysis-validator.js";

// Análisis mínimo válido para nuestras pruebas.
function createValidAnalysis() {
    return {
        businessRules: [
            {
                id: "RN-001",
                classification: "explicit",
                evidence: "La consulta debe permitir ingresar un IMEI."
            }
        ],
        positiveScenarios: [],
        negativeScenarios: [],
        openQuestions: [],
        testCases: [
            {
                id: "TC-001",
                relatedRules: ["RN-001"],
                priorityReason: "Valida la funcionalidad principal.",
                expectedResultStatus: "defined",
                expectedResult: "El sistema devuelve información registral."
            }
        ]
    };
}

test("Debe aceptar un análisis sin inconsistencias", () => {
    const analysis = createValidAnalysis();

    const result = validateAnalysis(analysis);

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
});

test("Debe detectar IDs duplicados", () => {
    const analysis = createValidAnalysis();

    analysis.testCases.push({
        ...analysis.testCases[0]
    });

    const result = validateAnalysis(analysis);

    assert.equal(result.valid, false);
    assert.ok(
        result.errors.some(error => error.includes("ID duplicado"))
    );
});

test("Debe detectar reglas explícitas sin evidencia", () => {
    const analysis = createValidAnalysis();

    analysis.businessRules[0].evidence = "";

    const result = validateAnalysis(analysis);

    assert.equal(result.valid, false);
    assert.ok(
        result.errors.some(error => error.includes("no tiene evidencia"))
    );
});

test("Debe detectar referencias a reglas inexistentes", () => {
    const analysis = createValidAnalysis();

    analysis.testCases[0].relatedRules = ["RN-999"];

    const result = validateAnalysis(analysis);

    assert.equal(result.valid, false);
    assert.ok(
        result.errors.some(error => error.includes("regla inexistente"))
    );
});

test("Debe detectar casos sin justificación de prioridad", () => {
    const analysis = createValidAnalysis();

    analysis.testCases[0].priorityReason = "";

    const result = validateAnalysis(analysis);

    assert.equal(result.valid, false);
    assert.ok(
        result.errors.some(error => error.includes("justificación de prioridad"))
    );
});

test("Debe detectar resultados definidos que están pendientes", () => {
    const analysis = createValidAnalysis();

    analysis.testCases[0].expectedResult =
        "Pendiente de definición funcional.";

    const result = validateAnalysis(analysis);

    assert.equal(result.valid, false);
});
