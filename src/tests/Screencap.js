var path = require('path');

var Screencap = function(parentTest) {
  this.logger = parentTest.logger;
  this.outputDir = parentTest.outputDir;
  this.fps = parentTest.fps;

  this.page = null;
  this.isRunning = false;
  this.screenshotCount = 0;
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
