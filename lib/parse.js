const {
  ScriptTarget: { ES5 },
  ModuleKind: { CommonJS },
  createCompilerHost,
  createProgram,
  getCombinedModifierFlags,
  forEachChild,
  SyntaxKind,
  ModifierFlags,
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
    }

    // Temporary flags to help the walker make decisions
    this.cache = {
      aliasOpen: false,
      currentAliasName: null,

      interfaceOpen: false,
      currentInterface: [],
      currentPropName: null,
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
    const options = {
      target: ES5,
      module: CommonJS
    }

    const host = createCompilerHost(options, true)
    const program = createProgram(this.files, options, host)

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
        this.cache.currentInterface.push({ name, props: {} })

        this.output.interfaces[name] = {}
        break;

      // Example code: type ID = string | number
      case SyntaxKind.TypeAliasDeclaration:
        this.flushCache()
        this.cache.interfaceOpen = false
        this.cache.aliasOpen = true
        this.cache.currentAliasName = node.name.getText()
        this.output.aliases[this.cache.currentAliasName] = []
        break;

      // Is either a variable name or a property name, it depends on what the
      // last decleration was
      case SyntaxKind.Identifier:
        const key = node.escapedText
        const currentInterface = this.cache.currentInterface[0]
        if (!this.cache.interfaceOpen || currentInterface.name === key) return
        this.cache.currentPropName = key
        this.cache.currentInterface[0].props[key] = {
          optional: false,
        }
        break;

      // Example Code: name?: string
      case SyntaxKind.QuestionToken:
        this.cache.currentInterface[0].props[this.cache.currentPropName].optional = true
        break;

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
          this.serializeInterfacePropType(node.kind)
        } else {
          this.serializeAliasType(node.kind)
        }
      break;

      // We're done parsing _this_ file
      case SyntaxKind.EndOfFileToken:
        this.flushCache()
        break;

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
    this.cache.currentInterface.forEach((obj) => {
      const { name } = obj
      delete obj.name

      this.output.interfaces[name] = Object.assign({}, obj)
    })
    this.cache.currentInterface.pop()
  }

  /**
   * Takes a node kind and injects its type into the proper location for aliases
   * @param  {number} kind    Number code representing the Typescript node type
   * @return {undefined}
   */
  serializeAliasType (kind) {
    this.output.aliases[this.cache.currentAliasName].push(SyntaxKind[kind].replace('Keyword', '').toLowerCase())
  }

  /**
   * Takes a node kind and injects its type into the proper location for interface
   * properties
   * @param  {number} kind    Number code representing the Typescript node type
   * @return {undefined}
   */
  serializeInterfacePropType (kind) {
    const prop = this.cache.currentInterface[0].props[this.cache.currentPropName]
    if (!prop.type) {
      prop.type = []
    }
    prop.type.push(SyntaxKind[kind].replace('Keyword', '').toLowerCase())
  }
}

module.exports = (opts) => new RuntypeParser(opts)
