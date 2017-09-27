/* eslint-disable no-console */
'use strict';

process.env.DEBUG = '*';

const wpt = require('../lib/wpt');
const devnull = require('dev-null');
const pipeTo = require('./util').pipeTo;

wpt
  .testUrl(
    'http://www.sitespeed.io',
    { key: process.env.WPT_KEY },
    {
      har: stream => pipeTo(stream, process.stdout),
      screenshot: stream => pipeTo(stream, devnull())
    },
    {
      location: 'London:Chrome',
      breakDown: true,
      domains: true,
      pagespeed: true,
      requests: true
    }
  )
  .then(console.log)
  .catch(console.error);
