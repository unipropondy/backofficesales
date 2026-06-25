const fs = require('fs');
const content = fs.readFileSync('routes/salesreportRoutes.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('TopNItems')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
process.exit(0);
