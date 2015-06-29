var MAX_TEST_ITERATIONS = 10;

var fakeTouch = function() {
  var target = document.getElementById('timestep_onscreen_canvas');

  var createTouch = function(type, x, y, id) {
    var e = document.createEvent('UIEvent');
    e.changedTouches = e.touches = [{pageX: x, pageY: y, target: target, identifier: id}];
    e.initUIEvent(type, true, true, window, 1);
    e.target = target;
    return e;
  };

  var x = Math.random() * target.clientWidth;
  var y = Math.random() * target.clientHeight;

  target.dispatchEvent(createTouch('touchstart', x, y, 1));
  setTimeout(function() {
    target.dispatchEvent(createTouch('touchend', x, y, 1));
  }, 50);

  return {x: x, y: y};
};

var FuzzTest = function(parentTest) {
  this.logger = parentTest.logger;

  this.isRunning = false;
  this.page = null;

  this.timerMin = 500;
  this.timerMax = 1000;

  this.iterations = 0;
}

FuzzTest.prototype.start = function(page) {
  this.page = page;
  this.isRunning = true;

  this._loop();
};

FuzzTest.prototype._loop = function() {
  setTimeout(this.run.bind(this), this.getRandomTestTime());
};

FuzzTest.prototype.stop = function() {
  this.isRunning = false;
};

FuzzTest.prototype.run = function() {
  if (!this.isRunning) {
    return;
  }

  this.iterations++;
  var res = this.page.evaluate(fakeTouch);
  this.logger.log('Clicked at: ' + res);
  this._loop();
};

FuzzTest.prototype.getRandomTestTime = function() {
  return Math.random() * (this.timerMax - this.timerMin) + this.timerMin;
};

module.exports = FuzzTest;
