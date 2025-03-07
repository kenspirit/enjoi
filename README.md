![Test](https://github.com/kenspirit/json-2-joi/workflows/Test/badge.svg) [![npm version](https://badge.fury.io/js/json-2-joi.svg)](https://badge.fury.io/js/json-2-joi)

# json-2-joi

Converts a JSON schema to a Joi schema for object validation.

## Change based on the forked version (enjoi):

- Provided `refineDescription(schema)`, `allowNull`, `forbidArrayNull`, `strictRequired`, `strictEnum`, `enableEnum`, `customizedNullValues` options
- Change cycle reference resovling without self-generating id and rely on $id if defined in JSON schema
- Support `const` keyword in JSON schema
- Support `example` setting for Joi based on JSON schema's `examples`, `default` or `enum`
- Support `contains` keyword in JSON schema using Joi's `has` method
- Support `$anchor` keyword in JSON schema
- Support providing `joiOptions` for JOI default instance creation.
- Support directly passing a Joi instance for schema building.
- Remove `defaults` API.  Please refer to section **Reuse JOI Schema Resolver** for similar usage.
- Remove `strictMode` and `useDefaults` option.
- **Big Change** on `$ref` and `subSchemas`.  Please refer to [test/test-references.js](test/test-references.js) for detail usage.  Currently, four format of `$ref` are supported:
    * id
    * [baseUri]#anchor
    * [baseUri]#/$defs/shared
    * [baseUri]#/$defs/shared/properties/level1

    **subSchemas will be modified** for two reason:
    * If any subSchema does not have `$id` field, it will be added using the corresponding key in `subSchemas` object.
    * New key-value pair will be added into it if the schema or any its subschema being parsed has `$id` field.

## Usage

### Schema Support

`json-2-joi` does not support all of json-schema.

Here is a list of some known missing keyword support still being worked on:

- `object:patternProperties` - unsupported due to Joi limitations.

Please file issues for other unsupported features.

### API

- `json2Joi.schema(schema [, options, joiInstance])`
    - `schema` - a JSON schema or a string type representation (such as `'integer'`).
    - `options` - an (optional) object of additional options such as `subSchemas` and custom `types`.
    - `joiInstance` - a (optional) Joi instance to be used.  When passed, it will be used directly.  `extensions` option does not take effect and the Object/Array auto coerce extensions will not be included as well.
- `json2Joi.resolver(options [, joiInstance])` - Creates a schema resolver based on `options`.  `joiInstance` is same as above.

### Options

- `subSchemas` - an (optional) object with keys representing schema ids, and values representing schemas.
- `extensions` - an array of extensions to pass [joi.extend](https://github.com/hapijs/joi/blob/master/API.md#extendextension).
- `joiOptions` - Options directly passed to Joi for instance creation.  If the `noDefaults` is set `true`, `default()` will NOT be called and applied to Joi schema.
- `refineDescription(schema)` - an (optional) function to call to apply to the JSON schema so that it's possible to return customized description.
- `refineType(type, format)` - an (optional) function to call to apply to type based on the type and format of the JSON schema.
- `refineSchema(joiSchema, jsonSchema)` - an (optional) function to call to apply to adjust Joi schema base on the original JSON schema. Primary use case is handling `nullable` flag in OpenAPI 3.0
- `allowNull` - Default as `false`.  When `true` and the field has no `enum` setting, `null` value will be allowed.
- `customizedNullValues` - Default as `[null]`.  When provided, the value in the array will be treated valid null value when schema is 'null' type or other allowing null case.
- `forbidArrayNull` - Default as `true`.  When `false` and `allowNull` is true, `null` value will be allowed for array type field.
- `strictArrayRequired` - Default as `false`.  When `true`, those `required` array-type fields must has at least 1 item and its item must not be `null` item, or value defined by `customizedNullValues`.
- `strictRequired` - Default as `false`.  When `true`, `null` (and empty string additionally for string type) will NOT be allowed for those `required` field in object.
- `strictEnum` - Default as `true`.  When `false`, and `allowNull` is `true`, `null` (and empty string additionally for string type) will be added to `enum` list.
- `enableEnum` - Default as `true`.  When `false`, `enum` restriction will not be added to Joi Schema.

Example:

```javascript
const Joi = require('joi');
const Json2Joi = require('json-2-joi');

const schema = Json2Joi.schema({
    type: 'object',
    properties: {
        firstName: {
            description: 'First name.',
            type: 'string'
        },
        lastName: {
            description: 'Last name.',
            type: 'string'
        },
        age: {
            description: 'Age in years',
            type: 'integer',
            minimum: 1
        }
    },
    'required': ['firstName', 'lastName']
});

const { error, value } = schema.validate({firstName: 'John', lastName: 'Doe', age: 45});
```

### joiOptions

When this option is provided, a Joi instance will be created as `joiInstance = Joi.defaults((schema) => schema.options(joiOptions));` for building Joi Schema.

As a result:
* `unknown` setting (originally set by schema.additionalProperties !== false) of the schema will take effect only if `allowUnknown` is NOT provided in `joiOptions`.
* Original `useDefaults` option will be replaced by `noDefaults` in `joiOptions`.
* Original `strictMode` option will be replaced by `convert` in `joiOptions`.

### Sub Schemas

Sub-schemas can be provided through the `subSchemas` option for `$ref` values to lookup against.

Example:

```javascript
const schema = Json2Joi.schema({
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
```

### Reuse JOI Schema Resolver

Sometimes, we might have a base set of `subSchemas` which is used for building a large number of JSON schema and so we do not want to parse these common `subSchemas` again and again.  We can first construct a JOI Schema Resolver first and then convert other JSON one by one.

```javascript

const json2Joi = Json2Joi.resolver({
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
        }
    }
});

const weightSchema = json2Joi.convert({
    type: 'object',
    properties: {
        weight: {
            $ref: 'measurement'
        }
    }
});

const lengthSchema = json2Joi.convert({
    type: 'object',
    properties: {
        length: {
            $ref: 'measurement'
        }
    }
});
```

#### Override options during conversion

When reusing the Resolver and calling `convert` API, it's possible that different schema might have different requirement.

It's possible to override these options for each conversion:

* refineType
* refineSchema
* refineDescription
* allowNull
* forbidArrayNull
* strictRequired
* strictArrayRequired
* strictEnum
* enableEnum
* noDefaults (Copied from `joiOptions` for the construction time)

However, the overriden options do not have impact on the `subSchemas` as they are preprocessed during Resolver construction.

```javascript
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
```

### Custom Types

Custom types can be provided through the `extensions` option.

```javascript
const schema = Json2Joi.schema({
    type: 'thing'
}, {
    extensions: [{
        type: 'thing',
        base: Joi.any()
    }]
});
```

Also with functions.

```javascript
const schema = Json2Joi.schema({
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
```

### Refine Type

You can use the refine type function to help refine types based on `type` and `format`. This will allow transforming a type for lookup. 

```javascript
const schema = Json2Joi.schema({
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
```

This can be used in conjunction with function based `extensions` for additional logic:

```javascript
const schemaDesc = {
    type: 'string',
    format: 'email',
    'x-test': true
}
const schema = Json2Joi.schema(schemaDesc, {
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
```

### Extensions

Refer to Joi documentation on extensions: https://hapi.dev/module/joi/api/?v=17#extensions
