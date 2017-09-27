'use strict';

const { WptError } = require('./errors');

const got = require('got');
const cq = require('concurrent-queue');
const urlParser = require('url');
const { name, version, homepage } = require('../package.json');
const debug = require('debug')(name);

const assign = Object.assign;

const DEFAULT_REQUEST_OPTIONS = {
  headers: {
    'user-agent': `${name}${version} (${homepage})`
  }
};

// From https://github.com/ORBAT/promise-pauser/blob/master/index.js
function defer() {
  let resolver;
  const promise = new Promise(resolve => {
    resolver = resolve;
  });
  return { resolver, promise };
}

const toWptFileName = function(basename, run = 1, cached = false) {
  const prefix = cached ? '_Cached' : '';
  const name = basename.startsWith('.') ? basename : `_${basename}`;

  return `${run}${prefix}${name}`;
};

class WptConnection {
  static toPublicHost(key, options) {
    return new WptConnection(
      assign({ host: 'https://www.webpagetest.org', key }, options)
    );
  }

  static toPrivateHost(host, key, options) {
    return new WptConnection(assign({ host, key }, options));
  }

  constructor({ host, key, concurrency = 4 }) {
    this.host = host;
    this.key = key;

    this.queue = cq()
      .limit({ concurrency })
      .process(({ resolver, promise }) => {
        resolver();
        return promise;
      });
    this.queue.enqueued(({ item }) => {
      debug(`enqueued url: ${item.url}`);
    });
    this.queue.processingStarted(({ item }) => {
      debug(`processingStarted url: ${item.url}`);
    });
    this.queue.processingEnded(({ item }) => {
      debug(`processingEnded url: ${item.url}`);
    });
  }

  getTestStatus(id) {
    return this._enqueueJson('/testStatus.php', { test: id });
  }

  getTestResult(id, params) {
    return this._enqueueJson('/jsonResult.php', assign({ test: id }, params));
  }

  getLocations() {
    return this._enqueueJson('/getLocations.php');
  }

  getTesters() {
    return this._enqueueJson('/getTesters.php');
  }

  runTest(url, params) {
    return this._enqueueJson(
      '/runtest.php',
      { url, k: this.key },
      { body: params }
    );
  }

  cancelTest(id) {
    return this._enqueueHtml('/cancelTest.php', {
      test: id,
      k: this.key
    });
  }

  getHARData(id, params) {
    return this._enqueueStream('/export.php', assign({ test: id }, params));
  }

  getPageSpeedData(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('pagespeed.txt', run, cached)
        },
        params
      )
    );
  }

  getMp4Video(id) {
    return this._enqueueStream('/download.php', { test: id });
  }

  getUtilizationData() {
    throw new Error('utilizationData is not yet supported');
  }

  getRequestData() {
    throw new Error('requestData is not yet supported');
  }

  getTimelineData(id, run, params) {
    return this._enqueueStream(
      '/getTimeline.php',
      assign({ test: id, run }, params)
    );
  }

  getTLSKeyLog(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('keylog.log', run, cached)
        },
        params
      )
    );
  }

  getTcpDump(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('.cap', run, cached)
        },
        params
      )
    );
  }

  getNetLogData(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('netlog.json', run, cached)
        },
        params
      )
    );
  }

  getChromeTraceData(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('trace.json', run, cached)
        },
        params
      )
    );
  }

  getConsoleLogData(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('console_log.json', run, cached)
        },
        params
      )
    );
  }

  getTestInfo(id, run, cached, params) {
    return this._enqueueStream(
      '/getgzip.php',
      assign(
        {
          test: id,
          file: toWptFileName('testinfo.json', run, cached)
        },
        params
      )
    );
  }

  // getHistory(days = 1, params) {
  //   return this._csvRequest('/testlog.php', assign({days}, params));
  // }

  getGoogleCsiData(id, params) {
    return this._enqueueJson(
      '/google/google_csi.php',
      assign({ test: id }, params)
    );
  }

  getResponseBody(id, params) {
    return this._enqueueStream(
      '/response_body.php',
      assign({ test: id }, params)
    );
  }

  // Add image params builder (to set cpu, bw, etc.) and add a params arg at the end

  getWaterfallImage(id, run, cached) {
    return this._enqueueStream('/waterfall.php', {
      test: id,
      run,
      cached
    });
  }

  getConnectionImage(id, run, cached) {
    return this._enqueueStream('/waterfall.php', {
      test: id,
      type: 'connection',
      run,
      cached
    });
  }

  /*
   *   waterfall: 'waterfall.png',
   *   screenshot: 'screen.jpg',
   *   screenshotStartRender: 'screen_render.jpg',
   *   screenshotDocumentComplete: 'screen_doc.jpg',
   *   screenshotFullResolution: 'screen.png',
   */
  getScreenshotImage(id, params) {
    return this._enqueueStream(
      '/screen_shot.php',
      assign({ test: id }, params)
    );
  }

  createVideo(tests, params) {
    if (Array.isArray(tests)) {
      tests = tests.join(',');
    }
    return this._enqueueJson('/video/create.php', assign({ tests }, params));
  }

  getVideo(id, params) {
    return this._enqueueStream('/video/download.php', assign({ id }, params));
  }

  getEmbedVideoPlayer(id, params) {
    return this._enqueueJson('/video/view.php', assign({ id }, params));
  }

  _enqueueHtml(path, params = {}, options = {}) {
    const url = this._createUrl(path, params);

    let { resolver, promise } = defer();
    promise = promise.then(() => WptConnection._html(url, options));
    return this.queue({ url, resolver, promise });
  }

  _enqueueJson(path, params = {}, options = {}) {
    const url = this._createUrl(path, assign({ f: 'json' }, params));

    let { resolver, promise } = defer();
    promise = promise.then(() => WptConnection._json(url, options));
    return this.queue({ url, resolver, promise });
  }

  _enqueueStream(path, params = {}, options = {}) {
    const url = this._createUrl(path, params);

    let { resolver, promise } = defer();
    promise = promise.then(() => WptConnection._stream(url, options));
    return this.queue({ url, resolver, promise });
  }

  static _html(url, options = {}) {
    options = assign({}, DEFAULT_REQUEST_OPTIONS, options);

    debug(`Requesting html from ${url}`);

    return got(url, options).then(response => response.body);
  }

  static _json(url, options = {}) {
    const is4xx = status => status >= 400 && status <= 499;

    options = assign({ json: true }, DEFAULT_REQUEST_OPTIONS, options);

    debug(`Requesting json from ${url}`);

    return got(url, options).then(response => {
      const body = response.body;
      if (is4xx(body.statusCode)) {
        throw new WptError(body.statusText, { url });
      }
      return body.data;
    });
  }

  static _stream(url, options = {}) {
    options = assign({}, DEFAULT_REQUEST_OPTIONS, options);

    debug(`Requesting stream from ${url}`);

    return got.stream(url, options);
  }

  _createUrl(path, queryParams = {}) {
    function removeUndefinedValues(input) {
      return Object.keys(input).reduce((result, key) => {
        if (input[key] !== undefined) {
          result[key] = input[key];
        }
        return result;
      }, {});
    }

    const url = urlParser.parse(this.host, true);
    url.pathname = path;
    url.query = removeUndefinedValues(queryParams);

    return urlParser.format(url);
  }
}

module.exports = WptConnection;
