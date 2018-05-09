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

const files = glob.sync(globPattern)
const data = parse(files)
const javascript = render(data)

mkdirp.sync(path.dirname(output))
fs.writeFileSync(output, javascript)
