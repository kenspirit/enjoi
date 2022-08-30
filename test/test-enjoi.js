
const Test = require('tape');
const Joi = require('joi');
const Enjoi = require('../index');

Test('enjoi', function (t) {

    t.test('valid', function (t) {
        t.plan(9);

        const schema = Enjoi.schema({
            'title': 'Example Schema',
            'description': 'An example to test against.',
            'type': 'object',
            'properties': {
                'firstName': {
                    'type': 'string',
                    'minLength': 0
                },
                'lastName': {
                    'type': 'string',
                    'minLength': 1
                },
                'tags': {
                    'type': 'array',
                    'items': {
                        'type': 'string',
                        'minLength': 1
                    }
                },
                'age': {
                    'type': 'integer',
                    'minimum': 0
                }
            },
            'required': ['firstName', 'lastName']
        });

        t.equal(schema.type, 'object', 'defined object.');
        t.equal(schema._flags.label, 'Example Schema');
        t.equal(schema._flags.description, 'An example to test against.', 'description set.');
        t.equal(schema._ids._byKey.size, 4, '4 properties defined.');

        t.ok(!schema.validate({ firstName: 'John', lastName: 'Doe', age: 45, tags: ['man', 'human'] }).error, 'no error');
        t.ok(!schema.validate({ firstName: '', lastName: 'Doe', age: 45, tags: ['man', 'human'] }).error, 'no error');
        t.ok(schema.validate({ firstName: 'John', age: 45, tags: ['man', 'human'] }).error, 'error');
        t.ok(schema.validate({ firstName: 'John', lastName: 'Doe', age: 45, tags: [1, 'human'] }).error, 'error');
        t.ok(schema.validate({ firstName: 'John', lastName: 'Doe', age: 45, tags: ['', 'human'] }).error, 'error');
    });

    t.test('convert', function(t) {
        t.plan(5);

        const subSchemas = {
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
            }
        };
        const enjoi = Enjoi.resolver({
            subSchemas
        });

        enjoi.convert({
            type: 'object',
            properties: {
                weight: {
                    $ref: 'measurement'
                }
            }
        });

        t.notOk(subSchemas[''], 'weight schema not persisted');

        enjoi.convert({
            $id: 'length',
            type: 'object',
            properties: {
                length: {
                    $ref: 'measurement'
                }
            }
        });

        t.notOk(subSchemas['length'], 'length schema not persisted');
        t.equal(enjoi.joiSharedSchemas.size, 2);
        t.ok(enjoi.joiSharedSchemas.get('measurement'), 'measurement should exists');
        t.ok(enjoi.joiSharedSchemas.get('measurement#subNumber'), 'subNumber should exists');
    })

    t.test('convert - override options', function(t) {
        t.plan(3);

        const subSchemas = {
            measurement: {
                type: 'object',
                properties: {
                    quantity: {
                        type: 'number',
                        enum: [0, 1]
                    }
                }
            }
        };
        const enjoi = Enjoi.resolver({
            subSchemas,
            enableEnum: false
        });

        const jsonSchema = {
            type: 'object',
            properties: {
                weight: {
                    type: 'object',
                    properties: {
                        quantity: {
                            type: 'number',
                            enum: [0, 1]
                        }
                    }
                },
                length: {
                    $ref: 'measurement'
                }
            }
        };

        const schema1 = enjoi.convert(jsonSchema, { enableEnum: true });
        const schema2 = enjoi.convert(jsonSchema);

        t.ok(schema1.validate({ weight: { quantity: 2 } }).error, 'follow overridden options');
        t.ok(!schema1.validate({ length: { quantity: 2 } }).error, 'no impact on subschemas');
        t.ok(!schema2.validate({ weight: { quantity: 2 } }).error, 'still use original options');
    })

    t.test('joiInstance directly provided', function (t) {
        t.plan(4);

        const joiInstance = Joi.defaults((schema) => schema.options({
            allowUnknown: false,
            abortEarly: false,
            noDefaults: true
        }));

        const schema = Enjoi.schema(
            {
                type: 'object',
                properties: {
                    inner: {
                        type: 'object',
                        properties: {
                            x: {
                                type: 'string'
                            },
                            y: {
                                type: 'number',
                                default: 1
                            }
                        }
                    }
                }
            },
            {
            },
            joiInstance
        );

        const { error: error0 } = schema.validate({ inner: { x: 123, y: 'blah', z: true } });
        t.ok(error0);
        t.equal(error0.details.length, 2);

        const { error: error1 } = schema.validate({ inner: "{ x: 123, y: 'blah', z: true }" });
        t.equal(error1.details[0].message, "\"inner\" must be of type object");

        const schema1 = Enjoi.schema(
            {
                type: 'object',
                properties: {
                    inner: {
                        type: 'object',
                        properties: {
                            x: {
                                type: 'string'
                            },
                            y: {
                                type: 'number',
                                default: 1
                            }
                        }
                    }
                }
            }
        );

        const { value: value1 } = schema1.validate({ inner: '{ "x": "yeah", "y": 123 }' });
        t.deepEqual(value1, { inner: { x: 'yeah', y: 123 } });
    })
});
