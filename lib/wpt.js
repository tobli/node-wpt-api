'use strict';

const pollForTestCompletion = require('./pollForTestCompletion');
const WptConnection = require('./wptConnection');
const { WptError, TimeoutError } = require('./errors');

const attachmentGetters = {
  har: async (connection, id, run, cached, params) =>
    connection.getHARData(id, params),
  screenshot: async (connection, id, run, cached, params) =>
    connection.getScreenshotImage(id, run, cached, params),
  timeline: async (connection, id, run, cached, params) =>
    connection.getTimelineData(id, params),
  pageSpeed: async (connection, id, run, cached, params) =>
    connection.getPageSpeedData(id, run, cached, params),
  chromeTrace: async (connection, id, run, cached, params) =>
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
  async testUrl(url, { host, key }, attachments = {}, options = {}) {
    const connection = host
      ? WptConnection.toPrivateHost(host, key)
      : WptConnection.toPublicHost(key);

    const { testId } = await connection.runTest(url, options);

    try {
      await pollForTestCompletion(connection, testId);
    } catch (e) {
      if (e instanceof TimeoutError && !options.keepTestAfterTimeout) {
        await connection.cancelTest(testId);
      }
      throw e;
    }

    const testResult = connection.getTestResult(testId);

    const resultRequests = Object.keys(attachments).reduce(
      (requests, attachmentKey) => {
        const attachmentGetter = attachmentGetters[attachmentKey];
        const responseHandler = attachments[attachmentKey];

        const request = attachmentGetter(connection, testId, 1, false, {}).then(
          responseHandler
        );
        return [...requests, request];
      },
      []
    );

    try {
      await Promise.all(resultRequests);
    } catch (e) {
      throw new WptError(
        `Error fetching data for test ${testId}: ${e.message}`
      );
    }
    return testResult;
  }
};
