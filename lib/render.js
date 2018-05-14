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
      const enumObject = runtypes.enums[id]
      const targetType = resolveType(target)

      if (targetType === 'enum') {
        const unwrapped = target()
        const { namespace, name } = unwrapped
        try {
          return unwrapped === runtypes.enums[namespace][name]
        } catch (e) {
          return false
        }
      }

      // console.log(interfaceObject, enumObject, alias)

      const isValid = (value, items) => items.some(({ type, value: expectedValue, array }) => {
        if (array) {
          if (!Array.isArray(value)) return false
          return value.every((v) => isValid(v, [{ type, value: expectedValue }]))
        }
        if (type === 'enum') throw new Error('wat')
        if (type === 'literal') return value === expectedValue
        if (type === 'primitive') return resolveType(value) === expectedValue
        if (type === 'reference') return validate(expectedValue, value)
      })

      if (alias) return isValid(target, alias)

      if (enumObject) {
        throw new Error('WOO')
      }

      if (interfaceObject) {
        if (targetType !== 'object') return false

        return Object.keys(interfaceObject.props).every((interfacePropKey) => {
          const prop = interfaceObject.props[interfacePropKey]
          if (prop.optional && !(interfacePropKey in target)) return true
          return isValid(target[interfacePropKey], prop.types)
        })
      }
    }
    module.exports.validate = validate

    function resolveType (val) {
      if (val === null) return 'null'
      if (Array.isArray(val)) return 'array'
      if (typeof val === 'function') return 'enum'
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

  // Write Interfaces
  Object.keys(parsedData.interfaces).forEach((key) => {
    js += `module.exports.interfaces.${key} = (val) => {
      if (!validate('${key}', val)) throw new Error('Invalid value for interface ${key}')
    }\n`
  })

  // Write Enums
  js += `module.exports.enums = {`
  Object.keys(parsedData.enums).forEach((key) => {
    js += `'${key}': {`
    Object.keys(parsedData.enums[key]).forEach((enumKey) => {
      js += `'${enumKey}': () => runtypes.enums['${key}']['${enumKey}'],\n`
    })
    js += `},`
  })
  js += `}`

  return prettier.format(js, {
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
    arrowParens: 'always',
    printWidth: 500,
  })
}
