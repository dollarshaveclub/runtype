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

class Parser {
  constructor ({ files, debug = false }) {
    this.files = files
    this.debug = debug

    this.output = {
      aliases: {},
      interfaces: {},
    }

    this.cache = {
      debug: false,
      aliasOpen: false,
      currentAliasName: null,

      interfaceOpen: false,
      currentInterface: [],
      currentPropName: null,
    }

    return this.parse()
  }

  parse () {
    const options = {
      target: ES5,
      module: CommonJS
    }

    const host = createCompilerHost(options, true)
    const program = createProgram(this.files, options, host)
    const sourceFile = program.getSourceFile(this.files[0])

    return forEachChild(sourceFile, (node) => this.visit(node))
  }

  visit (node) {
    if (this.cache.debug) console.log(SyntaxKind[node.kind].padEnd(30), node.getText())

    switch (node.kind) {

      case SyntaxKind.InterfaceDeclaration:
        this.flushCache()
        const name = node.name.getText()
        this.cache.interfaceOpen = true
        this.cache.aliasOpen = false
        this.cache.currentInterface.push({ name, props: {} })

        this.output.interfaces[name] = {}
        break;

      case SyntaxKind.TypeAliasDeclaration:
        this.flushCache()
        this.cache.interfaceOpen = false
        this.cache.aliasOpen = true
        this.cache.currentAliasName = node.name.getText()
        this.output.aliases[this.cache.currentAliasName] = []
        break;

      case SyntaxKind.Identifier:
        const key = node.escapedText
        const currentInterface = this.cache.currentInterface[0]
        if (!this.cache.interfaceOpen || currentInterface.name === key) return
        this.cache.currentPropName = key
        this.cache.currentInterface[0].props[key] = {
          optional: false,
        }
        break;

      case SyntaxKind.QuestionToken:
        this.cache.currentInterface[0].props[this.cache.currentPropName].optional = true
        break;

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

      case SyntaxKind.EndOfFileToken:
        this.flushCache()
        delete this.cache
        return this
        break;

    }
    return forEachChild(node, (node) => this.visit(node))
  }

  flushCache () {
    this.cache.currentInterface.forEach((obj) => {
      const { name } = obj
      delete obj.name

      this.output.interfaces[name] = Object.assign({}, obj)
    })
    this.cache.currentInterface.pop()
  }

  serializeAliasType (kind) {
    this.output.aliases[this.cache.currentAliasName].push(SyntaxKind[kind].replace('Keyword', '').toLowerCase())
  }

  serializeInterfacePropType (kind) {
    const prop = this.cache.currentInterface[0].props[this.cache.currentPropName]
    if (!prop.type) {
      prop.type = []
    }
    prop.type.push(SyntaxKind[kind].replace('Keyword', '').toLowerCase())
  }
}

module.exports = Parser
