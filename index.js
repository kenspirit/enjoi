const SchemaResolver = require('./lib/resolver');

function resolver(options = {}) {
    return new SchemaResolver(options);
}

function schema(schema, options = { }) {
    const joiResolver = resolver(options);
    const joiSchema = joiResolver.convert(schema);
    return joiSchema;
}

exports.resolver = resolver;
exports.schema = schema;
