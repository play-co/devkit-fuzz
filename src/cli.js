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

require('./index')(argv.url, argv.name);
