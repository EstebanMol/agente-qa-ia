import test from "node:test";
import assert from "node:assert/strict";
import { normalizeJsonValue } from "../src/utils/json-normalizer.js";

test("Debe conservar los valores simples", () => {
    assert.equal(normalizeJsonValue("Esteban"), "Esteban");
    assert.equal(normalizeJsonValue(25), 25);
    assert.equal(normalizeJsonValue(false), false);
    assert.equal(normalizeJsonValue(null), null);
});

test("Debe convertir una representación de objeto", () => {
    const input = {
        kind: "object",
        entries: [
            { key: "nombre", value: "Esteban" },
            { key: "edad", value: 49 },
            { key: "activo", value: true }
        ]
    };

    const result = normalizeJsonValue(input);

    assert.deepEqual(result, {
        nombre: "Esteban",
        edad: 49,
        activo: true
    });
});

test("Debe convertir objetos anidados", () => {
    const input = {
        kind: "object",
        entries: [
            {
                key: "usuario",
                value: {
                    kind: "object",
                    entries: [
                        { key: "nombre", value: "Esteban" }
                    ]
                }
            }
        ]
    };

    const result = normalizeJsonValue(input);

    assert.deepEqual(result, {
        usuario: {
            nombre: "Esteban"
        }
    });
});

test("Debe conservar arrays y normalizar sus elementos", () => {
    const input = [
        10,
        "texto",
        {
            kind: "object",
            entries: [
                { key: "activo", value: true }
            ]
        }
    ];

    const result = normalizeJsonValue(input);

    assert.deepEqual(result, [
        10,
        "texto",
        { activo: true }
    ]);
});

test("Debe admitir objetos vacíos", () => {
    const input = {
        kind: "object",
        entries: []
    };

    assert.deepEqual(normalizeJsonValue(input), {});
});

test("Debe procesar estructuras combinadas", () => {
    const input = {
        kind: "object",
        entries: [
            {
                key: "configuracion",
                value: {
                    kind: "object",
                    entries: [
                        {
                            key: "modos",
                            value: ["automatico", "manual"]
                        },
                        {
                            key: "opciones",
                            value: {
                                kind: "object",
                                entries: []
                            }
                        }
                    ]
                }
            }
        ]
    };

    const result = normalizeJsonValue(input);

    assert.deepEqual(result, {
        configuracion: {
            modos: ["automatico", "manual"],
            opciones: {}
        }
    });
});

test("Debe conservar correctamente una propiedad llamada __proto__", () => {
    const input = {
        kind: "object",
        entries: [
            { key: "__proto__", value: "valor seguro" },
            { key: "nombre", value: "Esteban" }
        ]
    };

    const result = normalizeJsonValue(input);

    assert.equal(result.__proto__, "valor seguro");
    assert.equal(
        Object.getPrototypeOf(result),
        Object.prototype
    );
    assert.equal(
        Object.hasOwn(result, "__proto__"),
        true
    );
});

test("Debe rechazar propiedades duplicadas en un objeto", () => {
    const input = {
        kind: "object",
        entries: [
            { key: "nombre", value: "Esteban" },
            { key: "nombre", value: "Otro valor" }
        ]
    };

    assert.throws(
        () => normalizeJsonValue(input),
        /está duplicada/
    );
});