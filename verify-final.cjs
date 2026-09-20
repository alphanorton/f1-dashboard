const fs = require('fs');
const r = JSON.parse(fs.readFileSync('public/data/results.json', 'utf8'));

const verificationTable = [
  {round: 1, name: "Australia", winner: "George Russell", dnf: 4, dns: 2},
  {round: 2, name: "China", winner: "Kimi Antonelli", dnf: 3, dns: 4},
  {round: 3, name: "Japan", winner: "Kimi Antonelli", dnf: 2, dns: 0},
  {round: 4, name: "Miami", winner: "Kimi Antonelli", dnf: 4, dns: 0},
  {round: 5, name: "Canada", winner: "Kimi Antonelli", dnf: 5, dns: 1},
  {round: 6, name: "Monaco", winner: "Kimi Antonelli", dnf: 7, dns: 0},
  {round: 7, name: "Barcelona", winner: "Lewis Hamilton", dnf: 8, dns: 0},
  {round: 8, name: "Austria", winner: "George Russell", dnf: 4, dns: 0},
  {round: 9, name: "Great Britain", winner: "Charles Leclerc", dnf: 3, dns: 0},
  {round: 10, name: "Belgium", winner: "Kimi Antonelli", dnf: 3, dns: 0},
  {round: 11, name: "Hungary", winner: "Lando Norris", dnf: 3, dns: 0},
  {round: 12, name: "Netherlands", winner: "Lando Norris", dnf: 6, dns: 0},
  {round: 13, name: "Italy", winner: "Kimi Antonelli", dnf: 3, dns: 0},
  {round: 14, name: "Spain", winner: "Kimi Antonelli", dnf: 4, dns: 0}
];

console.log("=== FINAL VERIFICATION (diacritic-insensitive) ===\n");

let allPass = true;
for (const exp of verificationTable) {
  const race = r.races[exp.round.toString()];
  if (!race) {
    console.log(`Round ${exp.round}: MISSING`);
    allPass = false;
    continue;
  }
  
  const actualWinner = race.results.find(d => d.pos === 1)?.driver;
  const actualDNF = race.results.filter(d => d.status === "DNF").length;
  const actualDNS = race.results.filter(d => d.status === "DNS").length;
  const driverCount = race.results.length;
  
  const winnerMatch = actualWinner.replace(/[é]/g, 'e') === exp.winner.replace(/[é]/g, 'e');
  const dnfMatch = actualDNF === exp.dnf;
  const dnsMatch = actualDNS === exp.dns;
  const countMatch = driverCount === 22;
  
  const pass = winnerMatch && dnfMatch && dnsMatch && countMatch;
  
  if (!pass) allPass = false;
  
  const status = pass ? "✅" : "❌";
  console.log(`${status} R${exp.round} ${exp.name}: Winner="${actualWinner}" (exp: ${exp.winner}) | DNF=${actualDNF}/${exp.dnf} DNS=${actualDNS}/${exp.dns} | Drivers=${driverCount}/22`);
}

console.log(allPass ? "\n✅ ALL 14 ROUNDS VERIFIED CORRECT" : "\n❌ SOME MISMATCHES FOUND");