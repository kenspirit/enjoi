### 3.0.1

- Fix issue that inner `additionalProperties` setting cannot override outer option

### 3.0.0

- Supports copying the Meta-Data annotations ('title', 'deprecated', 'readOnly', 'writeOnly') to Joi schema.

### 2.5.1

- Fix `strictArrayRequired` option validation issue when `required` is not set.

### 2.5.0

- Add `strictArrayRequired` option.

### 2.4.0

- Add `customizedNullValues` option.

### 2.3.2

- Enhance `null` value support when `type` is array and contains `null`.

### 2.3.1

- Fix `noDefaults` options validation issue.

### 2.3.0

- If `noDefaults` is set `true`, `default()` will not be set to Joi schema and allow it overridable.

### 2.2.0

- Add `forbidArrayNull`, `strictRequired` option.

### 2.1.0

- Fix the issue that `enum` is only applied to `string` type or when missing type info.
- Add `strictEnum` and `enableEnum` option.
- Allow override options when calling `convert` api.

### 2.0.2

- Remove `min` setting from JOI schema if `minLength` is not defined in JSON schema.
- Allow `null` value as Array's item if `allowNull` option is set to true.

### 2.0.1

- Set correct examples data for Array type field.

### 2.0.0

* [BREAKING] Remove `useDefaults` and `strictMode` options

### 1.1.0

- Support providing `joiOptions` for JOI default instance creation.
- Support directly passing a Joi instance for schema building.

### 1.0.0

- Provided `refineDescription(schema)`, `allowNull` options
- Change cycle reference resovling without self-generating id and rely on $id if defined in JSON schema
- Support `const` keyword in JSON schema
- Support `example` setting for Joi based on JSON schema's `examples`, `default` or `enum`
- Support `contains` keyword in JSON schema using Joi's `has` method
- Support `$anchor` keyword in JSON schema
- Remove `defaults` API.  Please refer to section **Reuse JOI Schema Resolver** for similar usage.
- **Big Change** on `$ref` and `subSchemas`.  Please refer to [test/test-references.js](test/test-references.js) for detail usage.  Currently, four format of `$ref` are supported:
    * id
    * [baseUri]#anchor
    * [baseUri]#/$defs/shared
    * [baseUri]#/$defs/shared/properties/level1

    **subSchemas will be modified** for two reason:
    * If any subSchema does not have `$id` field, it will be added using the corresponding key in `subSchemas` object.
    * New key-value pair will be added into it if the schema or any its subschema being parsed has `$id` field.

## Before Fork

### 9.0.1

* #112 Use joi.link to only resolve strictly recursive self-references

### 9.0.0

* #100 Allow extension constructors
* #101 Keep string enum type
* #104 Allow allOf, anyOf, oneOf to be combined with base schema
* #107 Cycles in schema refs (fixed #106)
* #108 Handle `not` properly
* #109 Defaults options

### 8.0.0

* [BREAKING] Switched from @hapi/joi to joi (#94)
* Added refineSchema function (#92)

### 7.0.0

* [BREAKING] Updated to Joi@17
* [BREAKING] Custom types moved to being defined under `extensions`
* [BREAKING] Extensions definitions to follow Joi@17

### 6.0.2

* Correct usage of joi `validate` function. joiSchema.validate(obj) instead of Joi.validate(obj, joiSchema).

### 6.0.1

* #83 differentiate between undefined and falsy
* #73 updated fix

### 6.0.0

* Do not set empty string as valid for all string types (#73)
* Updated joi and hoek to latest, drop Node 6 support (#76)

### v5.0.1

* #69

### v5.0.1

* #66

### v5.0.0

* [BREAKING] Addresses #63 : date format to follow RFC3339 as per JSON-Schema.

### v4.1.1

* Fixes `oneOf` requiring (#61).

### v4.1.0

* Added support for string formats `uuid` (v4) and `guid`.

### v4.0.0

* [BREAKING] export interface changed. Call `Enjoi.schema` instead of `Enjoi`.
* [BREAKING] `joi` is a peer.
* Added `extensions` support.
* `types` can also contain function values to do complex resolving of custom types.
* Added support for `Enjoi.defaults` which returns a new Enjoi with default options.

### v3.2.5

* Fixed allOf support (#53)

### v3.2.4

* Support for allOf
* Bug fixes

### v3.2.3

* Security fix to resolve https://nodesecurity.io/advisories/566

### v3.2.2

* Documentation fixes.

### v3.2.1

* Support array:additionalItems false setting.

### v3.2.0

* Added `strictMode` support and resolves #34.

### v3.1.0

* Added a refineType function option.

### v3.0.0

* [BREAKING] supports Joi 13.x (required Node 6+)
* Fixed additional properties https://github.com/tlivings/enjoi/pull/31
* Adds support for ordered and items https://github.com/tlivings/enjoi/pull/38

### v2.2.4

* Fixes mutating `options` to add `stripUnknown`.

### v2.2.3

* Fix #25 by supporting array for type (e.g. ['string', 'null']).
* Additional formats: hostname, uri, ipv4, ipv6.

### v2.2.2

* Added @jsdevel's additionalProperties (#14) fixes (thanks!)

### v2.2.1

* Add default value (#30).

### v2.2.0

* Added support for directly passing a `string` instead of a schema to indicate type.

### v2.1.0

* added support for mapping title (to label in joi).
* added support for mapping description.
* fixed engine version.

### v2.0.0

* updated `joi` to ^9.
* requires node 4 minimum.

### v1.0.4

* when undefined `minLength` should default to 0.

### v1.0.3

* Validate when `additionalProperties` is boolean.

### v1.0.2

* Support for `oneOf`.

### v1.0.1

* Support for `format` in string types.

### v1.0.0

* [BREAKING] `subSchemas` is now passed as a property in `options`.
* Support for custom types using `options.types`.
