const fs = require('fs');
const path = require('path');

const doctorPath = path.resolve(__dirname, '../node_modules/@tarojs/plugin-doctor/index.js');

if (!fs.existsSync(doctorPath)) {
  console.log('taro-doctor patch skipped: package not installed');
  process.exit(0);
}

let source = fs.readFileSync(doctorPath, 'utf8');

if (source.includes('taro-doctor Windows glob patch')) {
  console.log('taro-doctor patch already applied');
  process.exit(0);
}

if (!source.includes('const fs = require("fs");')) {
  source = source.replace(
    'const path = require("path");',
    'const path = require("path");\nconst fs = require("fs");',
  );
}

source = source
  .replace(
    "        const globPattern = glob.sync(path.join(appPath, '.eslintrc*'));",
    "        const globPattern = ['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml']\n            .map((configFile) => path.join(appPath, configFile))\n            .filter((configFile) => fs.existsSync(configFile));",
  )
  .replace(
    "        const legacyConfigPattern = glob.sync(path.join(appPath, '.eslintrc*'));\n        const flatConfigPattern = glob.sync(path.join(appPath, 'eslint.config.{js,cjs,mjs}'));",
    "        const legacyConfigPattern = ['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml']\n            .map((configFile) => path.join(appPath, configFile))\n            .filter((configFile) => fs.existsSync(configFile));\n        const flatConfigPattern = ['eslint.config.js', 'eslint.config.cjs', 'eslint.config.mjs']\n            .map((configFile) => path.join(appPath, configFile))\n            .filter((configFile) => fs.existsSync(configFile));",
  )
  .replace(
    "        const sourceFiles = path.join(process.cwd(), projectConfig.sourceRoot, '**/*.{js,ts,jsx,tsx}');\n        const report = yield eslintCli.lintFiles([sourceFiles]);",
    "        // taro-doctor Windows glob patch: avoid absolute brace globs that ESLint cannot expand on Windows.\n        const sourceGlob = `${projectConfig.sourceRoot.replace(/\\\\/g, '/')}/**/*.{js,ts,jsx,tsx}`;\n        const sourceFiles = glob.sync(sourceGlob, { cwd: process.cwd(), absolute: true, nodir: true });\n        const report = yield eslintCli.lintFiles(sourceFiles);",
  )
  .replace(
    "        const sourceFiles = path.join(cwd, projectConfig.sourceRoot, '**/*.{js,ts,jsx,tsx}');\n        const report = yield eslintCli.lintFiles([sourceFiles]);",
    "        // taro-doctor Windows glob patch: avoid absolute brace globs that ESLint cannot expand on Windows.\n        const sourceGlob = `${projectConfig.sourceRoot.replace(/\\\\/g, '/')}/**/*.{js,ts,jsx,tsx}`;\n        const sourceFiles = glob.sync(sourceGlob, { cwd, absolute: true, nodir: true });\n        const report = yield eslintCli.lintFiles(sourceFiles);",
  );

if (!source.includes('taro-doctor Windows glob patch')) {
  throw new Error('Failed to patch taro doctor: target text not found');
}

fs.writeFileSync(doctorPath, source);
console.log('taro-doctor patch applied');
