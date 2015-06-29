var PhantomTest = require('./PhantomTest');
var FuzzTest = require('./tests/FuzzTest');
var Screencap = require('./tests/Screencap');

module.exports = function(url, name) {
  var test = new PhantomTest({
    url: url,
    name: name,
    tests: [
      Screencap,
      FuzzTest
    ]
  });
  return test.runTest();
};

module.exports.PhantomTest = PhantomTest;
module.exports.tests = {
  FuzzTest: FuzzTest,
  Screencap: Screencap
}
