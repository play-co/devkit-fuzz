var fs = require('fs');

var Logger = function() {
  this.path = null;
  this.isOpen = false;
  this.writeStream = null;
};

Logger.prototype.open = function(path) {
  this.path = path;
  this.writeStream = fs.createWriteStream(path, {flags: 'w'});
};

Logger.prototype.close = function() {
  this.log('');
  this.writeStream.end();
  this.writeStream = null;
};

Logger.prototype.log = function(str) {
  if (!this.writeStream) {
    throw new Error('logger not open');
  }

  this.writeStream.write(str + '\n');
};

module.exports = Logger;
