import fs from 'fs';
import path from 'path';

const COMPONENT_DIR = 'd:/Code Builds/Roblox-Tracker/src/components';
const EXTENSIONS = ['.tsx'];

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file));
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = findFiles(COMPONENT_DIR);

const patchString = `type="number"\n                min="0"\n                onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}`;
const inlinePatchString = `type="number" min="0" onKeyDown={(e) => { if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault(); }}`;

let updatedCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('type="number"')) {
    // Attempt to handle both multiline indentations and inline declarations safely
    const updated = content
      .replace(/type="number"/g, inlinePatchString);
    fs.writeFileSync(file, updated);
    console.log(`Updated: ${file}`);
    updatedCount++;
  }
}

console.log(`Total files patched: ${updatedCount}`);
