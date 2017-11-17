'use strict';

const pollForTestCompletion = require('./pollForTestCompletion');
const WptConnection = require('./wptConnection');
const { WptError, TimeoutError } = require('./errors');
const Promise = require('bluebird');

const attachmentGetters = {
  har: (connection, id, run, cached, params) =>
    connection.getHARData(id, params),
  screenshot: (connection, id, run, cached, params) =>
    connection.getScreenshotImage(id, run, cached, params),
  timeline: (connection, id, run, cached, params) =>
    connection.getTimelineData(id, params),
  pageSpeed: (connection, id, run, cached, params) =>
    connection.getPageSpeedData(id, run, cached, params),
  chromeTrace: (connection, id, run, cached, params) =>
    connection.getChromeTraceData(id, run, cached, params)
};

module.exports = {
  /**
   *
   * @param url
   * @param host
   * @param key
   * @param attachments mapping of attachment ids to stream handlers
   * @param options
   */
  testUrl(url, { host, key }, attachments = {}, options = {}) {
    const connection = host
      ? WptConnection.toPrivateHost(host, key)
      : WptConnection.toPublicHost(key);

    return Promise.resolve(connection.runTest(url, options))
      .then(data => data.testId)
      .tap(id => {
        let testCompletion = pollForTestCompletion(connection, id);

        if (!options.keepTestAfterTimeout) {
          testCompletion = testCompletion.catch(TimeoutError, e =>
            connection.cancelTest(id).then(() => {
              throw e;
            })
          );
        }

        return testCompletion;
      })
      .then(id => {
        const testResult = connection.getTestResult(id);

        const resultRequests = Object.keys(
          attachments
        ).reduce((requests, attachmentKey) => {
          const attachmentGetter = attachmentGetters[attachmentKey];
          const responseHandler = attachments[attachmentKey];

          const request = attachmentGetter(connection, id, 1, false, {}).then(
            responseHandler
          );
          return [...requests, request];
        }, []);
        return Promise.all(resultRequests)
          .return(testResult)
          .catch(e => {
            throw new WptError(
              `Error fetching data for test ${id}: ${e.message}`
            );
          });
      });
  }
};
