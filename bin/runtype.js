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
  .parse(process.argv)

const {
  files: globPattern,
  output,
} = program

if (!globPattern) {
  program.outputHelp()
  process.exit(1)
}

const files = glob.sync(globPattern)
const data = parse(files)
const javascript = render(data)

if (output) {
  mkdirp.sync(path.dirname(output))
}

const outStream = output ?
  fs.createWriteStream(output) :
  process.stdout

outStream.write(javascript)
