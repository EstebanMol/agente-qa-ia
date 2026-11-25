
export const qaTestDesignSchema = {
    type: "object",
    additionalProperties: false,

    $defs: {
        jsonValue: {
            anyOf: [
                { type: "string" },
                { type: "number" },
                { type: "boolean" },
                { type: "null" },
                {
                    type: "array",
                    items: {
                        $ref: "#/$defs/jsonValue"
                    }
                },
                {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        kind: {
                            type: "string",
                            enum: ["object"]
                        },
                        entries: {
                            type: "array",
                            items: {
                                $ref: "#/$defs/jsonEntry"
                            }
                        }
                    },
                    required: ["kind", "entries"]
                }
            ]
        },

        jsonEntry: {
            type: "object",
            additionalProperties: false,
            properties: {
                key: {
                    type: "string"
                },
                value: {
                    $ref: "#/$defs/jsonValue"
                }
            },
            required: ["key", "value"]
        }
    },

    properties: {
        summary: {
            type: "string"
        },
        coverage: {
            type: "object",
            additionalProperties: false,
            properties: {
                coveredRules: {
                    type: "array",
                    items: { type: "string" }
                },
                uncoveredRules: {
                    type: "array",
                    items: { type: "string" }
                },
                coverageObservations: {
                    type: "array",
                    items: { type: "string" }
                },
                coveredScenarios: {
                    type: "array",
                    items: { type: "string" }
                },
                uncoveredScenarios: {
                    type: "array",
                    items: { type: "string" }
                },
                scenarioCoverageObservations: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: [
                "coveredRules",
                "uncoveredRules",
                "coverageObservations",
                "coveredScenarios",
                "uncoveredScenarios",
                "scenarioCoverageObservations"
            ]
        },
        testCases: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    objective: { type: "string" },
                    testType: {
                        type: "string",
                        enum: [
                            "positive",
                            "negative",
                            "boundary",
                            "integration",
                            "other"
                        ]
                    },
                    designTechnique: {
                        type: "string",
                        enum: [
                            "equivalence_partitioning",
                            "boundary_value_analysis",
                            "decision_table",
                            "state_transition",
                            "error_guessing",
                            "use_case",
                            "not_applicable"
                        ]
                    },
                    designTechniqueReason: {
                        type: "string"
                    },
                    preconditions: {
                        type: "array",
                        items: { type: "string" }
                    },
                    testData: {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            properties: {
                                name: { type: "string" },
                                value: {
                                    $ref: "#/$defs/jsonValue"
                                },
                                status: {
                                    type: "string",
                                    enum: [
                                        "defined",
                                        "pending",
                                        "example"
                                    ]
                                }
                            },
                            required: [
                                "name",
                                "value",
                                "status"
                            ]
                        }
                    },
                    steps: {
                        type: "array",
                        items: { type: "string" }
                    },
                    expectedResult: { type: "string" },
                    expectedResultStatus: {
                        type: "string",
                        enum: ["defined", "pending"]
                    },
                    priority: {
                        type: "string",
                        enum: ["critical", "high", "medium", "low"]
                    },
                    priorityReason: { type: "string" },
                    relatedRules: {
                        type: "array",
                        items: { type: "string" }
                    },
                    relatedScenarios: {
                        type: "array",
                        items: { type: "string" }
                    },
                    classification: {
                        type: "string",
                        enum: ["confirmed", "inferred"]
                    },
                    observations: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: [
                    "id",
                    "title",
                    "objective",
                    "testType",
                    "designTechnique",
                    "designTechniqueReason",
                    "preconditions",
                    "testData",
                    "steps",
                    "expectedResult",
                    "expectedResultStatus",
                    "priority",
                    "priorityReason",
                    "relatedRules",
                    "relatedScenarios",
                    "classification",
                    "observations"
                ]
            }
        },
        openQuestions: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    question: { type: "string" },
                    reason: { type: "string" },
                    priority: {
                        type: "string",
                        enum: ["high", "medium", "low"]
                    }
                },
                required: [
                    "id",
                    "question",
                    "reason",
                    "priority"
                ]
            }
        },
        risks: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    description: { type: "string" },
                    impact: {
                        type: "string",
                        enum: ["high", "medium", "low"]
                    }
                },
                required: ["description", "impact"]
            }
        }
    },
    required: [
        "summary",
        "coverage",
        "testCases",
        "openQuestions",
        "risks"
    ]
};
