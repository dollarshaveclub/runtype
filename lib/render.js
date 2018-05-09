const prettier = require('prettier')

const stringArray = (array) => `[${array.map((s) => "'" + s + "'")}]`

// Is there a better way to like... Do this whole thing?
module.exports = (parsedData) => {
  if (!parsedData) return

  let js = `
    const resolveType = module.exports.resolveType = (val) => {
      if (val === null) return 'null';
      if (Array.isArray(val)) return 'array';
      return typeof val;
    }

    const validateType = module.exports.validateType = (key, val, allowedTypes) => {
      const type = resolveType(val);
      if (allowedTypes.indexOf(type) === -1) throw new Error('Invalid type for ' + key + ', expected ' + allowedTypes + ' but got ' + type);
    }

    const validateValue = module.exports.validateValue = (key, val, allowedValues) => {
      if (allowedValues.indexOf(val) === -1) throw new Error('Invalid value for ' + key + ', expected ' + allowedValues + ' but got ' + val);
    }

    module.exports.aliases = {};
    module.exports.interfaces = {};
    module.exports.enums = {};\n\n`


  // Write Aliases
  Object.keys(parsedData.aliases).forEach((key) => {
    const types = parsedData.aliases[key]
    js += `module.exports.aliases.${key} = (val) => validateType('${key}', val, ${stringArray(types)});`
  })

  Object.keys(parsedData.interfaces).forEach((interfaceKey) => {
    const propKeys = Object.keys(parsedData.interfaces[interfaceKey].props)
    js += `
      module.exports.interfaces.${interfaceKey} = (obj) => {
        if (!obj) throw new Error('No data provided to ${interfaceKey}');
        ${propKeys.map((propkey) => {
          let propValidations = ''
          const prop = parsedData.interfaces[interfaceKey].props[propkey]

          if (!prop.optional) propValidations += `if (!('${propkey}' in obj)) throw new Error('Prop ${propkey} was not found in ${interfaceKey} object');\n`
          return propValidations
        }).join('').trim("\n")}

      ${propKeys.map((propkey) => {
        const prop = parsedData.interfaces[interfaceKey].props[propkey]
        const types = prop.types
        const values = prop.values
        const presenceCondition = prop.optional ? `if ('${propkey}' in obj) ` : ''

        if (types.length) {
          return `${presenceCondition}validateType('${propkey}', obj['${propkey}'], ${stringArray(types)});`
        } else if (values.length) {
          return `${presenceCondition}validateValue('${propkey}', obj['${propkey}'], ${stringArray(values)});`
        }
      }).join('')}
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
