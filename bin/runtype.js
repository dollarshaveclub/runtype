#!/usr/bin/env node

const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const path = require('path')
const getStdin = require('get-stdin')
const rimraf = require('rimraf')

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

;(async () => {
  // Get STDIN contents
  const code = await getStdin()

  let files
  if (code) {
    // Create temporary files for typescript to parse
    const tmpFileOutput = './.tmp/build.ts'
    mkdirp.sync(path.dirname(tmpFileOutput))
    fs.writeFileSync(tmpFileOutput, code)
    files = [tmpFileOutput]
  } else if (globPattern) {
    // Just find the files the user provided
    files = glob.sync(globPattern)
  } else {
    // Exit if no input was given
    program.outputHelp()
    process.exit(1)
  }

  // Parse teh data
  const data = parse({ files, debug })

  // If we provided code, we know we need to clean up our temp folder
  if (code) rimraf.sync('./.tmp')

  // If we're debugging, just spit some useful info out and exit
  if (debug) {
    console.log(JSON.stringify(data, null, 2))
    return process.exit(0)
  }

  // Create our Javascript file
  const javascript = render(data)

  // Ensure we have the output directory available to write to
  if (output) mkdirp.sync(path.dirname(output))

  const outStream = output
    // Write it to disk if the user provided an output file
    ? fs.createWriteStream(output)

    // Otherwise, send it to stdout
    : process.stdout

  outStream.write(javascript)
})()
