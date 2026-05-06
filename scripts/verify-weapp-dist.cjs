const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(relativePath) {
  assert(fs.existsSync(path.join(root, relativePath)), `${relativePath} is missing`);
}

function assertNotExists(relativePath) {
  assert(!fs.existsSync(path.join(root, relativePath)), `${relativePath} should not exist in a WeChat mini program dist`);
}

assert(fs.existsSync(dist), 'dist directory is missing');

const projectConfig = JSON.parse(read('project.config.json'));
assert(projectConfig.miniprogramRoot === 'dist/', `project.config.json miniprogramRoot must be dist/, got ${projectConfig.miniprogramRoot}`);

assertFile('dist/app.json');
assertFile('dist/app.js');
assertFile('dist/app.wxss');
assertNotExists('dist/index.html');
assertNotExists('dist/js');
assertNotExists('dist/css');
assertNotExists('dist/chunk');

const appConfig = read('src/app.config.ts');
const sourcePages = Array.from(appConfig.matchAll(/'pages\/[a-z-]+\/index'/g)).map((match) => match[0].slice(1, -1));
const distAppConfig = JSON.parse(read('dist/app.json'));

assert(sourcePages.length > 0, 'No source pages found in src/app.config.ts');
assert(
  JSON.stringify(distAppConfig.pages) === JSON.stringify(sourcePages),
  'dist/app.json pages do not match src/app.config.ts',
);

sourcePages.forEach((pagePath) => {
  assertFile(`dist/${pagePath}.json`);
  assertFile(`dist/${pagePath}.js`);
  assertFile(`dist/${pagePath}.wxml`);
  assertFile(`dist/${pagePath}.wxss`);
});

assertFile('dist/custom-tab-bar/index.json');
assertFile('dist/custom-tab-bar/index.js');
assertFile('dist/custom-tab-bar/index.wxml');
assertFile('dist/custom-tab-bar/index.wxss');

console.log(`WeChat mini program dist verified: ${sourcePages.length} pages`);
