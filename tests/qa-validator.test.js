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
    uncoveredRules: [],
    coverageObservations: [],
    coveredScenarios: ["EP-01", "EN-01"],
    uncoveredScenarios: [],
    scenarioCoverageObservations: []
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
            title: "Consultar IMEI con información disponible",
            objective: "Verificar que el sistema devuelva la información correspondiente al IMEI.",
            testType: "positive",
            designTechnique: "use_case",
            designTechniqueReason: "Se utiliza para validar el flujo completo de consulta desde la perspectiva del usuario.",
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
            title: "Consultar IMEI sin sustracción vigente",
            objective: "Verificar la respuesta del sistema cuando el IMEI no registra una sustracción vigente.",
            testType: "negative",
            designTechnique: "equivalence_partitioning",
            designTechniqueReason: "Se utiliza para verificar el comportamiento de una clase de equivalencia: IMEI sin sustracción vigente.",
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

test("Debe calcular correctamente la preparación de casos listos para ejecución", () => {
    const result = validateQaDesign(
        qaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.total, 2);
    assert.equal(result.executionReadiness.ready, 2);
    assert.equal(result.executionReadiness.notReady, 0);
    assert.equal(result.executionReadiness.percentage, 100);

    assert.equal(
        result.executionReadiness.details[0].status,
        "ready"
    );

    assert.equal(
        result.executionReadiness.details[1].status,
        "ready"
    );
});

test("Debe identificar casos no preparados por tener datos pendientes", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].testData[0].status = "pending";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.total, 2);
    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "datos de prueba pendientes"
        )
    );
});

test("Debe identificar casos no preparados por tener pasos inválidos", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].steps[0] = "";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "pasos inválidos"
        )
    );
});

test("Debe identificar casos no preparados por tener precondiciones inválidas", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].preconditions[0] = "";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "precondiciones inválidas"
        )
    );
});

test("Debe identificar casos no preparados por tener datos de prueba inválidos", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].testData[0].name = "";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "datos de prueba inválidos"
        )
    );
});

test("Debe identificar casos no preparados por tener el resultado esperado vacío", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].expectedResult = "";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "resultado esperado pendiente"
        )
    );
});

test("Debe identificar casos no preparados por tener el resultado esperado pendiente", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].expectedResultStatus = "pending";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "resultado esperado pendiente"
        )
    );
});

test("Debe identificar casos no preparados por tener datos de ejemplo", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].testData[0].status = "example";

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.ready, 1);
    assert.equal(result.executionReadiness.notReady, 1);
    assert.equal(result.executionReadiness.percentage, 50);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "datos de prueba de ejemplo por confirmar"
        )
    );
});

test("Debe calcular métricas de preparación cuando no hay casos de prueba", () => {
    const emptyQaDesign = structuredClone(qaDesign);

    emptyQaDesign.testCases = [];

    const result = validateQaDesign(
        emptyQaDesign,
        functionalAnalysis
    );

    assert.equal(result.executionReadiness.total, 0);
    assert.equal(result.executionReadiness.ready, 0);
    assert.equal(result.executionReadiness.notReady, 0);
    assert.equal(result.executionReadiness.percentage, 0);
    assert.deepEqual(result.executionReadiness.details, []);
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

test("Debe detectar casos de prueba sin IDs válidos", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    // Provocar un ID de tipo incorrecto.
    invalidQaDesign.testCases[0].id = 123;

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("ID"))
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

    incompleteQaDesign.testCases[0].testData.push({
        name: "Estado del dispositivo",
        value: "Activo",
        status: "defined"
    });

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
    console.log(incompleteQaDesign.testCases[0].testData);

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

test("Debe detectar elementos inválidos en las precondiciones", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].preconditions.push(null);

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("preconditions"))
    );
});


test("Debe detectar datos de prueba sin nombres válidos", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].name = "";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("testData"))
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

test("Debe manejar elementos null en los escenarios del análisis funcional", () => {

    const invalidFunctionalAnalysis = structuredClone(functionalAnalysis);

    invalidFunctionalAnalysis.positiveScenarios = [
        null,
        ...invalidFunctionalAnalysis.positiveScenarios
    ];

    let result;

    assert.doesNotThrow(() => {
        result = validateQaDesign(
            qaDesign,
            invalidFunctionalAnalysis
        );
    });

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("positiveScenarios")
        )
    );
});

test("Debe manejar elementos null en los escenarios negativos del análisis funcional", () => {

    const invalidFunctionalAnalysis = structuredClone(functionalAnalysis);

    invalidFunctionalAnalysis.negativeScenarios = [
        null,
        ...invalidFunctionalAnalysis.negativeScenarios
    ];

    let result;

    assert.doesNotThrow(() => {
        result = validateQaDesign(
            qaDesign,
            invalidFunctionalAnalysis
        );
    });

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("negativeScenarios")
        )
    );
});

test("Debe detectar elementos inválidos en las reglas de negocio", () => {
    const invalidFunctionalAnalysis = structuredClone(functionalAnalysis);

    invalidFunctionalAnalysis.businessRules.push(null);

    const result = validateQaDesign(qaDesign, invalidFunctionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("businessRules")));
});

test("Debe detectar elementos inválidos en los casos de prueba", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases.push(null);

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("testCases")));
});

test("Debe detectar elementos inválidos en los datos de prueba", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData.push(null);

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("testData")));
});


test("Debe detectar elementos inválidos en los pasos de ejecución", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].steps.push(null);

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("steps")));
});


test("Debe detectar relatedRules con formato inválido", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].relatedRules = "RN-01";

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("relatedRules")));
});

test("Debe detectar coveredRules con formato inválido", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.coverage.coveredRules = "RN-01";

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("coveredRules")));
});

test("Debe detectar uncoveredRules con formato inválido", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.coverage.uncoveredRules = "RN-01";

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("uncoveredRules")));
});

test("Debe detectar elementos inválidos en coveredRules", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.coverage.coveredRules = [
        "RN-01",
        null,
        123,
        {}
    ];

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("coveredRules")));
});

test("Debe detectar elementos inválidos en uncoveredRules", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.coverage.uncoveredRules = [
        "RN-01",
        null,
        123,
        {}
    ];

    const result = validateQaDesign(invalidQaDesign, functionalAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("uncoveredRules")));
});

test("Debe detectar reglas de negocio sin IDs válidos", () => {
    const invalidAnalysis = structuredClone(functionalAnalysis);

    invalidAnalysis.businessRules[0].id = 123;

    const result = validateQaDesign(qaDesign, invalidAnalysis);

    assert.equal(result.valid, false);
    assert.ok(result.errors.some(error => error.includes("businessRules")));
});

test("Debe detectar estados inválidos en los datos de prueba", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "invalid";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("status"))
    );
});

test("Debe detectar datos definidos sin valores válidos", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "defined";
    invalidQaDesign.testCases[0].testData[0].value = "";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("value"))
    );
});

test("Debe rechazar datos definidos con valor null", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "defined";
    invalidQaDesign.testCases[0].testData[0].value = null;

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("value inválido"))
    );
});

test("Debe aceptar datos pendientes con valor null y marcarlos como no listos", () => {
    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.testCases[0].testData[0].status = "pending";
    incompleteQaDesign.testCases[0].testData[0].value = null;

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.equal(
        result.executionReadiness.details[0].status,
        "notReady"
    );

    assert.ok(
        result.executionReadiness.details[0].missingElements.includes(
            "datos de prueba pendientes"
        )
    );
});

test("Debe aceptar distintos tipos de valores en datos de prueba", () => {
    const validQaDesign = structuredClone(qaDesign);

    const testData = validQaDesign.testCases[0].testData;

    testData[0].value = "30123456";
    testData[0].status = "defined";

    testData.push(
        { name: "Cantidad", value: 12345, status: "defined" },
        { name: "Activo", value: false, status: "defined" },
        { name: "Usuario", value: { nombre: "Juan" }, status: "defined" },
        { name: "Códigos", value: [1, 2, 3], status: "defined" }
    );

    const result = validateQaDesign(
        validQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);
});

test("Debe detectar tipos de valores no permitidos en datos de prueba", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "defined";
    invalidQaDesign.testCases[0].testData[0].value = new Date();

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("value"))
    );
});

test("Debe detectar números no válidos en los datos de prueba", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "defined";
    invalidQaDesign.testCases[0].testData[0].value = NaN;

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("value"))
    );
});

test("Debe detectar valores no válidos dentro de objetos y arrays", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "defined";
    invalidQaDesign.testCases[0].testData[0].value = {
        importe: 100,
        detalles: {
            descuento: Infinity
        },
        codigos: [1, 2, NaN]
    };

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error => error.includes("value"))
    );
});

test("Debe detectar reglas no cubiertas que tienen casos de prueba asociados", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    // Buscar un caso que tenga al menos una regla relacionada.
    const testCase = invalidQaDesign.testCases.find(
        testCase => testCase.relatedRules.length > 0
    );

    const ruleId = testCase.relatedRules[0];

    // Declarar esa regla como no cubierta.
    invalidQaDesign.coverage.coveredRules =
        invalidQaDesign.coverage.coveredRules.filter(
            id => id !== ruleId
        );

    invalidQaDesign.coverage.uncoveredRules.push(ruleId);

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("no cubierta") &&
            error.includes(ruleId)
        )
    );
});

test("Debe detectar técnicas incompatibles con pruebas de valores límite", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testType = "boundary";
    invalidQaDesign.testCases[0].designTechnique = "use_case";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("boundary") &&
            error.includes("designTechnique")
        )
    );
});

test("Debe detectar pruebas boundary sin datos de prueba", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testType = "boundary";
    invalidQaDesign.testCases[0].designTechnique =
        "boundary_value_analysis";

    invalidQaDesign.testCases[0].testData = [];

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("boundary") &&
            error.includes("testData")
        )
    );
});

test("Debe advertir cuando todos los datos de prueba están pendientes", () => {
    const invalidQaDesign = structuredClone(qaDesign);

    const testCase = invalidQaDesign.testCases[0];

    testCase.testData.forEach(testData => {
        testData.status = "pending";
    });

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes(testCase.id) &&
            warning.includes("todos") 
        )
    );

    assert.ok(
    !result.warnings.some(warning =>
        warning.includes("requiere completar datos de prueba pendientes")
    )
    );
});

test("Debe detectar análisis de valores límite en pruebas que no son boundary", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    const testCase = invalidQaDesign.testCases[0];

    testCase.testType = "positive";
    testCase.designTechnique = "boundary_value_analysis";

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes(testCase.id) &&
            error.includes("boundary")
        )
    );
});

test("Debe detectar casos positivos sin escenarios positivos relacionados", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    const testCase = invalidQaDesign.testCases[0];

    testCase.testType = "positive";
    testCase.relatedScenarios = ["EN-01"];

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes(testCase.id) &&
            error.includes("escenario positivo")
        )
    );
});

test("Debe detectar escenarios cubiertos sin casos de prueba asociados", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.coverage.coveredScenarios = ["EP-01"];
    invalidQaDesign.testCases.forEach(testCase => {
        testCase.relatedScenarios = [];
    });

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("EP-01") &&
            error.includes("cubierto") &&
            error.includes("casos de prueba asociados")
        )
    );
});

test("Debe detectar escenarios no cubiertos con casos de prueba asociados", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.coverage.coveredScenarios = ["EN-01"];
    invalidQaDesign.coverage.uncoveredScenarios = ["EP-01"];

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("EP-01") &&
            error.includes("no cubierto") &&
            error.includes("casos de prueba asociados")
        )
    );
});

test("Debe advertir cuando un escenario no está clasificado en la cobertura", () => {

    const incompleteQaDesign = structuredClone(qaDesign);

    incompleteQaDesign.coverage.coveredScenarios = ["EP-01"];
    incompleteQaDesign.coverage.uncoveredScenarios = [];

    const result = validateQaDesign(
        incompleteQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("EN-01") &&
            warning.includes("cobertura")
        )
    );
});

test("Debe aceptar valores de ejemplo válidos y advertir que requieren confirmación", () => {

    const exampleQaDesign = structuredClone(qaDesign);

    exampleQaDesign.testCases[0].testData[0].status = "example";

    const result = validateQaDesign(
        exampleQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("datos de prueba") &&
            warning.includes("ejemplos")
        )
    );
});

test("Debe detectar valores no permitidos en datos pendientes", () => {

    const invalidQaDesign = structuredClone(qaDesign);

    invalidQaDesign.testCases[0].testData[0].status = "pending";
    invalidQaDesign.testCases[0].testData[0].value = NaN;

    const result = validateQaDesign(
        invalidQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("tipo de value no permitido")
        )
    );
});

test("Debe advertir cuando todos los datos de prueba son ejemplos", () => {

    const exampleQaDesign = structuredClone(qaDesign);

    exampleQaDesign.testCases.forEach(testCase => {
        testCase.testData.forEach(data => {
            data.status = "example";
        });
    });

    const result = validateQaDesign(
        exampleQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("todos los datos de prueba son ejemplos")
        )
    );
});

test("Debe advertir cuando hay datos definidos y datos de ejemplo", () => {

    const mixedQaDesign = structuredClone(qaDesign);

    mixedQaDesign.testCases[0].testData.push({
        name: "IMEI alternativo",
        value: "111111111111111",
        status: "example"
    });

    const result = validateQaDesign(
        mixedQaDesign,
        functionalAnalysis
    );

    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    assert.ok(
        result.warnings.some(warning =>
            warning.includes("datos de prueba de ejemplo por confirmar")
        )
    );
});


test("Debe detectar IDs duplicados en las reglas de negocio", () => {
    const invalidAnalysis = structuredClone(functionalAnalysis);

    invalidAnalysis.businessRules.push({ id: "RN-01" });

    const result = validateQaDesign(qaDesign, invalidAnalysis);

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("businessRules") &&
            error.includes("RN-01") &&
            error.includes("duplicado")
        )
    );
});

test("Debe detectar IDs duplicados en los escenarios positivos", () => {
    const invalidAnalysis = structuredClone(functionalAnalysis);

    invalidAnalysis.positiveScenarios.push({ id: "EP-01" });

    const result = validateQaDesign(qaDesign, invalidAnalysis);

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("positiveScenarios") &&
            error.includes("EP-01") &&
            error.includes("duplicado")
        )
    );
});

test("Debe detectar IDs duplicados entre escenarios positivos y negativos", () => {
    const invalidAnalysis = structuredClone(functionalAnalysis);

    invalidAnalysis.negativeScenarios[0].id = "EP-01";

    const result = validateQaDesign(qaDesign, invalidAnalysis);

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("EP-01") &&
            error.includes("duplicado")
        )
    );
});

test("Debe detectar reglas relacionadas duplicadas en un caso de prueba", () => {
    const invalidDesign = structuredClone(qaDesign);

    invalidDesign.testCases[0].relatedRules.push("RN-01");

    const result = validateQaDesign(invalidDesign, functionalAnalysis);

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("relatedRules") &&
            error.includes("RN-01") &&
            error.includes("duplicado")
        )
    );
});

test("Debe detectar escenarios relacionados duplicados en un caso de prueba", () => {
    const invalidDesign = structuredClone(qaDesign);

    invalidDesign.testCases[0].relatedScenarios.push("EP-01");

    const result = validateQaDesign(invalidDesign, functionalAnalysis);

    assert.equal(result.valid, false);

    assert.ok(
        result.errors.some(error =>
            error.includes("relatedScenarios") &&
            error.includes("EP-01") &&
            error.includes("duplicado")
        )
    );
});

test("Debe calcular correctamente la cobertura efectiva de reglas y escenarios", () => {
  const result = validateQaDesign(qaDesign, functionalAnalysis);

  assert.deepEqual(result.effectiveRulesCoverage, {
    total: 2,
    covered: 2,
    uncovered: 0,
    percentage: 100,
  });

  assert.deepEqual(result.effectiveScenariosCoverage, {
    total: 2,
    covered: 2,
    uncovered: 0,
    percentage: 100,
  });
});

test("Debe calcular correctamente la cobertura efectiva parcial", () => {
  const partialQaDesign = structuredClone(qaDesign);

  // Quitar las referencias a la segunda regla y al segundo escenario.
  partialQaDesign.testCases[1].relatedRules = [];
  partialQaDesign.testCases[1].relatedScenarios = [];

  const result = validateQaDesign(
    partialQaDesign,
    functionalAnalysis,
  );

  assert.deepEqual(result.effectiveRulesCoverage, {
    total: 2,
    covered: 1,
    uncovered: 1,
    percentage: 50,
  });

  assert.deepEqual(result.effectiveScenariosCoverage, {
    total: 2,
    covered: 1,
    uncovered: 1,
    percentage: 50,
  });
});

test("No debe contar referencias inexistentes en la cobertura efectiva", () => {
  const invalidQaDesign = structuredClone(qaDesign);

  // Reemplazar una referencia válida por una inexistente.
  invalidQaDesign.testCases[0].relatedRules = ["RN-99"];
  invalidQaDesign.testCases[0].relatedScenarios = ["EP-99"];

  const result = validateQaDesign(
    invalidQaDesign,
    functionalAnalysis,
  );

  assert.deepEqual(result.effectiveRulesCoverage, {
    total: 2,
    covered: 1,
    uncovered: 1,
    percentage: 50,
  });

  assert.deepEqual(result.effectiveScenariosCoverage, {
    total: 2,
    covered: 1,
    uncovered: 1,
    percentage: 50,
  });
});