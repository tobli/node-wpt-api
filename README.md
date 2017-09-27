# Node-wpt – A client for WebPageTest

Work in progress to build a WebPageTest client library with:
- a consistent, Promised based API
- an implementation that's easy to understand and extend
- good logging
- a high level API for common tasks and a low level API for more control

```js
const { wpt } = require('node-wpt');

wpt.testUrl('http://www.sitespeed.io', { key },
    {
      har: stream => saveToFile,
      screenshot: stream => saveToFile
    }
  )
```
High level API: start test, poll for test completion, and stream attachments with custom handlers.

```js
const { builders, WptConnection } = require('node-wpt');

const VideoSpecBuilder = builders.VideoSpecBuilder;

...

const connection = WptConnection.toPublicHost(key);

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
const testResults = connection
  .getTestResult(testId)
  .then(r => console.log(JSON.stringify(r)));

Promise.all([video, testResults]);

```
Low level API: Use a builder to help build the parameters for creating a video. Then streaming video and download HAR for an existing test.


## Design
Node-wpt does not include:
- a cli client for interacting with WebPageTest
- xml support
- support for "server mode", i.e. pingbacks from WPT when tests run. Only polling is implemented

### Test
Node-wpt only has a few manual tests at the moment. Provide your WPT key as an environment variable.

```sh
> WPT_KEY=<your key> node test/wptTest.js
```
