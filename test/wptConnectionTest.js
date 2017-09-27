/* eslint-disable no-console */
'use strict';

process.env.DEBUG = '*';

const fs = require('fs');

const WptConnection = require('../lib/wptConnection');
const VideoSpecBuilder = require('../lib/builders').VideoSpecBuilder;
const pipeTo = require('./util').pipeTo;

const connection = WptConnection.toPublicHost(process.env.WPT_KEY);

connection
  .getTesters()
  .then(() => {
    const testId = '170827_PK_4ddfa1b1d107f436f5be5178ec320147';

    const videoSpec = new VideoSpecBuilder()
      .withTestId(testId)
      .withRun(2)
      .withLabel('foo')
      .build();
    const video = connection
      .createVideo(videoSpec)
      .then(video => video.videoId)
      .then(videoId => connection.getVideo(videoId))
      .then(stream => pipeTo(stream, fs.createWriteStream('/tmp/video.mp4')));
    const har = connection
      .getHARData(testId)
      .then(stream => pipeTo(stream, process.stdout));
    const testResults = connection
      .getTestResult(testId)
      .then(r => console.log(JSON.stringify(r)));

    return Promise.all([video, har, testResults]);
  })
  .catch(e => console.error(e));
