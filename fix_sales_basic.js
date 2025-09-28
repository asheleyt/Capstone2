const fs=require('fs');
const p='backend/src/controllers/salesController.js';
let s=fs.readFileSync(p,'utf8');
function rep(rx,repl){const before=s; s=s.replace(rx,repl); if(before!==s) console.log('changed',rx.toString());}
// Replace currency string issues and unsafe toFixed
rep(/[^]*\$\{item\.totalRevenue\.toFixed\(2\)\}/g,'');
rep(/[^]*\$\{item\.averagePrice\.toFixed\(2\)\}/g,'');
rep(/summaryWorksheet\.addRow\(\['Total Revenue', [^\]]*\]\);/,'summaryWorksheet.addRow([\"Total Revenue\", Number(totalRevenue) || 0]);');
rep(/summaryWorksheet\.addRow\(\['Average Order Value', [^\]]*\]\);/,'summaryWorksheet.addRow([\"Average Order Value\", Number(averageOrderValue) || 0]);');
rep(/sum \+ order\.total/g,'sum + (Number(order.total) || 0)');
rep(/total: [^]*\$\{totalRevenue\.toFixed\(2\)\}/,'total: Number(totalRevenue) || 0');
fs.writeFileSync(p,s);
console.log('done');
