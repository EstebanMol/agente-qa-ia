
export const requirementAnalysisSchema = {
    type: "object",
    additionalProperties: false,

    properties: {
        functionalObjective: {
            type: "string"
        },

        actors: {
            type: "object",
            additionalProperties: false,
            properties: {
                users: {
                    type: "array",
                    items: { type: "string" }
                },
                systems: {
                    type: "array",
                    items: { type: "string" }
                },
                organizations: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["users", "systems", "organizations"]
        },

        functionalFlow: {
            type: "array",
            items: { type: "string" }
        },

        businessRules: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    description: { type: "string" },
                    classification: {
                        type: "string",
                        enum: ["explicit", "inferred"]
                    },
                    evidence: { type: "string" }
                },
                required: [
                    "id",
                    "description",
                    "classification",
                    "evidence"
                ]
            }
        },

        validations: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    description: { type: "string" },
                    status: {
                        type: "string",
                        enum: ["confirmed", "pending"]
                    }
                },
                required: ["description", "status"]
            }
        },
       
        positiveScenarios: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    description: { type: "string" },
                    classification: {
                        type: "string",
                        enum: ["explicit", "inferred"]
                    },
                    evidence: { type: "string" }
                },
                required: [
                    "id",
                    "description",
                    "classification",
                    "evidence"
                ]
            }
        },

        negativeScenarios: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,
                properties: {
                    id: { type: "string" },
                    description: { type: "string" },
                    classification: {
                        type: "string",
                        enum: ["explicit", "inferred"]
                    },
                    evidence: { type: "string" }
                },
                required: [
                    "id",
                    "description",
                    "classification",
                    "evidence"
                ]
            }
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
                    preconditions: {
                        type: "array",
                        items: { type: "string" }
                    },
                    testData: {
                        type: "array",
                        items: { type: "string" }
                    },
                    steps: {
                        type: "array",
                        items: { type: "string" }
                    },
                    expectedResult: { type: "string" },
                    priority: {
                        type: "string",
                        enum: ["critical", "high", "medium", "low"]
                    },
                    relatedRules: {
                        type: "array",
                        items: { type: "string" }
                    },
                    classification: {
                        type: "string",
                        enum: ["confirmed", "inferred"]
                    },
                    expectedResultStatus: {
                    type: "string",
                    enum: ["defined", "pending"]
                    },
                    priorityReason: {
                    type: "string"
                    },
                },
                required: [
                    "id",
                    "title",
                    "objective",
                    "preconditions",
                    "testData",
                    "steps",
                    "expectedResult",
                    "priority",
                    "relatedRules",
                    "classification",
                    "expectedResultStatus",
                    "priorityReason"
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
                    topic: { type: "string" },
                    priority: {
                        type: "string",
                        enum: ["high", "medium", "low"]
                    },
                    reason: { type: "string" }
                },
                required: [
                    "id",
                    "question",
                    "topic",
                    "priority",
                    "reason"
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
        "functionalObjective",
        "actors",
        "functionalFlow",
        "businessRules",
        "validations",
        "positiveScenarios",
        "negativeScenarios",
        "testCases",
        "openQuestions",
        "risks"
    ]
};
