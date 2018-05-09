#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const path = require('path')

const Parser = require('../lib/parser')
const render = require('../lib/render')
const { version } = require('../package')

const program = require('commander')
  .version(version)
  .option('-f, --files <glob>', 'A blob expression of Typescript files')
  .option('-o, --output <filename>', 'The filename to save the javascript data to')
  .parse(process.argv)

const {
  files: globPattern,
  output: outputFolder,
} = program

if (!globPattern) {
  program.outputHelp()
  process.exit(1)
}

const files = glob.sync(globPattern)
const { output } = new Parser({ files })
const javascript = render(output)

if (outputFolder) mkdirp.sync(path.dirname(outputFolder))

const outStream = outputFolder ?
  fs.createWriteStream(outputFolder) :
  process.stdout

outStream.write(javascript)
