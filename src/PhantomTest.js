var path = require('path');
var exec = require('child_process').exec;

var fs = require('fs-extra');
var phantom = require('phantom');
var Q = require('q');

var Logger = require('./Logger');

var OUTPUT_DIR = 'output';
var FPS = 10;

/**
 * Ensures a directory exists, and is empty
 */
var ensureDirectoryClean = function(dir) {
  fs.emptyDirSync(dir);
};

/**
 * Run ffmpeg in a directory, converting a series of screenshots to a screencap
 * Resolves (or rejects) once the command has finished running
 * @returns {promise}
 */
var runffmpeg = function(outputDir) {
  var deferred = Q.defer();

  var input = path.join(outputDir, 'screenshot%d.jpeg');
  var output = path.join(outputDir, 'screencap.webm');
  console.log('running ffmpeg...', input);

  // Remove the old one if it exists
  if (fs.existsSync(output)) {
    fs.unlinkSync(output);
  }

  var cmd = 'ffmpeg -r ' + FPS + ' -i ' + input + ' -g 120 -level 216 -profile 0 -qmax 42 -qmin 10 -rc_buf_aggressivity 0.95 -vb 2M ' + output;

  exec(cmd, function (error, stdout, stderr) {
    console.log('ffmpeg complete');

    if (error) {
      deferred.reject(error);
    } else {
      deferred.resolve();
    }
  });

  return deferred.promise;
};

//////////////////////////////////////
//////////////////////////////////////

/**
 * @class PhantomTest
 * @param  {object} opts
 * @param  {string} opts.url
 * @param  {string} opts.name
 * @param  {Ctor[]} opts.tests
 */
var PhantomTest = function(opts) {
  this.url = opts.url;
  this.name = opts.name;

  this.fps = FPS;

  this.outputDir = path.join(OUTPUT_DIR, this.name);
  ensureDirectoryClean(this.outputDir);

  this.logger = new Logger();
  this.logger.open(path.join(this.outputDir, 'jsOutput.txt'));

  this.tests = [];
  if (opts.tests) {
    opts.tests.forEach(function(testCtor) {
      this.tests.push(new testCtor(this));
    }.bind(this));
  }

  this.isRunning = false;

  this.shutdown = Q.defer();
  this.shutdown.promise.then(this._handleShutdown.bind(this));
  this.shutdown.promise.fin(function () {
      this.logger.close();
      process.exit(this.shutdownCode ? 1 : 0);
    }.bind(this));
};

/**
 * Handle all of the cleanup required for phantom, logger, and tests
 * Resolves once tests have stopped, logger has closed, and phantom instance exited
 * @returns {promise}
 */
PhantomTest.prototype._handleShutdown = function(code) {
  if (!this.isRunning) return;
  var deferred = Q.defer();

  this.isRunning = false;
  this.shutdownCode = code;
  console.log('Shutdown:', code || 'allGood');

  // Shutdown tests and phantom
  this.tests.forEach(function(test) {
    test.stop();
  });
  this.ph.exit();

  // ffmpeg bullshit
  setTimeout(function() {
    this.logger.log('SHUTDOWN ' + code);

    deferred.resolve();
  }.bind(this), 1000);

  return deferred.promise;
}

/**
 * Sets up the phantom page, routes logging to the logger, and catches page errors (causing early shutdown)
 * Resolves once setup is complete.
 * @returns {promise}
 */
PhantomTest.prototype.setupPhantomPage = function() {
  var page = this.page;
  var logger = this.logger
  var shutdown = this.shutdown;
  var deferred = Q.defer();

  page.set('onConsoleMessage', function(msg, lineNum, sourceId) {
    logger.log(msg);
  });

  page.set('onError', function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];

    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
      });
    }

    console.log('Page error encountered');
    logger.log(msgStack.join('\n'));
    shutdown.resolve('pageError');
  });

  page.set('viewportSize', {
    width: 768,
    height: 1334
  });

  return deferred.resolve();
};

/**
 * Runs a series of promises to exercise the tests
 */
PhantomTest.prototype.runTest = function() {
  this.isRunning = true;

  // Shutdown
  this.shutdown.promise.then(function() {
      return runffmpeg(this.outputDir);
    }.bind(this));

  // Run phantom on the URL
  this.createPhantom()
    .then(this.setupPhantomPage.bind(this))
    .then(this.openPage.bind(this))
    .then(function() {
      // Everything is ready to go, shutdown after max of ten seconds
      setTimeout(function() {
        this.shutdown.resolve();
      }.bind(this), 10 * 1000);
    }.bind(this))
    .catch(function(err) {
      console.error(err.stack);
      process.exit(1);
    });
};

/**
 * Creates a phantom, and phantom.page instance
 * Resolves once the phantom and phantom.page instances are initilized
 * @returns {promise}
 */
PhantomTest.prototype.createPhantom = function() {
  var deferred = Q.defer();

  phantom.create(function (ph) {
    this.ph = ph;
    this.ph.createPage(function (page) {
      this.page = page;
      deferred.resolve();
    }.bind(this));
  }.bind(this));

  return deferred.promise;
};

/**
 * Opens the url using the phantom.page instance.
 * Resolves once the page has been opened and tests started
 * @returns {promise}
 */
PhantomTest.prototype.openPage = function() {
  var deferred = Q.defer();

  this.page.open(this.url, function (status) {
    this.logger.log('Page opened...');

    this.tests.forEach(function(test) {
      test.start(this.page);
    }.bind(this));

    deferred.resolve();
  }.bind(this));

  return deferred.promise;
};

module.exports = PhantomTest;
