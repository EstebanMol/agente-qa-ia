// Convierte la representación de objetos generada por el agente
// en objetos JavaScript convencionales.
export function normalizeJsonValue(value) {

    // Los valores simples no necesitan transformación.
    if (
        value === null ||
        typeof value !== "object"
    ) {
        return value;
    }

    // Procesar arrays y normalizar recursivamente sus elementos.
    if (Array.isArray(value)) {
        return value.map(normalizeJsonValue);
    }

    // Reconocer la representación especial de objetos.
    if (value.kind === "object") {

        if (!Array.isArray(value.entries)) {
            throw new Error(
                "La representación del objeto no contiene una colección entries válida."
            );
        }

        const normalizedObject = {};
        const processedKeys = new Set();

        for (const entry of value.entries) {

            if (
                entry === null ||
                typeof entry !== "object" ||
                typeof entry.key !== "string" ||
                !Object.hasOwn(entry, "value")
            ) {
                throw new Error(
                    "La representación del objeto contiene una entrada inválida."
                );
            }

            if (processedKeys.has(entry.key)) {
                throw new Error(
                    `La propiedad "${entry.key}" está duplicada.`
                );
            }

            processedKeys.add(entry.key);

            Object.defineProperty(normalizedObject, entry.key, {
                value: normalizeJsonValue(entry.value),
                enumerable: true,
                writable: true,
                configurable: true
            });
        }

        return normalizedObject;
    }

    // Normalizar recursivamente las propiedades de otros objetos.
    const normalizedObject = {};

    for (const [key, nestedValue] of Object.entries(value)) {
        Object.defineProperty(normalizedObject, key, {
            value: normalizeJsonValue(nestedValue),
            enumerable: true,
            writable: true,
            configurable: true
        });
    }

    return normalizedObject;
}

