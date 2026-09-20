const fs = require('fs');
const results = JSON.parse(fs.readFileSync('public/data/results.json', 'utf8'));

// Expected data from prompt - key fields to verify
const expected = {
  1: {
    winner: "George Russell",
    dnf: ["Lance Stroll", "Fernando Alonso", "Valtteri Bottas", "Isack Hadjar"],
    dns: ["Oscar Piastri", "Nico Hülkenberg"]
  },
  2: {
    winner: "Kimi Antonelli",
    dnf: ["Max Verstappen", "Fernando Alonso", "Lance Stroll"],
    dns: ["Oscar Piastri", "Lando Norris", "Gabriel Bortoleto", "Alexander Albon"]
  },
  3: {
    winner: "Kimi Antonelli",
    dnf: ["Lance Stroll", "Oliver Bearman"],
    dns: []
  },
  4: {
    winner: "Kimi Antonelli",
    dnf: ["Nico Hülkenberg", "Liam Lawson", "Pierre Gasly", "Isack Hadjar"],
    dns: []
  },
  5: {
    winner: "Kimi Antonelli",
    dnf: ["Sergio Pérez", "Lando Norris", "George Russell", "Fernando Alonso", "Alexander Albon"],
    dns: ["Arvid Lindblad"]
  },
  6: {
    winner: "Kimi Antonelli",
    dnf: ["Carlos Sainz", "Charles Leclerc", "Lance Stroll", "Lando Norris", "Oliver Bearman", "Valtteri Bottas", "Max Verstappen"],
    dns: []
  },
  7: {
    winner: "Lewis Hamilton",
    dnf: ["Charles Leclerc", "Kimi Antonelli", "Oliver Bearman", "Alexander Albon", "Fernando Alonso", "Nico Hülkenberg", "Valtteri Bottas", "Lance Stroll"],
    dns: []
  },
  8: {
    winner: "George Russell",
    dnf: ["Lance Stroll", "Carlos Sainz", "Sergio Pérez", "Valtteri Bottas"],
    dns: []
  },
  9: {
    winner: "Charles Leclerc",
    dnf: ["Max Verstappen", "Alexander Albon", "Nico Hülkenberg"],
    dns: []
  },
  10: {
    winner: "Kimi Antonelli",
    dnf: ["Lance Stroll", "Sergio Pérez", "George Russell"],
    dns: []
  },
  11: {
    winner: "Lando Norris",
    dnf: ["Oscar Piastri", "Sergio Pérez", "Valtteri Bottas"],
    dns: []
  },
  12: {
    winner: "Lando Norris",
    dnf: ["Alexander Albon", "Valtteri Bottas", "Esteban Ocon", "Lance Stroll", "Oliver Bearman", "Max Verstappen"],
    dns: []
  },
  13: {
    winner: "Kimi Antonelli",
    dnf: ["Lance Stroll", "Fernando Alonso", "Charles Leclerc"],
    dns: []
  },
  14: {
    winner: "Kimi Antonelli",
    dnf: ["Carlos Sainz", "Sergio Pérez", "Lance Stroll", "Lewis Hamilton"],
    dns: []
  }
};

console.log("=== VERIFICATION REPORT ===\n");

for (let r = 1; r <= 14; r++) {
  const race = results.races[r.toString()];
  const exp = expected[r];
  
  if (!race) {
    console.log(`Round ${r}: MISSING!`);
    continue;
  }
  
  const actualWinner = race.results.find(d => d.pos === 1)?.driver;
  const actualDNF = race.results.filter(d => d.status === "DNF").map(d => d.driver);
  const actualDNS = race.results.filter(d => d.status === "DNS").map(d => d.driver);
  
  let ok = true;
  const issues = [];
  
  if (actualWinner !== exp.winner) {
    ok = false;
    issues.push(`Winner: expected "${exp.winner}", got "${actualWinner}"`);
  }
  
  const expDNFSorted = [...exp.dnf].sort();
  const actDNFSorted = [...actualDNF].sort();
  if (JSON.stringify(expDNFSorted) !== JSON.stringify(actDNFSorted)) {
    ok = false;
    issues.push(`DNF mismatch. Expected: ${expDNFSorted.join(', ')} | Got: ${actDNFSorted.join(', ')}`);
  }
  
  const expDNSSorted = [...exp.dns].sort();
  const actDNSSorted = [...actualDNS].sort();
  if (JSON.stringify(expDNSSorted) !== JSON.stringify(actDNSSorted)) {
    ok = false;
    issues.push(`DNS mismatch. Expected: ${expDNSSorted.join(', ')} | Got: ${actDNSSorted.join(', ')}`);
  }
  
  if (race.results.length !== 22) {
    ok = false;
    issues.push(`Driver count: ${race.results.length} (expected 22)`);
  }
  
  const positions = race.results.map(d => d.pos).sort((a,b) => a-b);
  const expectedPositions = Array.from({length: 22}, (_, i) => i+1);
  if (JSON.stringify(positions) !== JSON.stringify(expectedPositions)) {
    ok = false;
    issues.push(`Positions not 1-22: ${positions.join(', ')}`);
  }
  
  const codes = race.results.map(d => d.code);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    ok = false;
    issues.push(`Duplicate driver codes found`);
  }
  
  if (ok) {
    console.log(`Round ${r} (${race.name}): ✅ PASS`);
  } else {
    console.log(`Round ${r} (${race.name}): ❌ FAIL`);
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
}

console.log("\n=== DONE ===");