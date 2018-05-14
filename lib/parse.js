const {
  ScriptTarget: { ES5 },
  ModuleKind: { CommonJS },
  createCompilerHost,
  createProgram,
  forEachChild,
  SyntaxKind,
} = require('typescript')
class RuntypeParser {
  /**
   * Initialized the Runtype Parser "engine". Accepts an array of files to parse
   * and compile information from.
   * @param {string[]} files    An array of file names to be loaded into the typescript programs
   * @param {boolean} [debug]   Turns on more verbose logging
   */
  constructor ({ files, debug = false }) {
    this.files = files
    this.debug = debug

    // The data we'll collect over time across files
    this.output = {
      aliases: {},
      interfaces: {},
      enums: {},
    }

    // Temporary flags to help the walker make decisions
    this.cache = {
      aliasOpen: false,
      currentAliasName: null,

      interfaceOpen: false,
      currentInterface: [],
      currentInterfacePropName: null,

      lastTypeNodeOpen: false,
      typeReferenceOpen: false,
      arrayType: false,

      enumOpen: false,
      currentEnum: [],
      currentEnumPropName: null,
    }

    // Return the value of parsing the profiles files
    return this.parse()
  }

  /**
   * Creates typescript programs and walks through their tokens
   * @return {Object} All the good bits we want such as Aliases, Interfaces, and more
   */
  parse () {
    // TS Options
    const compilerOptions = {
      target: ES5,
      module: CommonJS,
    }

    const host = createCompilerHost(compilerOptions, true)
    const program = createProgram(this.files, compilerOptions, host)

    // For every file matched, visit all of its nodes
    this.files.forEach((file) => {
      const sourceFile = program.getSourceFile(file)
      forEachChild(sourceFile, (node) => this.visit(node))
    })

    return this.output
  }

  /**
   * Called when every TS node is parsed. Decides based on current (and historical)
   * node types where to put the pertinant information in the `output` instance variable
   * @param  {Object} node A Typescript Node instance
   * @return {undefined}
   */
  visit (node) {
    if (this.debug) console.log(SyntaxKind[node.kind].padEnd(30), node.getText())

    // Switch the type of node
    switch (node.kind) {
      // Example code: Interface User {}
      case SyntaxKind.InterfaceDeclaration:
        this.flushCache()
        const name = node.name.getText()
        this.cache.interfaceOpen = true
        this.cache.aliasOpen = false
        this.cache.enumOpen = false
        this.cache.currentInterface.push({ name, props: {} })

        this.output.interfaces[name] = {}
        break

      // Example code: type ID = string | number
      case SyntaxKind.TypeAliasDeclaration:
        this.flushCache()
        this.cache.interfaceOpen = false
        this.cache.aliasOpen = true
        this.cache.enumOpen = false
        this.cache.currentAliasName = node.name.getText()
        this.output.aliases[this.cache.currentAliasName] = []
        break

      case SyntaxKind.EnumDeclaration:
        this.flushCache()
        const enumName = node.name.getText()
        this.cache.interfaceOpen = false
        this.cache.aliasOpen = false
        this.cache.enumOpen = true
        this.cache.currentEnum.push({ name: enumName })
        this.output.enums[enumName] = {}
        break

      case SyntaxKind.TypeReference:
        this.cache.typeReferenceOpen = true
        break

      // Is either a variable name or a property name, it depends on what the
      // last decleration was
      case SyntaxKind.Identifier:
        const key = node.escapedText

        if (this.cache.interfaceOpen) {
          const currentInterface = this.cache.currentInterface[0]
          if (currentInterface && currentInterface.name === key) {
            return
          }

          // If we're referencing a type, the key we want to lookup the property by
          // is not the current interface prop name, it's the prior one
          let lookupKey = key
          if (this.cache.typeReferenceOpen) lookupKey = this.cache.currentInterfacePropName
          else this.cache.currentInterfacePropName = key

          currentInterface.props[lookupKey] = currentInterface.props[lookupKey] || {
            optional: false,
          }

          if (this.cache.typeReferenceOpen) {
            this.serializeInterfaceProp('reference', key, this.cache.arrayType)
            this.cache.typeReferenceOpen = false
          }
        } else if (this.cache.enumOpen) {
          const currentEnum = this.cache.currentEnum[0]
          if (currentEnum && currentEnum.name === key) {
            return
          }
          // If we're referencing a type, the key we want to lookup the property by
          // is not the current interface prop name, it's the prior one
          let lookupKey = key
          if (this.cache.typeReferenceOpen) lookupKey = this.cache.currentEnumPropName
          else this.cache.currentEnumPropName = key

          currentEnum[lookupKey] = currentEnum[lookupKey] || {}
        }
        this.cache.arrayType = false

        break

      // Example Code: name?: string
      case SyntaxKind.QuestionToken:
        this.cache.currentInterface[0].props[this.cache.currentInterfacePropName].optional = true
        break

      // Example: number, string, null, etc. This is called when a type is
      // provided. Who it belongs to depends on what the last decleration was
      case SyntaxKind.ObjectKeyword:
      case SyntaxKind.SymbolKeyword:
      case SyntaxKind.StringKeyword:
      case SyntaxKind.NumberKeyword:
      case SyntaxKind.UndefinedKeyword:
      case SyntaxKind.NullKeyword:
      case SyntaxKind.BooleanKeyword:
        if (this.cache.interfaceOpen) {
          this.serializeInterfaceProp('primitive', node.kind, this.cache.arrayType)
        } else {
          this.serializeAliasType('primitive', node.kind, this.cache.arrayType)
        }
        this.cache.arrayType = false
        break

      // Called when a literal value is provided
      case SyntaxKind.LastTypeNode:
        if (this.cache.interfaceOpen) this.cache.lastTypeNodeOpen = true
        break

      // Parse Strings
      case SyntaxKind.StringLiteral:
        this.serializeLiteral(node.getText().replace(/^('|")|('|")$/g, '')) // Remove double quotes
        break

      // Parse numbers
      case SyntaxKind.FirstLiteralToken:
        this.serializeLiteral(parseInt(node.getText(), 10))
        break

      // Parse false
      case SyntaxKind.FalseKeyword:
        this.serializeLiteral(false)
        break

      // Parse true
      case SyntaxKind.TrueKeyword:
        this.serializeLiteral(true)
        break

      case SyntaxKind.ArrayType:
        this.cache.arrayType = true
        break

      // We're done parsing this particular file
      case SyntaxKind.EndOfFileToken:
        this.flushCache()
        break
    }

    // Walk all of the children
    forEachChild(node, (node) => this.visit(node))
  }

  /**
   * Takes all of the information we're been storing ephemerally and writes it
   * to our output variables. This is used when building interfaces over many
   * cycles
   * @return {undefined}
   */
  flushCache () {
    const flush = [
      { flushKey: 'currentInterface', outputKey: 'interfaces' },
      { flushKey: 'currentEnum', outputKey: 'enums' },
    ]

    flush.forEach(({ flushKey, outputKey }) => {
      this.cache[flushKey].forEach((obj) => {
        const { name } = obj
        delete obj.name

        this.output[outputKey][name] = Object.assign({}, obj)
      })
      this.cache[flushKey].pop()
    })
  }

  /**
   * Takes a node kind and injects its type into the proper location for aliases
   * @param  {number} kind    Number code representing the Typescript node type
   * @return {undefined}
   */
  serializeAliasType (type, kind, list) {
    this.output.aliases[this.cache.currentAliasName].push({
      type,
      value: type === 'reference' ? kind : SyntaxKind[kind].replace('Keyword', '').toLowerCase(),
    })
  }

  serializeEnumValue (value) {
    this.cache.currentEnum[0][this.cache.currentEnumPropName] = {
      type: 'enum',
      namespace: this.cache.currentEnum[0].name,
      name: this.cache.currentEnumPropName,
      value,
    }
  }

  serializeLiteral (value) {
    if (this.cache.lastTypeNodeOpen && this.cache.interfaceOpen) {
      this.serializeInterfaceValue('literal', value)
      this.cache.lastTypeNodeOpen = false
    } else if (this.cache.enumOpen) {
      this.serializeEnumValue(value)
    }
  }

  /**
   * Takes a node kind and injects its type into the proper location for interface
   * properties
   * @param  {string} type    A string to represent what type of value is described
   * @param  {number} kind    Number code representing the Typescript node type
   * @return {undefined}
   */
  serializeInterfaceProp (type, kind, array = false) {
    const prop = this.cache.currentInterface[0].props[this.cache.currentInterfacePropName]
    if (!prop.types) prop.types = []
    prop.types.push({
      type,
      value: type === 'reference' ? kind : SyntaxKind[kind].replace('Keyword', '').toLowerCase(),
      array,
    })
  }

  /**
   * Takes a literal value and injects it into interface properties values
   * @param  {mixed} value    Any value to push to an accepted list of values
   * @return {undefined}
   */
  serializeInterfaceValue (type, value, array = false) {
    const prop = this.cache.currentInterface[0].props[this.cache.currentInterfacePropName]
    if (!prop.types) prop.types = []
    prop.types.push({
      type,
      value,
      array,
    })
  }
}

// Transaction({
//   paymentMethod: enums.Carts.Standalone
// })

module.exports = (opts) => new RuntypeParser(opts)
