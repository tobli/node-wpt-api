'use strict';

const assign = Object.assign;

// Pattern based on https://gist.github.com/Golodhros/597bca34394ea855bc9b

// Include params from
// https://sites.google.com/a/webpagetest.org/docs/advanced-features/webpagetest-restful-apis#TOC-Getting-test-results
/*
 Parameter	Required	Description	Default
 url	required	URL to be tested
 label	 optional	 Label for the test
 location	optional	Location to test from	Dulles 5Mbps Cable
 runs	optional	Number of test runs (1-10 on the public instance)	1
 fvonly	optional	Set to 1 to skip the Repeat View test	0
 domelement	optional	DOM Element to record for sub-measurement
 private	optional	Set to 1 to keep the test hidden from the test log	0
 connections	optional	Override the number of concurrent connections IE uses (0 to not override)	0
 web10	optional	Set to 1 to force the test to stop at Document Complete (onLoad)	0
 script	optional	Scripted test to execute
 block	optional	space-delimited list of urls to block (substring match)
 login	optional	User name to use for authenticated tests (http authentication)
 password	optional	Password to use for authenticated tests (http authentication)
 authType	optional	Type of authentication to use: 0 = Basic Auth, 1 = SNS	0
 video	optional	Set to 1 to capture video (video is required for calculating Speed Index)	0
 f	optional	Format. Set to "xml" to request an XML response instead of a redirect or "json" for JSON-encoded response
 r	optional	When using the xml interface, will echo back in the response
 notify	optional	e-mail address to notify with the test results
 pingback	optional	URL to ping when the test is complete (the test ID will be passed as an "id" parameter)
 bwDown	optional	Download bandwidth in Kbps (used when specifying a custom connectivity profile)
 bwUp	optional	Upload bandwidth in Kbps (used when specifying a custom connectivity profile)
 latency	optional	First-hop Round Trip Time in ms (used when specifying a custom connectivity profile)
 plr	optional	Packet loss rate - percent of packets to drop (used when specifying a custom connectivity profile)
 k	optional	(required for public instance)	API Key (if assigned) - applies only to runtest.php calls. Contact the site owner for a key if required (http://www.webpagetest.org/getkey.php for the public instance)
 tcpdump	 optional	 Set to 1 to enable tcpdump capture	 0
 noopt	optional	Set to 1 to disable optimization checks (for faster testing)	0
 noimages	optional	Set to 1 to disable screen shot capturing	0
 noheaders	optional	Set to 1 to disable saving of the http headers (as well as browser status messages and CPU utilization)	0
 pngss	 optional	 Set to 1 to save a full-resolution version of the fully loaded screen shot as a png
 iq	 optional	 Specify a jpeg compression level (30-100) for the screen shots and video capture
 noscript	 optional	 Set to 1 to disable javascript (IE, Chrome, Firefox)
 clearcerts	 optional	 Set to 1 to clear the OS certificate caches (causes IE to do OCSP/CRL checks during SSL negotiation if the certificates are not already cached). Added in 2.11	 0
 mobile	 optional	 Set to 1 to have Chrome emulate a mobile browser (screen resolution, UA string, fixed viewport).  Added in 2.11	 0
 keepua	 optional	 Set to 1 to preserve the original browser User Agent string (don't append PTST to it)
 uastring	 optional	 Custom User Agent String to use
 width	 optional	 Viewport Width in css pixels
 height	 optional	 Viewport Height in css pixels
 browser_width	 optional	 Browser window width (in display pixels)
 browser_height	 optional	 Browser window height (in display pixels)
 dpr	 optional	 Device Pixel Ratio to use when emulating mobile
 mv	 optional	 Set to 1 when capturing video to only store the video from the median run.	 0
 medianMetric	 optional	 Default metric to use when calculating the median run	 loadTime
 cmdline	 optional	 Custom command-line options (Chrome only)
 htmlbody	 optional	Set to 1 to save the content of the first response (base page) instead of all of the text responses (bodies=1)
 tsview_id	 optional	 Test name to use when submitting results to tsviewdb (for private instances that have integrated with tsviewdb)
 custom	 optional	 Custom metrics to collect at the end of a test
 tester	 optional	Specify a specific tester that the test should run on (must match the PC name in /getTesters.php).  If the tester is not available the job will never run.
 affinity	 optional	Specify a string that will be used to hash the test to a specific test agent.  The tester will be picked by index among the available testers.  If the number of testers changes then the tests will be distributed to different machines but if the counts remain consistent then the same string will always run the tests on the same test machine.  This can be useful for controlling variability when comparing a given URL over time or different parameters against each other (using the URL as the hash string).
 timeline	 optional	 Set to 1 to have Chrome capture the Dev Tools timeline	 0
 timelineStack	 optional	 Set to between 1 - 5 to have Chrome include the Javascript call stack. Must be used in conjunction with "timeline". 	 0
 ignoreSSL	 optional	 Set to 1 to Ignore SSL Certificate Errors e.g. Name mismatch, Self-signed certificates, etc.	 0
 mobileDevice	 optional	 Device name from mobile_devices.ini to use for mobile emulation (only when mobile=1 is specified to enable emulation and only for Chrome)
 appendua	 optional	 String to append to the user agent string. This is in addition to the default PTST/ver string. If "keepua" is also specified it will still append. Allows for substitution with some test parameters:
  %TESTID% - Replaces with the test ID for the current test
  %RUN% - Replaces with the current run number
  %CACHED% - Replaces with 1 for repeat view tests and 0 for initial view
  %VERSION% - Replaces with the current wptdriver version number
 */

module.exports = function TestParamsBuilder(config = {}) {
  this._config = assign({}, config);

  this.withLocation = location =>
    new TestParamsBuilder(assign(this._config, { location }));

  this.withLabel = label =>
    new TestParamsBuilder(assign(this._config, { label }));

  this.withoutRepeatView = () =>
    new TestParamsBuilder(assign(this._config, { fvonly: 1 }));

  this.withVideoCapture = () =>
    new TestParamsBuilder(assign(this._config, { video: 1 }));

  this.withUserAgent = uastring =>
    new TestParamsBuilder(assign(this._config, { uastring }));

  this.build = () => assign({}, this._config);
};
