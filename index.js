#!/usr/bin/env babel-node

import Promise from 'bluebird';
import { spawn, execSync } from 'child_process';
import Github from 'github';
import R from 'ramda';

const fs = Promise.promisifyAll(require('fs-extra'));
const request = Promise.promisify(require('request'));


function spawnAsync(cmd) {
  const options = {
    env: process.env,
    stdio: 'inherit'
  };

  const parameters = R.filter(R.identity, cmd.replace(/ \\n/g, '').replace('\t', '').split(' '));
  const executable = parameters[0];
  parameters.shift();

  console.log(executable, parameters);

  return new Promise(resolve => {
    const proc = spawn(executable, parameters, options);
    proc.on('close', code => {
      if (code !== 0) process.exit(code);
      resolve();
    });
  });
}

if (!process.env.PHANTOM_VERSION) {
  console.log('Phantom version is missing from env. Exiting...');
  process.exit(1);
}

console.log(`Downloading PhantomJS ${process.env.PHANTOM_VERSION}`);
const download_options = {
  url: `https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-${process.env.PHANTOM_VERSION}-linux-x86_64.tar.bz2`,
  encoding: null
};


function releaseToGithub() {
  const github = new Github({
    version: '3.0.0',
    protocol: 'https',
    timeout: 5000,
    headers: {
      'user-agent': 'Phantomized-Gulp-Release'
    }
  });
  github.authenticate({
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
  });
  const releases = Promise.promisifyAll(github.releases);

  console.log('Uploading release to Github');
  process.chdir('../');
  return releases.createReleaseAsync({
    owner: 'Gravebot',
    repo: 'phantomized',
    tag_name: process.env.PHANTOM_VERSION,
    draft: true,
    name: `Phantomized ${process.env.PHANTOM_VERSION}`
  })
  .then(release => releases.uploadAssetAsync({
    owner: 'Gravebot',
    repo: 'phantomized',
    id: release.id,
    name: 'dockerized-phantomjs.tar.gz',
    filePath: './dockerized-phantomjs.tar.gz'
  }));
}

request(download_options)
  .then(res => fs.writeFileAsync('./phantomjs.tar.bz2', res.body, null))
  .then(() => console.log('Extracting'))
  .then(() => spawnAsync('tar -jxvf phantomjs.tar.bz2'))
  .then(() => fs.copyAsync(`./phantomjs-${process.env.PHANTOM_VERSION}-linux-x86_64/bin/phantomjs`, '/usr/local/bin/phantomjs', {}))
  .then(() => {
    console.log('Running dockerize');
    const cmd = `dockerize -n -o dockerized-phantomjs \
    -e /usr/local/bin/phantomjs \
    -a /bin/dash /bin/sh \
    -a /etc/fonts /etc \
    -a /etc/ssl /etc \
    -a /usr/share/fonts /usr/share \
    --verbose \
    /usr/local/bin/phantomjs \
    /usr/bin/curl`;
    return spawnAsync(cmd);
  })
  .then(() => fs.removeAsync('./dockerized-phantomjs/Dockerfile'))
  .then(() => fs.removeAsync('./dockerized-phantomjs/usr/local/bin/phantomjs'))
  .then(() => {
    console.log('Taring archive');
    process.chdir('./dockerized-phantomjs');
    return execSync('tar -zcf ../dockerized-phantomjs.tar.gz ./lib ./lib64 ./usr/lib');
  })
  .then(() => {
    if (process.env.GITHUB_TOKEN) return releaseToGithub();
  })
  .then(() => console.log('Done'))
  .catch(err => {
    console.log(err.stack || err);
    process.exit(1);
  });
