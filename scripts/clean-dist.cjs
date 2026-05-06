const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.resolve(root, 'dist');

if (!dist.startsWith(`${root}${path.sep}`)) {
  throw new Error(`Refusing to remove path outside project: ${dist}`);
}

if (!fs.existsSync(dist)) {
  console.log(`No ${path.relative(root, dist)} directory to clean`);
  process.exit(0);
}

for (const entry of fs.readdirSync(dist)) {
  fs.rmSync(path.join(dist, entry), { recursive: true, force: true });
}

console.log(`Cleaned ${path.relative(root, dist)}`);
