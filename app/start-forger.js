const fs = require('fs')
const assert = require('assert-plus')
const commander = require('commander')
const packageJson = require('../package.json')
const path = require('path')
const goofy = require('app/core/goofy')
const ForgerManager = require('app/core/managers/forger')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

assert.string(commander.config, 'commander.config')

if (!fs.existsSync(path.resolve(commander.config))) {
  throw new Error('The directory does not exist or is not accessible because of security settings.')
}

const config = require('app/core/config')
let forgerManager = null
let forgers = null

process.on('unhandledRejection', (reason, p) => {
  goofy.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

config.init({
  server: require(path.resolve(commander.config, 'server')),
  genesisBlock: require(path.resolve(commander.config, 'genesis-block.json')),
  network: require(path.resolve(commander.config, 'network')),
  delegates: require(path.resolve(commander.config, 'delegate'))
})
.then(() => goofy.init(config.server.logging.console, config.server.logging.file, config.network.name + '-forger'))
.then(() => (forgerManager = new ForgerManager(config)))
.then(() => (forgers = forgerManager.loadDelegates()))
.then(() => goofy.info('ForgerManager started with', forgers.length, 'forgers'))
.then(() => forgerManager.startForging('http://127.0.0.1:4000'))
.catch((fatal) => goofy.error('fatal error', fatal))