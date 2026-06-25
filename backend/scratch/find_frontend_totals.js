const fs = require('fs');
const content = fs.readFileSync('../frontend/src/pages/CafeSalesReport.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('tfoot') || line.toLowerCase().includes('grand total') || line.toLowerCase().includes('total-row')) {
    console.log(`Line ${idx - 1}: ${lines[idx-2]}`);
    console.log(`Line ${idx}: ${lines[idx-1]}`);
    console.log(`Line ${idx + 1}: ${line}`);
    console.log(`Line ${idx + 2}: ${lines[idx+1]}`);
    console.log(`Line ${idx + 3}: ${lines[idx+2]}`);
    console.log("------------------------");
  }
});
process.exit(0);
