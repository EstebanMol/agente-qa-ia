import { generateResponse } from "../src/services/openai-service.js";
import { qaTestDesignSchema } from "../src/schemas/qa-test-design-schema.js";
import { normalizeJsonValue } from "../src/utils/json-normalizer.js";
import assert from "node:assert/strict";

async function main() {

    console.log("==================================");
    console.log(" PRUEBA DE ESTRUCTURAS JSON CON IA");
    console.log("==================================");

    const instructions = `
    Generá un diseño de pruebas QA con un único caso de prueba.

    El caso debe contener exactamente estos seis datos de prueba,
    respetando sus nombres, valores y tipos:

    1. nombre: string "Esteban"
    2. edad: number 49
    3. activo: boolean true
    4. permisos: array ["consulta", "edicion"]
    5. usuario: objeto {
        nombre: "Esteban",
        perfil: {
            codigo: 10,
            habilitado: true
        }
    }
    6. configuracion: objeto vacío {}

    IMPORTANTE:
    - Los valores deben conservar sus tipos originales.
    - Los objetos deben utilizar la representación especial
      kind: "object" y entries.
    - Los arrays deben conservar su representación JSON convencional.
    - No conviertas números ni booleanos en strings.
    - No agregues datos de prueba adicionales.

    Completá todas las propiedades obligatorias del esquema.
    Las demás colecciones pueden estar vacías.
    `;

    console.log("\\nEnviando solicitud a OpenAI...");

    const result = await generateResponse(
        instructions,
        "Generar un diseño de pruebas para verificar estructuras JSON.",
        {
            schema: qaTestDesignSchema,
            schemaName: "qa_json_structures_test"
        }
    );

    console.log("\\n=== RESPUESTA ORIGINAL DE OPENAI ===");
    console.log(JSON.stringify(result, null, 2));

    for (const testCase of result.testCases ?? []) {
        for (const testData of testCase.testData ?? []) {
            testData.value = normalizeJsonValue(testData.value);
        }
    }

    // Verificar automáticamente los tipos y valores normalizados.
    const testData = result.testCases[0].testData;

    const getValue = name =>
        testData.find(item => item.name === name)?.value;

    assert.equal(getValue("nombre"), "Esteban");
    assert.equal(getValue("edad"), 49);
    assert.equal(getValue("activo"), true);

    assert.deepEqual(
        getValue("permisos"),
        ["consulta", "edicion"]
    );

    assert.deepEqual(
        getValue("usuario"),
        {
            nombre: "Esteban",
            perfil: {
                codigo: 10,
                habilitado: true
            }
        }
    );

    assert.deepEqual(getValue("configuracion"), {});

    console.log("\nTodas las aserciones fueron aprobadas.");
    
    console.log("\\n=== RESPUESTA NORMALIZADA ===");
    console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
    console.error("\\nError durante la prueba:");
    console.error(error.message);
});