const prettier = require('prettier')

module.exports = (parsedData) => {
  if (!parsedData) return

  let js = `
    const runtypes = module.exports.runtypes = ${JSON.stringify(parsedData)};

    const aliases = module.exports.aliases = {};
    const interfaces = module.exports.interfaces = {};
    const enums = module.exports.enums = {};

    function validate (id, target) {
      const alias = runtypes.aliases[id]
      const interfaceObject = runtypes.interfaces[id]
      const targetType = resolveType(target)

      const resolvePrimitiveOrReference = (items, t) => items.some(({ type, value }) => {
        if (type === 'primitive') return resolveType(t) === value
        else if (type === 'literal') return t === value
        else if (type === 'reference') return validate(value, t)
      })

      if (alias) return resolvePrimitiveOrReference(alias, target)

      if (interfaceObject) {
        if (targetType !== 'object') return false

        return Object.keys(interfaceObject.props).every((interfacePropKey) => {
          const prop = interfaceObject.props[interfacePropKey]
          if (prop.optional && !(interfacePropKey in target)) return true
          return resolvePrimitiveOrReference(prop.types, target[interfacePropKey])
        })
      }
    }
    module.exports.validate = validate

    function resolveType (val) {
      if (val === null) return 'null'
      if (Array.isArray(val)) return 'array'
      return typeof val
    }
    module.exports.resolveType = resolveType

`

  // Write Aliases
  Object.keys(parsedData.aliases).forEach((key) => {
    js += `module.exports.aliases.${key} = (val) => {
      if (!validate('${key}', val)) throw new Error('Invalid value for type alias ${key}')
    }\n`
  })

  // Write Aliases
  Object.keys(parsedData.interfaces).forEach((key) => {
    js += `module.exports.interfaces.${key} = (val) => {
      if (!validate('${key}', val)) throw new Error('Invalid value for interface ${key}')
    }\n`
  })

  return prettier.format(js, {
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
    arrowParens: 'always',
    printWidth: 500,
  })
}
