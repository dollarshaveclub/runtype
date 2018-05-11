const { exec } = require('child_process')
const path = require('path')

const { version } = require(path.resolve('package.json'))

const fileMsg = 'dsc-cli:check-package-version:'

exec(`git tag -l ${version}`, (err, stdout, stderr) => {
  if (err) {
    console.error(`${fileMsg}error; see below:`)
    console.error(err.stack)
    console.error(stdout.toString())
    console.error(stderr.toString())
    process.exit(1)
  } else if (!stdout) {
    console.info(`${fileMsg}git tag ${version} does not exist`)
  } else {
    console.info(`${fileMsg}git tag ${version} exists`)
  }
})
