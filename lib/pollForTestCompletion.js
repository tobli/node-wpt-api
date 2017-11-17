'use strict';

const { TimeoutError } = require('./errors');
const Promise = require('bluebird');
const { name } = require('../package.json');
const debug = require('debug')(name);

module.exports = function pollForTestCompletion(
  connection,
  testId,
  pollIntervalSeconds = 5,
  maxWaitSeconds = 180
) {
  // FIXME max queue time vs max execution time??

  const maxTime = Date.now() + maxWaitSeconds * 1000;

  function pollRecursive() {
    return Promise.delay(pollIntervalSeconds * 1000)
      .then(() => connection.getTestStatus(testId))
      .then(status => {
        if (status.statusCode === 200) {
          return testId;
        }
        if (Date.now() > maxTime) {
          throw new TimeoutError(
            `Failed to get test result within ${maxWaitSeconds} seconds.`
          );
        }
        debug(status.statusText);
        return pollRecursive();
      });
  }

  return pollRecursive();
};
