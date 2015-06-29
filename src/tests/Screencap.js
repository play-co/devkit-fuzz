var path = require('path');
var exec = require('child_process').exec;

var fs = require('fs-extra');
var Q = require('q');

var FPS = 10;

/**
 * Run ffmpeg in a directory, converting a series of screenshots to a screencap
 * Resolves (or rejects) once the command has finished running
 * @returns {promise}
 */
var runffmpeg = function(outputDir) {
  var deferred = Q.defer();

  var input = path.join(outputDir, 'screenshot%d.jpeg');
  var output = path.join(outputDir, 'screencap.webm');
  console.log('running ffmpeg...', input, output);

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

var Screencap = function(parentTest) {
  this.logger = parentTest.logger;
  this.outputDir = parentTest.outputDir;
  this.fps = parentTest.fps;

  this.page = null;
  this.isRunning = false;
  this.screenshotCount = 0;

  // Convert all screencaps into a webm
  parentTest.shutdown.promise = parentTest.shutdown.promise.then(function() {
      return runffmpeg(parentTest.outputDir);
    });
}

Screencap.prototype.start = function(page) {
  this.page = page;
  this.isRunning = true;

  this._loop();
}

Screencap.prototype.stop = function() {
  this.isRunning = false;
}

Screencap.prototype._loop = function(page) {
  setTimeout(this.run.bind(this), 1000 / this.fps);
}

Screencap.prototype.run = function() {
  if (!this.isRunning) {
    return;
  }

  this.screenshotCount++;
  var screenshotName = 'screenshot' + this.screenshotCount + '.jpeg';
  var screenshotPath = path.join(this.outputDir, screenshotName);

  this.page.render(screenshotPath, {format: 'jpeg', quality: '25'});

  this._loop();
}

module.exports = Screencap;
