const fs = require('fs');
const results = JSON.parse(fs.readFileSync('public/data/results.json', 'utf8'));
const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

const driverPoints = {};
const driverWins = {};
const driverPodiums = {};
const driverTeam = {};

for (let r = 1; r <= 14; r++) {
  const race = results.races[r.toString()];
  if (!race) continue;
  race.results.forEach((res) => {
    const code = res.code;
    const pos = res.pos;
    const team = res.team;
    if (!driverPoints[code]) { driverPoints[code] = 0; driverWins[code] = 0; driverPodiums[code] = 0; driverTeam[code] = team; }
    if (pos <= 10) driverPoints[code] += points[pos - 1];
    if (pos === 1) driverWins[code]++;
    if (pos <= 3) driverPodiums[code]++;
    driverTeam[code] = team;
  });
}

const sorted = Object.entries(driverPoints).sort((a, b) => b[1] - a[1]);
console.log('=== DRIVER STANDINGS (after 14 rounds) ===');
sorted.forEach(([code, pts], i) => {
  console.log(`${i+1}. ${code} (${driverTeam[code]}): ${pts} pts, ${driverWins[code]} wins, ${driverPodiums[code]} podiums`);
});

// Constructor standings
const constructorPoints = {};
const constructorWins = {};
const constructorPodiums = {};
const constructorDrivers = {};

for (let r = 1; r <= 14; r++) {
  const race = results.races[r.toString()];
  if (!race) continue;
  race.results.forEach((res) => {
    const team = res.team;
    const code = res.code;
    const pos = res.pos;
    if (!constructorPoints[team]) { constructorPoints[team] = 0; constructorWins[team] = 0; constructorPodiums[team] = 0; constructorDrivers[team] = new Set(); }
    if (pos <= 10) constructorPoints[team] += points[pos - 1];
    if (pos === 1) constructorWins[team]++;
    if (pos <= 3) constructorPodiums[team]++;
    constructorDrivers[team].add(code);
  });
}

const sortedCon = Object.entries(constructorPoints).sort((a, b) => b[1] - a[1]);
console.log('\n=== CONSTRUCTOR STANDINGS (after 14 rounds) ===');
sortedCon.forEach(([team, pts], i) => {
  console.log(`${i+1}. ${team}: ${pts} pts, ${constructorWins[team]} wins, ${constructorPodiums[team]} podiums, drivers: ${Array.from(constructorDrivers[team]).join(', ')}`);
});