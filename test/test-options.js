
const Test = require('tape');
const Enjoi = require('../index');
const Joi = require('joi');

Test('options features', function (t) {

    t.test('refineType', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'string',
            format: 'binary'
        }, {
            refineType(type, format) {
                switch (type) {
                    case 'string': {
                        if (format === 'binary') {
                            return 'binary'
                        }
                        break;
                    }
                    default:
                        return type;
                }
            },
            extensions: [{
                type: 'binary',
                base: Joi.binary().encoding('base64')
            }]
        });
        let result = schema.validate('aGVsbG8=');
        t.ok(!result.error, 'no error');
        t.equal(result.value.toString(), 'hello', 'no error');
    });

    t.test('refineDescription', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'string',
            description: 'Normal String'
        }, {
            refineDescription(schema) {
                return schema.description ? schema.description.toUpperCase() : '';
            }
        });

        const joiDesc = schema.describe();
        t.equal(joiDesc.flags.description, 'NORMAL STRING', 'Schema description should be transformed correctly');
    });

    t.test('allowNull', function (t) {
        t.plan(1);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                fieldA: {
                    type: 'string'
                }
            }
        }, {
            allowNull: true
        });

        const joiDesc = schema.describe();
        t.ok(joiDesc.keys.fieldA.allow.includes(null), 'Should allow null for NOT required field');
    });

    t.test('custom type', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'test'
        }, {
            extensions: [{
                type: 'test',
                base: Joi.string()
            }]
        });

        t.ok(!schema.validate('string').error);
        t.ok(schema.validate(10).error);
    });

    t.test('type function', function (t) {
        t.plan(3);

        const schemaDesc = {
            type: 'test',
            'x-value': 'example'
        };
        const schema = Enjoi.schema(schemaDesc, {
            extensions: [{
                type: 'test',
                validate(value, helpers) {
                    const validation = Joi.string().max(3).allow(schemaDesc['x-value']).validate(value);
                    if (validation.error) {
                        return { value, errors: validation.error };
                    }
                }
            }]
        });

        t.ok(schema.validate('test').error);
        t.ok(!schema.validate('abc').error);
        t.ok(!schema.validate('example').error);
    });

    t.test('custom complex type', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'file'
        },
            {
                extensions: [{
                    type: 'file',
                    base: Enjoi.schema({
                        type: 'object',
                        properties: {
                            file: {
                                type: 'string'
                            },
                            consumes: {
                                type: 'string',
                                pattern: /multipart\/form-data/
                            }
                        }
                    })
                }]
            });

        t.ok(!schema.validate({ file: 'data', consumes: 'multipart/form-data' }).error);
        t.ok(schema.validate({ file: 'data', consumes: 'application/json' }).error);
    });
});

Test('extensions', function (t) {
    t.test('base', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'thing'
        }, {
            extensions: [{
                type: 'thing',
                base: Joi.any()
            }]
        });

        t.ok(!schema.validate('foo').error);
        t.ok(!schema.validate('foobar').error);
    });

    t.test('function', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'thing'
        }, {
            extensions: [{
                type: 'thing',
                validate(value, helpers) {
                    if (value !== 'foobar') {
                        return { value, errors: helpers.error('thing.foobar') };
                    }
                },
                messages: {
                    'thing.foobar': '{#label} must be \'foobar\''
                }
            }]
        });

        t.ok(schema.validate('foo').error);
        t.ok(!schema.validate('foobar').error);
    });

    t.test('refineType', function (t) {
        t.plan(2);

        const schema = Enjoi.schema({
            type: 'string',
            format: 'email'
        }, {
            extensions: [{
                type: 'email',
                base: Joi.string().email()
            }],
            refineType(type, format) {
                if (type === 'string' && format === 'email') {
                    return 'email';
                }
            }
        });

        t.ok(!schema.validate('root@example.org').error);
        t.ok(schema.validate('foobar').error);
    })

    t.test('function and refineType', function (t) {
        t.plan(3);

        const schemaDesc = {
            type: 'string',
            format: 'email',
            'x-test': true
        }
        const schema = Enjoi.schema(schemaDesc, {
            extensions: [{
                type: 'email',
                validate(value, helpers) {
                    const validator = schemaDesc['x-test'] ? Joi.string().email().equal('test@example.com') : Joi.string().email();
                    const validation = validator.validate(value);
                    if (validation.error) {
                        return { value, errors: validation.error };
                    }
                }
            }],
            refineType(type, format) {
                if (type === 'string' && format === 'email') {
                    return 'email';
                }
            }
        });

        t.ok(schema.validate('root@example.org').error);
        t.ok(!schema.validate('test@example.com').error);
        t.ok(schema.validate('foobar').error);
    })

    t.test('refineSchema', function (t) {
        t.plan(3);

        const schema = Enjoi.schema({
            type: 'object',
            properties: {
                x: {
                    type: 'string',
                    nullable: 'true'
                }
            }
        }, {
            extensions: [{
                type: 'email',
                base: Joi.string().email()
            }],
            refineSchema(joiSchema, jsonSchema) {
                if (jsonSchema.nullable) {
                    return joiSchema.allow(null);
                }
                return joiSchema;
            }
        });

        t.ok(!schema.validate({x: null}).error);
        t.ok(!schema.validate({x: 'foobar'}).error);
        t.ok(schema.validate({x: 123}).error);
    })

    t.test('useDefaults', function (t) {
        t.plan(5);

        const schema = Enjoi.schema(
          {
              type: 'object',
              properties: {
                  x: {
                      type: 'string',
                      default: 'foo'
                  }
              }
          },
          {
            useDefaults: true
          }
        );

        const { value: value0, error: error0 } = schema.validate({x: 'blah'})
        t.ok(!error0);
        t.ok(value0.x === 'blah');

        const { value: value1, error: error1 } = schema.validate({})
        t.ok(!error1);
        t.ok(value1.x === 'foo');

        t.ok(schema.validate({x: 123}).error);
    })

    t.test('strictMode', function (t) {
        t.plan(5);

        const schema = Enjoi.schema({
            'type': 'boolean'
        }, {
            strictMode: true
        });

        t.ok(schema.validate('1').error, 'error');
        t.ok(schema.validate('true').error, 'error in strictMode');
        t.ok(!schema.validate(true).error, 'no error in strictMode');

        const schema1 = Enjoi.schema({
            'type': 'boolean'
        }, {
            joiOptions: {
                convert: false
            }
        });

        t.ok(schema1.validate('1').error, 'error when convert = false');
        t.ok(!schema1.validate(true).error, 'no error when convert = false');
    });

    t.test('joiOptions', function (t) {
        t.plan(4);

        const schema = Enjoi.schema(
          {
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
          },
          {
              useDefaults: true, // No effect
              joiOptions: {
                  allowUnknown: false,
                  abortEarly: false,
                  noDefaults: true
              }
          }
        );

        const { error: error0 } = schema.validate({ x: 123, y: 'blah', z: true });
        t.ok(error0);
        t.equal(error0.details.length, 3);

        const { value: value1, error: error1 } = schema.validate({ x: '123' });
        t.ok(!error1);
        t.deepEqual(value1, { x: '123' })
    })
});
