const fs = require('fs');
const path = require('path');

const bankPath = path.join(__dirname, '../data/puzzles/bank.json');
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

// Fisher-Yates shuffle
for (let i = bank.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [bank[i], bank[j]] = [bank[j], bank[i]];
}

// Reassign IDs and sequential dates starting from today
const startDate = new Date();
for (let i = 0; i < bank.length; i++) {
  const d = new Date(startDate);
  d.setDate(startDate.getDate() + i);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  bank[i].id = `dimer-${i + 1}`;
  bank[i].date = dateStr;
}

fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2), 'utf8');
console.log('Shuffled ' + bank.length + ' puzzles and reassigned dates.');
