'use strict';

const pipeTo = (source, destination) =>
  new Promise((resolve, reject) => {
    source.on('end', resolve).on('error', reject);

    source.pipe(destination);
  });

module.exports = { pipeTo };
