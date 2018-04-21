'use strict';

async function pipeTo(source, destination) {
  return new Promise((resolve, reject) => {
    source.on('end', resolve).on('error', reject);

    source.pipe(destination);
  });
}

module.exports = { pipeTo };
