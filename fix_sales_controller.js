const fs=require('fs');
const p='backend/src/controllers/salesController.js';
let s=fs.readFileSync(p,'utf8');
function rep(rx,repl){const before=s; s=s.replace(rx,repl); if(before!==s) console.log('changed',rx.toString());}
// Insert normalization block after filteredData definition if present
if(s.match(/const\s+filteredData\s*=.*?;/s) && !s.includes('// normalize-start')){
  s=s.replace(/(const\s+filteredData\s*=.*?;)/s, $1\n  // normalize-start\n  filteredData.forEach(order => {\n    order.items = (order.items || []).map(it => {\n      const price = Number(it.price ?? it.unit_price) || 0;\n      const qty = Number(it.quantity) || 0;\n      return {\n        name: it.name ?? it.product_name ?? 'Unknown',\n        price,\n        quantity: qty,\n        total: Number(it.total ?? it.total_price ?? (price * qty)) || 0\n      };\n    });\n  });\n  // normalize-end\n);
  console.log('inserted normalization block');
}
// Replace currency string issues and unsafe toFixed
rep(/[^]*\$\{item\.totalRevenue\.toFixed\(2\)\}/g,'');
rep(/[^]*\$\{item\.averagePrice\.toFixed\(2\)\}/g,'');
rep(/summaryWorksheet\.addRow\(\['Total Revenue', [^\]]*\]\);/,'summaryWorksheet.addRow(["Total Revenue", Number(totalRevenue) || 0]);');
rep(/summaryWorksheet\.addRow\(\['Average Order Value', [^\]]*\]\);/,'summaryWorksheet.addRow(["Average Order Value", Number(averageOrderValue) || 0]);');
rep(/sum \+ order\.total/g,'sum + (Number(order.total) || 0)');
rep(/total: [^]*\$\{totalRevenue\.toFixed\(2\)\}/,'total: Number(totalRevenue) || 0');
fs.writeFileSync(p,s);
console.log('done');
