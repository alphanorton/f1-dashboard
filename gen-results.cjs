const fs = require('fs');

const results = {
  season: 2026,
  asOfRound: 16,
  asOfDate: "2026-09-19",
  source: "Official FIA Classification 2026",
  pointsSystem: "25-18-15-12-10-8-6-4-2-1",
  races: {}
};

const rounds = {
  1: { name: "Australian Grand Prix", date: "2026-03-08", circuit: "Albert Park Circuit" },
  2: { name: "Chinese Grand Prix", date: "2026-03-15", circuit: "Shanghai International Circuit" },
  3: { name: "Japanese Grand Prix", date: "2026-03-29", circuit: "Suzuka International Racing Course" },
  6: { name: "Miami Grand Prix", date: "2026-05-03", circuit: "Miami International Autodrome" },
  7: { name: "Canadian Grand Prix", date: "2026-05-24", circuit: "Circuit Gilles-Villeneuve" },
  8: { name: "Monaco Grand Prix", date: "2026-06-07", circuit: "Circuit de Monaco" },
  9: { name: "Barcelona-Catalunya Grand Prix", date: "2026-06-14", circuit: "Circuit de Barcelona-Catalunya" },
  10: { name: "Austrian Grand Prix", date: "2026-06-28", circuit: "Red Bull Ring" },
  11: { name: "British Grand Prix", date: "2026-07-05", circuit: "Silverstone Circuit" },
  12: { name: "Belgian Grand Prix", date: "2026-07-19", circuit: "Circuit de Spa-Francorchamps" },
  13: { name: "Hungarian Grand Prix", date: "2026-07-26", circuit: "Hungaroring" },
  14: { name: "Dutch Grand Prix", date: "2026-08-23", circuit: "Circuit Zandvoort" },
  15: { name: "Italian Grand Prix", date: "2026-09-06", circuit: "Autodromo Nazionale Monza" },
  16: { name: "Spanish Grand Prix", date: "2026-09-13", circuit: "Madring Circuit" }
};

function pts(pos) {
  const map = {1:25,2:18,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:1};
  return map[pos] || 0;
}

const r1 = [
  {pos:1,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:3,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:4,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:6,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:7,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:8,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:9,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:10,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:11,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:12,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:13,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:14,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:15,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:16,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:17,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:18,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"DNF"},
  {pos:19,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"DNF"},
  {pos:20,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"DNF"},
  {pos:21,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"DNS"},
  {pos:22,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"DNS"}
];

const r2 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:3,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:4,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:6,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:7,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:8,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:9,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:10,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:11,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:12,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:13,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:14,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:15,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:16,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"DNF"},
  {pos:17,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"DNF"},
  {pos:18,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:19,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"DNS"},
  {pos:20,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"DNS"},
  {pos:21,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"DNS"},
  {pos:22,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"DNS"}
];

const r3 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:3,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:4,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:5,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:6,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:7,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:8,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:9,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:10,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:11,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:12,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:13,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:14,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:15,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:16,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:17,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:18,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:19,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:20,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:21,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:22,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"DNF"}
];

const r6 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:3,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:4,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:5,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:6,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:7,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:8,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:9,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:10,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:11,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:12,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:13,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:14,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:15,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:16,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:17,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"Finished"},
  {pos:18,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:19,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"DNF"},
  {pos:20,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"DNF"},
  {pos:21,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"DNF"},
  {pos:22,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"DNF"}
];

const r7 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:3,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:4,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:6,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:7,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:8,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:9,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:10,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:11,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:12,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:13,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:14,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:15,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"Finished"},
  {pos:16,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:17,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"DNF"},
  {pos:18,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"DNF"},
  {pos:19,driver:"George Russell",code:"RUS",team:"Mercedes",status:"DNF"},
  {pos:20,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"DNF"},
  {pos:21,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"DNF"},
  {pos:22,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"DNS"}
];

const r8 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:3,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:4,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:5,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:6,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:7,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:8,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:9,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:10,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:11,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:12,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:13,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:14,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:15,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:16,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"DNF"},
  {pos:17,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"DNF"},
  {pos:18,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:19,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"DNF"},
  {pos:20,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"DNF"},
  {pos:21,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"DNF"},
  {pos:22,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"DNF"}
];

const r9 = [
  {pos:1,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:2,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:3,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:4,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:5,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:6,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:7,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:8,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:9,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:10,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:11,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:12,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:13,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:14,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:15,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"DNF"},
  {pos:16,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"DNF"},
  {pos:17,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"DNF"},
  {pos:18,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"DNF"},
  {pos:19,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"DNF"},
  {pos:20,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"DNF"},
  {pos:21,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"DNF"},
  {pos:22,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"}
];

const r10 = [
  {pos:1,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:3,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:4,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:5,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:6,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:7,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:8,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:9,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:10,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:11,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:12,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:13,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:14,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:15,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:16,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:17,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:18,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:19,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:20,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"DNF"},
  {pos:21,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"DNF"},
  {pos:22,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"DNF"}
];

const r11 = [
  {pos:1,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:2,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:3,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:4,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:5,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:6,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:7,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:8,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:9,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:10,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:11,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:12,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:13,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:14,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:15,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:16,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:17,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:18,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:19,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"Finished"},
  {pos:20,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"DNF"},
  {pos:21,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"DNF"},
  {pos:22,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"DNF"}
];

const r12 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:3,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:4,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:6,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:7,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:8,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:9,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:10,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:11,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:12,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:13,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:14,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:15,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:16,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:17,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:18,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:19,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:20,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:21,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"DNF"},
  {pos:22,driver:"George Russell",code:"RUS",team:"Mercedes",status:"DNF"}
];

const r13 = [
  {pos:1,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:2,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:3,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:4,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:6,driver:"Isack Hadjar",code:"HAD",team:"Red Bull Racing",status:"Finished"},
  {pos:7,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:8,driver:"Liam Lawson",code:"LAW",team:"Racing Bulls",status:"Finished"},
  {pos:9,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:10,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:11,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:12,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:13,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"Finished"},
  {pos:14,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:15,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:16,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:17,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:18,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:19,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:20,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"DNF"},
  {pos:21,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"DNF"},
  {pos:22,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"DNF"}
];

const r14 = [
  {pos:1,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:2,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:3,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:4,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:6,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:7,driver:"Liam Lawson",code:"LAW",team:"Red Bull Racing",status:"Finished"},
  {pos:8,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:9,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:10,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:11,driver:"Yuki Tsunoda",code:"TSU",team:"Racing Bulls",status:"Finished"},
  {pos:12,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:13,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:14,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:15,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:16,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:17,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"DNF"},
  {pos:18,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"DNF"},
  {pos:19,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"DNF"},
  {pos:20,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:21,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"DNF"},
  {pos:22,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"DNF"}
];

const r15 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:3,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:4,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:5,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:6,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"Finished"},
  {pos:7,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:8,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:9,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:10,driver:"Yuki Tsunoda",code:"TSU",team:"Racing Bulls",status:"Finished"},
  {pos:11,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:12,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:13,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"Finished"},
  {pos:14,driver:"Liam Lawson",code:"LAW",team:"Red Bull Racing",status:"Finished"},
  {pos:15,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:16,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:17,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:18,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"Finished"},
  {pos:19,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:20,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:21,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"DNF"},
  {pos:22,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"DNF"}
];

const r16 = [
  {pos:1,driver:"Kimi Antonelli",code:"ANT",team:"Mercedes",status:"Finished"},
  {pos:2,driver:"Max Verstappen",code:"VER",team:"Red Bull Racing",status:"Finished"},
  {pos:3,driver:"Lando Norris",code:"NOR",team:"McLaren",status:"Finished"},
  {pos:4,driver:"Charles Leclerc",code:"LEC",team:"Ferrari",status:"Finished"},
  {pos:5,driver:"George Russell",code:"RUS",team:"Mercedes",status:"Finished"},
  {pos:6,driver:"Liam Lawson",code:"LAW",team:"Red Bull Racing",status:"Finished"},
  {pos:7,driver:"Franco Colapinto",code:"COL",team:"Alpine",status:"Finished"},
  {pos:8,driver:"Oscar Piastri",code:"PIA",team:"McLaren",status:"Finished"},
  {pos:9,driver:"Arvid Lindblad",code:"LIN",team:"Racing Bulls",status:"Finished"},
  {pos:10,driver:"Nico Hulkenberg",code:"HUL",team:"Audi",status:"Finished"},
  {pos:11,driver:"Esteban Ocon",code:"OCO",team:"Haas",status:"Finished"},
  {pos:12,driver:"Pierre Gasly",code:"GAS",team:"Alpine",status:"Finished"},
  {pos:13,driver:"Gabriel Bortoleto",code:"BOR",team:"Audi",status:"Finished"},
  {pos:14,driver:"Yuki Tsunoda",code:"TSU",team:"Racing Bulls",status:"Finished"},
  {pos:15,driver:"Alexander Albon",code:"ALB",team:"Williams",status:"Finished"},
  {pos:16,driver:"Oliver Bearman",code:"BEA",team:"Haas",status:"Finished"},
  {pos:17,driver:"Fernando Alonso",code:"ALO",team:"Aston Martin",status:"Finished"},
  {pos:18,driver:"Valtteri Bottas",code:"BOT",team:"Cadillac",status:"Finished"},
  {pos:19,driver:"Carlos Sainz",code:"SAI",team:"Williams",status:"DNF"},
  {pos:20,driver:"Sergio Perez",code:"PER",team:"Cadillac",status:"DNF"},
  {pos:21,driver:"Lance Stroll",code:"STR",team:"Aston Martin",status:"DNF"},
  {pos:22,driver:"Lewis Hamilton",code:"HAM",team:"Ferrari",status:"DNF"}
];

// Add points to each result
const allRounds = {1:r1, 2:r2, 3:r3, 6:r6, 7:r7, 8:r8, 9:r9, 10:r10, 11:r11, 12:r12, 13:r13, 14:r14, 15:r15, 16:r16};

for (const [roundNum, roundData] of Object.entries(allRounds)) {
  const info = rounds[roundNum];
  const driversWithPoints = roundData.map(d => ({
    ...d,
    points: pts(d.pos)
  }));
  results.races[roundNum] = {
    round: parseInt(roundNum),
    name: info.name,
    date: info.date,
    circuit: info.circuit,
    results: driversWithPoints
  };
}

// Write file
fs.writeFileSync('public/data/results.json', JSON.stringify(results, null, 2), 'utf8');

console.log("Written results.json with correct round numbers:");
for (const [r, data] of Object.entries(results.races)) {
  const winner = data.results[0].driver;
  const dnf = data.results.filter(d => d.status === "DNF").length;
  const dns = data.results.filter(d => d.status === "DNS").length;
  console.log(`  R${r} ${data.name}: Winner=${winner}, DNF=${dnf}, DNS=${dns}, Drivers=${data.results.length}`);
}
