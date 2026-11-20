const fs = require('fs');

async function printX() {
  const url = 'https://www.thepunditsofficial.in/_next/static/chunks/148jy80w5na3v.js';
  const res = await fetch(url);
  const js = await res.text();

  const idx = js.indexOf('"startApiExam",0,x');
  if (idx !== -1) {
    const chunk = js.substring(Math.max(0, idx - 2500), idx + 200);
    fs.writeFileSync('/scripts/x_output.txt', chunk);
    console.log('Successfully wrote output to /scripts/x_output.txt');
  }
}

printX().catch(console.error);
