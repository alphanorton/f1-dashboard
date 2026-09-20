const fs = require('fs');
const cal = JSON.parse(fs.readFileSync('public/data/calendar.json', 'utf8'));
const res = JSON.parse(fs.readFileSync('public/data/results.json', 'utf8'));

console.log("=== ROUND NUMBER MATCH CHECK ===\n");

const calCompleted = cal.races.filter(r => r.status === 'completed');
const resRounds = Object.keys(res.races).map(Number).sort((a,b) => a-b);

console.log(`Calendar completed rounds: ${calCompleted.map(r => r.round).join(', ')}`);
console.log(`Results rounds: ${resRounds.join(', ')}\n`);

for (const race of calCompleted) {
  const roundNum = race.round;
  const hasResult = res.races[String(roundNum)] !== undefined;
  const status = hasResult ? '✅' : '❌';
  console.log(`${status} R${roundNum} ${race.name}: ${hasResult ? 'FOUND' : 'MISSING IN RESULTS!'}`);
}

console.log(`\nTotal calendar completed: ${calCompleted.length}`);
console.log(`Total results: ${resRounds.length}`);

// Check round name match
console.log("\n=== ROUND NAME MATCH CHECK ===\n");
for (const race of calCompleted) {
  const result = res.races[String(race.round)];
  if (result) {
    const nameMatch = result.name === race.name;
    const winner = result.results[0]?.driver;
    console.log(`${nameMatch ? '✅' : '❌'} R${race.round}: cal="${race.name}" res="${result.name}" winner=${winner}`);
  }
}
