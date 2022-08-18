const Test = require('tape');
const Enjoi = require('../index');

const COMPLEX_SCHEMA = {
    '$id': 'top',
    type: 'object',
    properties: {
        'refAhead': {
            $ref: '#innerB'
        },
        'a': {
            type: 'object',
            properties: {
                'b': {
                    '$anchor': 'innerB',
                    type: 'object',
                    properties: {
                        'c': {
                            $ref: '#/$defs/shared'
                        },
                        'd': {
                            $ref: '#innerString'
                        },
                        'refInner': {
                            $ref: '#/$defs/shared/properties/level1'
                        },
                        'refSub': {
                            $ref: 'sub#subBoolean'
                        },
                        'refSubShared': {
                            $ref: 'sub#/$defs/subShared'
                        }
                    }
                }
            }
        },
        'sub': {
            '$id': 'sub',
            type: 'object',
            properties: {
                'a': {
                    '$anchor': 'subBoolean',
                    type: 'boolean'
                },
                'b': {
                    $ref: '#subBoolean'
                },
                'c': {
                    $ref: 'top#/$defs/shared'
                },
                'd': {
                    $ref: '#/$defs/subShared'
                },
                'e': {
                    $ref: '#subNumber'
                },
                'refTop': {
                    $ref: 'top#innerString'
                },
                'selfRefSub': {
                    $ref: '#'
                }
            },
            $defs: {
                'subShared': {
                    type: 'object',
                    properties: {
                        'level1': {
                            type: 'object',
                            properties: {
                                'level2': {
                                    '$anchor': 'subNumber',
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    $defs: {
        'shared': {
            type: 'object',
            properties: {
                'level1': {
                    type: 'object',
                    properties: {
                        'level2': {
                            '$anchor': 'innerString',
                            type: 'string'
                        },
                        'level2Num': {
                            '$anchor': 'innerNumber',
                            type: 'number'
                        }
                    }
                }
            }
        }
    }
};

Test('$ref Cases', function (t) {
    t.test('Recursive', function (t) {
        t.plan(2);

        const jsonSchema = {
            type: "object",
            properties: {
                value: { type: "string" },
                next: { $ref: '#' }
            }
        }
        const schema = Enjoi.schema(jsonSchema);

        t.ok(!schema.validate({
            value: "foo",
            next: {
                value: "bar",
                next: {
                    value: "baz"
                }
            }
        }).error, 'no error');
        t.ok(schema.validate({
            value: "foo",
            next: {
                value: "bar",
                next: {
                    value: 0
                }
            }
        }).error, 'error');
    });

    t.test('Recursive - Sub Schema', function (t) {
        t.plan(2);

        const jsonSchema = {
            $id: 'top',
            type: "object",
            properties: {
                value: { type: 'string' },
                node: {
                    $id: 'sub',
                    properties: {
                        value: { type: 'number' },
                        next: {
                            $ref: '#'
                        }
                    }
                }
            }
        }
        const schema = Enjoi.schema(jsonSchema);

        t.ok(!schema.validate({
            value: 'foo',
            node: {
                value: 123,
                next: {
                    value: 234
                }
            }
        }).error, 'no error');
        t.ok(schema.validate({
            value: 'foo',
            node: {
                value: 123,
                next: {
                    value: 'abc'
                }
            }
        }).error, 'error');
    });

    t.test('Self-reference top-level shared schema', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                name: {
                    $ref: '#/$defs/name'
                }
            },
            $defs: {
                name: {
                    type: 'string'
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'has error');
    });

    t.test('Self-reference properties field', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                name: {
                    $ref: '#/$defs/shared/properties/level1/properties/level2'
                },
                age: {
                    $ref: '#/$defs/shared/properties/level1/properties/level2Num'
                },
                nickName: {
                    $ref: '#/properties/name'
                }
            },
            $defs: {
                shared: {
                    type: 'object',
                    properties: {
                        level1: {
                            type: 'object',
                            properties: {
                                level2: {
                                    type: 'string'
                                },
                                level2Num: {
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe', age: 18, nickName: 'JJ' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'name has error');
        t.ok(schema.validate({ nickName: 123 }).error, 'nickName has error');
        t.ok(schema.validate({ age: 'age' }).error, 'age has error');
    });

    t.test('Self-reference $anchor', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                name: {
                    $anchor: 'userName',
                    $ref: '#innerString'
                },
                age: {
                    $ref: '#innerNumber'
                },
                nickName: {
                    $ref: '#userName'
                }
            },
            $defs: {
                shared: {
                    type: 'object',
                    properties: {
                        level1: {
                            type: 'object',
                            properties: {
                                level2: {
                                    $anchor: 'innerString',
                                    type: 'string'
                                },
                                level2Num: {
                                    $anchor: 'innerNumber',
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe', age: 18, nickName: 'JJ' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'name has error');
        t.ok(schema.validate({ nickName: 123 }).error, 'nickName has error');
        t.ok(schema.validate({ age: 'age' }).error, 'age has error');
    });

    t.test('Self-reference top-level shared schema - with $id', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            $id: 'top',
            type: 'object',
            properties: {
                name: {
                    $ref: '#/$defs/name'
                }
            },
            $defs: {
                name: {
                    type: 'string'
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'has error');
    });

    t.test('Self-reference properties field - with $id', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            $id: 'top',
            type: 'object',
            properties: {
                name: {
                    $ref: 'top#/$defs/shared/properties/level1/properties/level2'
                },
                age: {
                    $ref: '#/$defs/shared/properties/level1/properties/level2Num'
                },
                nickName: {
                    $ref: 'top#/properties/name'
                }
            },
            $defs: {
                shared: {
                    type: 'object',
                    properties: {
                        level1: {
                            type: 'object',
                            properties: {
                                level2: {
                                    type: 'string'
                                },
                                level2Num: {
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe', age: 18, nickName: 'JJ' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'name has error');
        t.ok(schema.validate({ nickName: 123 }).error, 'nickName has error');
        t.ok(schema.validate({ age: 'age' }).error, 'age has error');
    });

    t.test('Self-reference $anchor - with $id', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            $id: 'top',
            type: 'object',
            properties: {
                name: {
                    $ref: 'top#innerString'
                },
                age: {
                    $ref: '#innerNumber'
                }
            },
            $defs: {
                shared: {
                    type: 'object',
                    properties: {
                        level1: {
                            type: 'object',
                            properties: {
                                level2: {
                                    $anchor: 'innerString',
                                    type: 'string'
                                },
                                level2Num: {
                                    $anchor: 'innerNumber',
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe', age: 18 }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'name has error');
        t.ok(schema.validate({ age: 'age' }).error, 'age has error');
    });

    t.test('Self-reference sub-schema shared schema - with $id', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            $id: 'top',
            type: 'object',
            properties: {
                product: {
                    $id: 'prod',
                    type: 'object',
                    properties: {
                        isUsed: {
                            $anchor: 'subBoolean',
                            type: 'boolean'
                        },
                        isDangerous: {
                            $ref: '#subBoolean'
                        },
                        width: {
                            $ref: 'measurement'
                        },
                        length: {
                            $ref: '#/$defs/measurement'
                        },
                        price: {
                            $ref: 'measurement#subNumber'
                        }
                    },
                    $defs: {
                        measurement: {
                            $id: 'measurement',
                            type: 'object',
                            properties: {
                                quantity: {
                                    $anchor: 'subNumber',
                                    type: 'number'
                                },
                                unit: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                },
                suggestions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            product: {
                                $ref: '#/properties/product'
                            },
                            weight: {
                                $ref: 'prod#/$defs/measurement'
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({
            product: {
                isUsed: true,
                isDangerous: 'false',
                price: 123
            },
            suggestions: [
                {
                    weight: { quantity: 1, unit: 'kg' },
                    product: { width: { quantity: 2, unit: 'cm' }, length: { quantity: 3, unit: 'cm' } }
                }
            ]
        }).error, 'no error');
        t.ok(schema.validate({
            product: {
                isUsed: true,
                isDangerous: 'Yes',
                price: 'Priceless'
            }
        }).error, 'product has error');
        t.ok(schema.validate({
            suggestions: [{ product: { width: { unit: 123 } } }]
        }).error, 'product in suggestions has error');
        t.ok(schema.validate({
            suggestions: [{ weight: { quantity: '1kg' } }]
        }).error, 'weight in suggestions has error');
    });

    t.test('Self-reference sub-schema ref to top-level shared schema - with $id', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            $id: 'top',
            type: 'object',
            properties: {
                product: {
                    $ref: 'prod'
                },
                suggestions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            product: {
                                $ref: '#/properties/product'
                            },
                            weight: {
                                $ref: '#/$defs/measurement'
                            }
                        }
                    }
                }
            },
            $defs: {
                measurement: {
                    type: 'object',
                    properties: {
                        quantity: {
                            $anchor: 'subNumber',
                            type: 'number'
                        },
                        unit: {
                            type: 'string'
                        }
                    }
                },
                product: {
                    $id: 'prod',
                    type: 'object',
                    properties: {
                        isUsed: {
                            $anchor: 'subBoolean',
                            type: 'boolean'
                        },
                        isDangerous: {
                            $ref: '#subBoolean'
                        },
                        width: {
                            $ref: 'top#/$defs/measurement'
                        },
                        length: {
                            $ref: 'top#/$defs/measurement'
                        },
                        price: {
                            $ref: 'top#subNumber'
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({
            product: {
                isUsed: true,
                isDangerous: 'false',
                price: 123
            },
            suggestions: [
                {
                    weight: { quantity: 1, unit: 'kg' },
                    product: { width: { quantity: 2, unit: 'cm' }, length: { quantity: 3, unit: 'cm' } }
                }
            ]
        }).error, 'no error');
        t.ok(schema.validate({
            product: {
                isUsed: true,
                isDangerous: 'Yes',
                price: 'Priceless'
            }
        }).error, 'product has error');
        t.ok(schema.validate({
            suggestions: [{ product: { width: { unit: 123 } } }]
        }).error, 'product in suggestions has error');
        t.ok(schema.validate({
            suggestions: [{ weight: { quantity: '1kg' } }]
        }).error, 'weight in suggestions has error');
    });

    t.test('External-reference properties field', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                name: {
                    $ref: 'shared#/properties/level1/properties/level2'
                },
                age: {
                    $ref: 'shared#/properties/level1/properties/level2Num'
                },
                nickName: {
                    $ref: '#/properties/name'
                }
            }
        }, {
            subSchemas: {
                shared: {
                    type: 'object',
                    properties: {
                        level1: {
                            type: 'object',
                            properties: {
                                level2: {
                                    type: 'string'
                                },
                                level2Num: {
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe', age: 18, nickName: 'JJ' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'name has error');
        t.ok(schema.validate({ nickName: 123 }).error, 'nickName has error');
        t.ok(schema.validate({ age: 'age' }).error, 'age has error');
    });

    t.test('External-reference $anchor', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                name: {
                    $anchor: 'userName',
                    $ref: 'shared#innerString'
                },
                age: {
                    $ref: 'shared#innerNumber'
                },
                nickName: {
                    $ref: '#userName'
                }
            }
        }, {
            subSchemas: {
                shared: {
                    type: 'object',
                    properties: {
                        level1: {
                            type: 'object',
                            properties: {
                                level2: {
                                    $anchor: 'innerString',
                                    type: 'string'
                                },
                                level2Num: {
                                    $anchor: 'innerNumber',
                                    type: 'number'
                                }
                            }
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({ name: 'Joe', age: 18, nickName: 'JJ' }).error, 'no error');
        t.ok(schema.validate({ name: 123 }).error, 'name has error');
        t.ok(schema.validate({ nickName: 123 }).error, 'nickName has error');
        t.ok(schema.validate({ age: 'age' }).error, 'age has error');
    });

    t.test('External-reference top-level shared schema - with $id', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            $id: 'top',
            type: 'object',
            properties: {
                product: {
                    $ref: 'prod'
                },
                suggestions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            product: {
                                $ref: 'product'
                            },
                            weight: {
                                $ref: 'measurement'
                            }
                        }
                    }
                }
            }
        }, {
            subSchemas: {
                measurement: {
                    type: 'object',
                    properties: {
                        quantity: {
                            $anchor: 'subNumber',
                            type: 'number'
                        },
                        unit: {
                            type: 'string'
                        }
                    }
                },
                product: {
                    $id: 'prod',
                    type: 'object',
                    properties: {
                        isUsed: {
                            $anchor: 'subBoolean',
                            type: 'boolean'
                        },
                        isDangerous: {
                            $ref: '#subBoolean'
                        },
                        width: {
                            $ref: 'measurement'
                        },
                        length: {
                            $ref: '#/properties/width'
                        },
                        price: {
                            $ref: 'measurement#subNumber'
                        }
                    }
                }
            }
        });

        t.ok(!schema.validate({
            product: {
                isUsed: true,
                isDangerous: 'false',
                price: 123
            },
            suggestions: [
                {
                    weight: { quantity: 1, unit: 'kg' },
                    product: { width: { quantity: 2, unit: 'cm' }, length: { quantity: 3, unit: 'cm' } }
                }
            ]
        }).error, 'no error');
        t.ok(schema.validate({
            product: {
                isUsed: true,
                isDangerous: 'Yes',
                price: 'Priceless'
            }
        }).error, 'product has error');
        t.ok(schema.validate({
            suggestions: [{ product: { width: { unit: 123 } } }]
        }).error, 'product in suggestions has error');
        t.ok(schema.validate({
            suggestions: [{ weight: { quantity: '1kg' } }]
        }).error, 'weight in suggestions has error');
    });
});
