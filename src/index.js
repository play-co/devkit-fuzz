var argv = require('yargs')
  .options({
    'u': {
      alias: 'url',
      demand: true,
      describe: 'The url of the current game to test',
      type: 'string'
    },
    'n': {
      alias: 'name',
      demand: true,
      describe: 'The name of the game currently being tested',
      type: 'string'
    }
  })
  .argv;


var PhantomTest = require('./PhantomTest');
var FuzzTest = require('./tests/FuzzTest');
var Screencap = require('./tests/Screencap');

var test = new PhantomTest({
  url: argv.url,
  name: argv.name,
  tests: [
    Screencap,
    FuzzTest
  ]
});
test.runTest();
