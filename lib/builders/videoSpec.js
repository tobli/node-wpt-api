'use strict';

const assign = Object.assign;

// Pattern based on https://gist.github.com/Golodhros/597bca34394ea855bc9b

/*
$test['id'] = $parts[0];
$test['cached'] = 0;
$test['end'] = $endTime;
$test['extend'] = false;
$test['syncStartRender'] = "";
$test['syncDocTime'] = "";
$test['syncFullyLoaded'] = "";
*/

module.exports = function VideoSpecBuilder(config = {}) {
  this._config = assign({}, config);

  this.withTestId = function(id) {
    return new VideoSpecBuilder(assign(this._config, { id }));
  };

  this.withRun = function(run) {
    return new VideoSpecBuilder(assign(this._config, { r: run }));
  };

  this.withLabel = function(label) {
    return new VideoSpecBuilder(assign(this._config, { l: label }));
  };

  this.withStartSeconds = function(startSeconds) {
    return new VideoSpecBuilder(assign(this._config, { i: startSeconds }));
  };

  this.withEndSeconds = function(endSeconds) {
    return new VideoSpecBuilder(assign(this._config, { e: endSeconds }));
  };

  this.build = function() {
    /*
        $p = explode(':', $parts[$i]);
        if( count($p) >= 2 )
        {
          if( $p[0] == 'r' )
            $test['run'] = (int)$p[1];
          if( $p[0] == 'l' )
            $test['label'] = preg_replace('/[^a-zA-Z0-9 \-_]/', '', $p[1]);
          if( $p[0] == 'c' )
            $test['cached'] = (int)$p[1];
          if( $p[0] == 'e' )
            $test['end'] = trim($p[1]);
          if( $p[0] == 'i' )
            $test['initial'] = intval(trim($p[1]) * 1000.0);
          // Optional Extra info to sync the video with
          if( $p[0] == 's' )
            $test['syncStartRender'] = (int)$p[1];
          if( $p[0] == 'd' )
            $test['syncDocTime'] = (int)$p[1];
          if( $p[0] == 'f' )
            $test['syncFullyLoaded'] = (int)$p[1];
    */

    const params = assign({}, this._config);

    const id = params.id;
    delete params.id;

    return Object.keys(params)
      .reduce((testParts, key) => testParts.concat(`${key}:${params[key]}`), [
        id
      ])
      .join('-');
  };
};
