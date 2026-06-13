const fs = require('fs');
const file = 'src/pages/AmazonsChoice.jsx';
let c = fs.readFileSync(file, 'utf8');

// Line 1491 contains the broken shopping cart emoji
// Replace any sequence of high bytes on that line with a clean icon
const linesBefore = c.split('\n');
console.log('Line 1491:', JSON.stringify(linesBefore[1490]));

// Replace high-byte sequences on lines that only contain whitespace + high bytes + \r
const lines = c.split('\n').map((line, i) => {
  // Strip \r for testing
  const stripped = line.replace('\r', '');
  if (/^\s+[\x80-\xff][\x80-\xff]+\s*$/.test(stripped)) {
    console.log(`Fixing line ${i+1}: ${JSON.stringify(line)}`);
    return stripped.replace(/[\x80-\xff]+/, '🛒').replace(/\s+$/, '');
  }
  return line;
});

c = lines.join('\n');
fs.writeFileSync(file, c, 'utf8');
console.log('Done');
