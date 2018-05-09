const ts = require('typescript')

module.exports = function (files, debug = false) {

  const options = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
  }

  const host        = ts.createCompilerHost(options, true)
  const program     = ts.createProgram(files, options, host)
  const checker     = program.getTypeChecker()
  const sourceFile  = program.getSourceFile(files[0])

  return ts.forEachChild(sourceFile, visit.bind({
    aliases: {},
    interfaces: {},
    _cache: {
      debug: false,
      aliasOpen: false,
      currentAliasName: null,

      interfaceOpen: false,
      currentInterface: [],
      currentPropName: null,
    }
  }))
}

function visit (node){
  if (this._cache.debug) console.log(ts.SyntaxKind[node.kind].padEnd(30), node.getText())
  switch (node.kind) {

    case ts.SyntaxKind.InterfaceDeclaration:
      flushCache.call(this)
      const name = node.name.getText()
      this._cache.interfaceOpen = true
      this._cache.aliasOpen = false
      this._cache.currentInterface.push({ name, props: {} })

      this.interfaces[name] = {}
      break;

    case ts.SyntaxKind.TypeAliasDeclaration:
      flushCache.call(this)
      this._cache.interfaceOpen = false
      this._cache.aliasOpen = true
      this._cache.currentAliasName = node.name.getText()
      this.aliases[this._cache.currentAliasName] = []
      break;

    case ts.SyntaxKind.Identifier:
      const key = node.escapedText
      const currentInterface = this._cache.currentInterface[0]
      if (!this._cache.interfaceOpen || currentInterface.name === key) return
      this._cache.currentPropName = key
      this._cache.currentInterface[0].props[key] = {
        optional: false,
      }
      break;

    case ts.SyntaxKind.QuestionToken:
      this._cache.currentInterface[0].props[this._cache.currentPropName].optional = true
      break;

    case ts.SyntaxKind.ObjectKeyword:
    case ts.SyntaxKind.SymbolKeyword:
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.UndefinedKeyword:
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.BooleanKeyword:
      if (this._cache.interfaceOpen) {
        serializeInterfacePropType.call(this, node.kind)
      } else {
        serializeAliasType.call(this, node.kind)
      }
    break;

    case ts.SyntaxKind.EndOfFileToken:
      flushCache.call(this)
      delete this._cache
      return this
      break;

  }
  return ts.forEachChild(node, visit.bind(this))
}

function flushCache () {
  this._cache.currentInterface.forEach((obj) => {
    const { name } = obj
    delete obj.name

    this.interfaces[name] = Object.assign({}, obj)
  })
  this._cache.currentInterface.pop()
}

function serializeAliasType (kind) {
  this.aliases[this._cache.currentAliasName].push(ts.SyntaxKind[kind].replace('Keyword', '').toLowerCase())
}

function serializeInterfacePropType (kind) {
  const prop = this._cache.currentInterface[0].props[this._cache.currentPropName]
  if (!prop.type) {
    prop.type = []
  }
  prop.type.push(ts.SyntaxKind[kind].replace('Keyword', '').toLowerCase())
}

function isNodeExported(node) {
  return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 || (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
}
