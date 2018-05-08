const fs = require('fs')
const parse = require('./lib/parse')

const result = parse(['./examples/interfaces.ts'])


let js = `
function resolveType (val) {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  return typeof val
}

function validateType(key, val, allowedTypes) {
  const type = resolveType(val)
  if (allowedTypes.indexOf(type) === -1) throw new Error('Invalid type for ' + key + ', expected ' + allowedTypes + ' but got ' + type)
}
`

const stringArray = (array) => `[${array.map((s) => "'" + s + "'")}]`

// Write Aliases
Object.keys(result.aliases).forEach((key) => {
  const types = result.aliases[key]
  js += `
function ${key} (val) {
  validateType('${key}', val, ${stringArray(types)})
}
`
})

Object.keys(result.interfaces).forEach((interfaceKey) => {
  const propKeys = Object.keys(result.interfaces[interfaceKey].props)
  js += `
function ${interfaceKey} (obj) {
  if (!obj) throw new Error('No data provided to ${interfaceKey}')
  ${propKeys.map((propkey) => {
    let propValidations = ''
    const prop = result.interfaces[interfaceKey].props[propkey]

    if (!prop.optional) propValidations += `  if (!('${propkey}' in obj)) throw new Error('Prop ${propkey} was not found in ${interfaceKey} object')\n`
    return propValidations
  }).join('').trim("\n")}
${propKeys.map((propkey) => {
  const prop = result.interfaces[interfaceKey].props[propkey]
  const types = prop.type
  const presenceCondition = prop.optional ? `if ('${propkey}' in obj) ` : ''
  return `
  ${presenceCondition}validateType('${propkey}', obj['${propkey}'], ${stringArray(types)})`
}).join('')}
}
`
})

console.log(JSON.stringify(result, null, 2))

fs.writeFileSync('./build/interfaces.js', js)
