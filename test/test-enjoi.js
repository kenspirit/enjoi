
const Test = require('tape');
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
});
