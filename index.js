const SchemaResolver = require('./lib/resolver');

function resolver(options = {}, joiInstance) {
    return new SchemaResolver(options, joiInstance);
}

function schema(schema, options = { }, joiInstance) {
    const joiResolver = resolver(options, joiInstance);
    const joiSchema = joiResolver.convert(schema);
    return joiSchema;
}

exports.resolver = resolver;
exports.schema = schema;
