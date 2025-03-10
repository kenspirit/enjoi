const Test = require('tape');
const Enjoi = require('../index');

Test('directives', function (t) {
    t.test('anyOf', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            'anyOf': [
                {
                    type: 'string'
                },
                {
                    type: 'number'
                }
            ]
        });

        t.ok(schema.validate('string').value, 'no error')
        t.ok(schema.validate(10).value, 'no error');
        t.ok(schema.validate({}).error, 'error');
    });

    t.test('oneOf', function (t) {
        t.plan(9);

        const schema = Enjoi.schema({
            'oneOf': [
                {
                    type: 'object',
                    required: [ 'a' ],
                    properties: {
                        a: {
                            type: 'string'
                        }
                    },
                    additionalProperties: false
                },
                {
                    type: 'object',
                    required: [ 'b' ],
                    properties: {
                        b: {
                            type: 'number'
                        }
                    },
                    additionalProperties: false
                }
            ]
        });

        t.ok(schema.validate({ a: 'string' }).value, 'no error');
        t.ok(!schema.validate(undefined).value, 'no error');
        t.ok(schema.validate({ b: 10 }).value, 'no error');
        t.ok(schema.validate({}).error, 'error');
        t.ok(schema.validate({ a: 'string', b: 10 }).error, 'error');
        t.ok(schema.validate({ a: 'string', b: null }).error, 'error');
        t.ok(schema.validate({ a: null, b: 10 }).error, 'error');
        t.ok(schema.validate({ a: null, b: null }).error, 'error');
        t.ok(schema.validate({ a: 'string', b: 'string' }).error, 'error');
    });

    t.test('not', function (t) {
        t.plan(6);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                a: {
                    type: 'string'
                }
            },
            not: {
                type: 'object',
                required: ['b'],
                properties: {
                    b: {
                        type: 'number'
                    }
                }
            }
        });

        t.ok(!schema.validate({ a: 'string' }).error, 'no error');
        t.ok(!schema.validate({}).error, 'no error');
        t.ok(schema.validate({ b: 10 }).error, 'error');
        t.deepEqual(schema.validate({ a: 'string' }).value, { a: 'string' }, 'no error');
        t.deepEqual(schema.validate({ a: 'string', b: null }).value, { a: 'string', b: null }, 'no error');
        t.deepEqual(schema.validate({ a: 'string', b: 'string' }).value, { a: 'string', b: 'string' }, 'no error');
    });

    t.test('additionalProperties boolean', function (t) {
        t.plan(4);

        const schema = {
            type: 'object',
            properties: {
                file: {
                    type: 'string'
                }
            }
        };

        t.ok(!Enjoi.schema(schema).validate({ file: 'data', consumes: 'application/json' }).error, 'no error');
        schema.additionalProperties = false;
        t.ok(Enjoi.schema(schema).validate({ file: 'data', consumes: 'application/json' }).error, 'error');
        schema.additionalProperties = true;
        t.deepEqual(Enjoi.schema(schema).validate({ file: 'data', consumes: 'application/json' }).value, { "file": "data", "consumes": "application/json" }, 'no error');
        t.ok(Enjoi.schema(schema).validate({ file: 5, consumes: 'application/json' }).error, 'error');
    });

    t.test('default values', function (t) {
        t.plan(5);

        const schema = {
            type: 'object',
            properties: {
                user: {
                    type: 'string',
                    format: 'email'
                },
                locale: {
                    type: 'string',
                    default: 'en-US'
                },
                isSubscribed: {
                    type: 'boolean',
                    default: false
                },
                posts: {
                    type: 'number',
                    default: 0
                },
                empty: {
                    type: 'string',
                    default: ''
                }
            },
            required: ['user']
        };

        const joiSchema = Enjoi.schema(schema);
        const joiDesc = joiSchema.describe();
        let result = joiSchema.validate({ user: 'test@domain.com' });
        t.ok(!result.error, 'no error');
        t.equal(result.value.locale, 'en-US');
        t.equal(result.value.isSubscribed, false);
        t.equal(result.value.posts, 0);
        t.deepEqual(joiDesc.keys.locale.examples, ['en-US']);
    });

    t.test('additionalProperties false should not allow additional properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
            {
                extensions: [{
                    type: 'file',
                    base: Enjoi.schema({
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            file: {
                                type: 'string'
                            }
                        }
                    })
                }]
            });

        t.ok(schema.validate({ file: 'data', consumes: 'application/json' }).error, 'error');
    });

    t.test('additionalProperties true should allow additional properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
            {
                extensions: [{
                    type: 'file',
                    base: Enjoi.schema({
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                            file: {
                                type: 'string'
                            }
                        }
                    })
                }]
            });

        t.ok(!schema.validate({ file: 'data', consumes: 'application/json' }).error, 'no error');
    });

    t.test('additionalProperties true should not affect validation of properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
            {
                extensions: [{
                    type: 'file',
                    base: Enjoi.schema({
                        type: 'object',
                        additionalProperties: true,
                        properties: {
                            file: {
                                type: 'string'
                            }
                        }
                    })
                }]
            });

        t.ok(schema.validate({ file: 5, consumes: 'application/json' }).error, 'error');
    });

    t.test('additionalProperties object should not affect validation of properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
            {
                extensions: [{
                    type: 'file',
                    base: Enjoi.schema({
                        type: 'object',
                        additionalProperties: {
                            type: 'string'
                        },
                        properties: {
                            file: {
                                type: 'string'
                            }
                        }
                    })
                }]
            });

        t.ok(!schema.validate({ file: 'asdf', consumes: 'application/json' }).error, 'no error');
    });

    t.test('additionalProperties object should add to validated properties', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'file'
        },
            {
                extensions: [{
                    type: 'file',
                    base: Enjoi.schema({
                        type: 'object',
                        additionalProperties: {
                            type: 'string'
                        },
                        properties: {
                            file: {
                                type: 'string'
                            }
                        }
                    })
                }]
            });

        t.ok(schema.validate({ file: 'asdf', consumes: 5 }).error, 'error');
    });

    t.test('inner additionalProperties should be able to override options', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                outer: {
                    type: 'object',
                    required: ['inner'],
                    properties: {
                        inner: {
                            type: 'string'
                        }
                    },
                    additionalProperties: true
                }
            }
        }, { joiOptions: { allowUnknown: false } });

        t.ok(!schema.validate({ outer: { inner: 'inner', extra: 'pass' } }).error, 'error');

        const noOverride = Enjoi.schema({
            type: 'object',
            properties: {
                outer: {
                    type: 'object',
                    required: ['inner'],
                    properties: {
                        inner: {
                            type: 'string'
                        }
                    }
                }
            }
        }, { joiOptions: { allowUnknown: false } });

        t.ok(noOverride.validate({ outer: { inner: 'inner', extra: 'pass' } }).error, 'error');
    })

    t.test('array additionalItems', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            type: 'array',
            items: [
                {
                    type: 'string'
                },
                {
                    type: 'number'
                }
            ],
            additionalItems: false
        });

        t.ok(!schema.validate(['test']).error, 'no error')
        t.ok(!schema.validate(['test', 123]).error, 'no error');
        t.ok(schema.validate(['test', 123, 'foo']).error, 'error');
    });
});

Test('allOf', function (t) {

    t.test('allOf simple types', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            allOf: [
                {
                    type: 'string'
                },
                {
                    type: 'string',
                    maxLength: 3
                }
            ]
        });

        t.ok(!schema.validate('abc').error, 'no error')
        t.ok(schema.validate('abcd').error, 'error')
    });

    t.test('allOf object', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            'allOf': [
                {
                    type: 'object',
                    properties: {
                        a: { type: 'string' }
                    }
                },
                {
                    type: 'object',
                    properties: {
                        b: { type: 'number' }
                    }
                }
            ]
        });

        t.ok(!schema.validate({ a: 'string', b: 10 }).error, 'no error');
        const validation = schema.validate({ a: 'string', b: 'string' });
        t.equal(validation.error.name, 'ValidationError', 'error');
        t.equal(validation.error.details[0].type, 'alternatives.all', 'error');
    });

    t.test('oneOf array with different types', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'array',
            items: {
                oneOf: [
                    { type: 'string' },
                    { type: 'number' }
                ]
            }
        });

        t.ok(!schema.validate(['string', 10]).error, 'no error');
    });

    t.test('oneOf can be combined with a base type', function (t) {
        t.plan(4);

        const schema = Enjoi.schema({
            type: "object",
            required: ['foo'],
            properties: {
                "foo": { type: "string" }
            },
            oneOf: [
                {
                    type: "object",
                    required: ['bar'],
                    properties: {
                        "bar": { type: "string" }
                    }
                },
                {
                    type: "object",
                    required: ['baz'],
                    properties: {
                        "baz": { type: "string" }
                    }
                }
            ]
        });

        t.ok(schema.validate({ foo: 'a' }).error, 'error - matches too few');
        t.ok(schema.validate({ bar: 'b' }).error, 'error - matches too few');
        t.ok(schema.validate({ foo: 'a', bar: 'b', baz: 'c' }).error, 'error - matches too many');
        t.ok(!schema.validate({ foo: 'a', bar: 'b' }).error, 'no error');
    });

    t.test('allOf nested', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            title: "Organization Input",
            allOf: [
                {
                    title: "Organization Common",
                    allOf: [
                        {
                            type: "object",
                            properties: {
                                name: { type: "string", maxLength: 40 },
                                billingAddress: { type: "string", maxLength: 100 }
                            },
                            required: ["name"]
                        },
                        {
                            type: "object",
                            title: "Phone Number",
                            properties: { phoneCountryCode: { type: "string", minLength: 1 } },
                            required: ["phoneCountryCode"]
                        }
                    ]
                }
            ]
        });

        t.ok(!schema.validate({ name: 'test', phoneCountryCode: 'US' }).error, 'no error');
        t.ok(schema.validate({ name: 'test' }).error, 'error');
    });

    t.test('contains', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            "properties": {
                "references": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "refType": {
                                "type": "string"
                            },
                            "refNumber": {
                                "type": "string"
                            }
                        },
                        "required": [
                            "refType"
                        ]
                    },
                    "minItems": 1,
                    "minContains": 1,
                    "contains": {
                        "type": "object",
                        "properties": {
                            "refType": {
                                "const": "AHP"
                            },
                            "refNumber": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        });

        t.ok(schema.validate({
            references: [
                {
                    refType: 'AHP',
                    refNumber: '123456'
                },
                {
                    refType: 'ANY',
                    refNumber: '3456'
                }
            ]
        }).value, 'no error');
        t.ok(schema.validate({
            references: [
                {
                    refType: 'ANY',
                    refNumber: '3456'
                }
            ]
        }).error, 'error - not contains enough item');
    });
});
