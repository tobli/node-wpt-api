'use strict';

const { TimeoutError } = require('./errors');
const { name } = require('../package.json');
const debug = require('debug')(name);

const delay = time => new Promise(resolve => setTimeout(() => resolve(), time));

module.exports = async function pollForTestCompletion(
  connection,
  testId,
  pollIntervalSeconds = 5,
  maxWaitSeconds = 180
) {
  // FIXME max queue time vs max execution time??

  const maxTime = Date.now() + maxWaitSeconds * 1000;

  do {
    await delay(pollIntervalSeconds * 1000);
    const { statusCode, statusText } = await connection.getTestStatus(testId);
    if (statusCode === 200) {
      return testId;
    }
    debug(statusText);
  } while (Date.now() < maxTime);

  throw new TimeoutError(
    `Failed to get test result within ${maxWaitSeconds} seconds.`
  );
};
