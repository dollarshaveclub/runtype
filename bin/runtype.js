#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const path = require('path')

const parse = require('../lib/parse')
const render = require('../lib/render')
const { version } = require('../package')

const program = require('commander')
  .version(version)
  .option('-f, --files <glob>', 'A blob expression of Typescript files')
  .option('-o, --output <filename>', 'The filename to save the javascript data to')
  .option('-d, --debug', 'Show additional debug output')
  .parse(process.argv)

const {
  files: globPattern,
  output,
  debug,
} = program

if (!globPattern) {
  program.outputHelp()
  process.exit(1)
}

const files = glob.sync(globPattern)
const data = parse({ files, debug })

if (debug) {
  console.log(JSON.stringify(data, null, 2))
  return process.exit(0)
}

const javascript = render(data)

if (output) mkdirp.sync(path.dirname(output))

const outStream = output
  ? fs.createWriteStream(output)
  : process.stdout

outStream.write(javascript)
