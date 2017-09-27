'use strict';

class WptError extends Error {
  constructor(message, extra) {
    super(message);
    this.extra = extra || {};
    this.name = this.constructor.name;
  }
}

class TimeoutError extends WptError {
  constructor(message, extra) {
    super(message, extra);
  }
}

module.exports = {
  WptError,
  TimeoutError
};
