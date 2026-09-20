import axios, { AxiosInstance } from 'axios';
import type {
  Season, Meeting, Session, Driver, OpenF1Driver, Lap, TelemetryPoint, CarData, Location,
  Position, Interval, Stint, PitStop, Weather, RaceControlMessage, SessionResult,
  Constructor, TeamProfile, MockTelemetryDataset, CircuitData
} from '@/types';

// ==================== API Instances ====================
const openf1Api: AxiosInstance = axios.create({
  baseURL: 'https://api.openf1.org/v1',
  timeout: 15000,
  headers: { 'Accept': 'application/json' },
});

const jolpicaApi: AxiosInstance = axios.create({
  baseURL: 'https://api.jolpi.ca/ergast/f1',
  timeout: 15000,
  headers: { 'Accept': 'application/json' },
});

// ==================== Jolpica (Historical) ====================
export async function fetchJolpicaSeasons(): Promise<Season[]> {
  try {
    const res = await jolpicaApi.get('/seasons.json?limit=100');
    return res.data.MRData.SeasonTable.Seasons.map((s: any) => ({
      year: parseInt(s.season),
      url: s.url,
    }));
  } catch (error) {
    throw error;
  }
}

export async function fetchJolpicaRaces(year: number): Promise<any[]> {
  try {
    const res = await jolpicaApi.get(`/${year}/races.json?limit=30`);
    return res.data.MRData.RaceTable.Races;
  } catch (error) {
    throw error;
  }
}

export async function fetchJolpicaSessions(year: number, round: number): Promise<Session[]> {
  try {
    const res = await jolpicaApi.get(`/${year}/${round}/sessions.json`);
    const sessions = res.data.MRData.RaceTable.Races[0] || {};
    return [
      { session_key: 1, meeting_key: round, session_name: 'Practice 1', session_type: 'Practice', date_start: sessions.FirstPractice?.date, date_end: '', gmt_offset: '0' },
      { session_key: 2, meeting_key: round, session_name: 'Practice 2', session_type: 'Practice', date_start: sessions.SecondPractice?.date, date_end: '', gmt_offset: '0' },
      { session_key: 3, meeting_key: round, session_name: 'Practice 3', session_type: 'Practice', date_start: sessions.ThirdPractice?.date, date_end: '', gmt_offset: '0' },
      { session_key: 4, meeting_key: round, session_name: 'Qualifying', session_type: 'Qualifying', date_start: sessions.Qualifying?.date, date_end: '', gmt_offset: '0' },
      { session_key: 5, meeting_key: round, session_name: 'Race', session_type: 'Race', date_start: sessions.date, date_end: '', gmt_offset: '0' },
    ].filter(s => s.date_start);
  } catch (error) {
    throw error;
  }
}

export async function fetchJolpicaRaceResults(year: number, round: number): Promise<SessionResult[]> {
  try {
    const res = await jolpicaApi.get(`/${year}/${round}/results.json`);
    const results = res.data.MRData.RaceTable.Races[0]?.Results || [];
    return results.map((r: any) => ({
      driver_number: parseInt(r.number),
      position: parseInt(r.position),
      points: parseFloat(r.points),
      laps_completed: parseInt(r.laps),
      gap: r.Time?.time || r.status,
      status: r.status,
      team_name: r.Constructor.name,
      broadcast_name: r.Driver.code,
      name_acronym: r.Driver.code,
    }));
  } catch (error) {
    throw error;
  }
}

export async function fetchJolpicaDriverStandings(year: number): Promise<any[]> {
  try {
    const res = await jolpicaApi.get(`/${year}/driverStandings.json`);
    return res.data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  } catch (error) {
    throw error;
  }
}

export async function fetchJolpicaConstructorStandings(year: number): Promise<any[]> {
  try {
    const res = await jolpicaApi.get(`/${year}/constructorStandings.json`);
    return res.data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
  } catch (error) {
    throw error;
  }
}

// ==================== OpenF1 (Live) ====================
export async function fetchOpenF1Meetings(year: number): Promise<Meeting[]> {
  try {
    const res = await openf1Api.get('/meetings', { params: { year } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1Sessions(meetingKey: number): Promise<Session[]> {
  try {
    const res = await openf1Api.get('/sessions', { params: { meeting_key: meetingKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1Drivers(sessionKey: number): Promise<Driver[]> {
  const res = await openf1Api.get<OpenF1Driver[]>('/drivers', { params: { session_key: sessionKey } });
  return res.data.map(d => ({
    driverId: d.name_acronym?.toLowerCase() || String(d.driver_number),
    permanentNumber: String(d.driver_number),
    code: d.name_acronym || '',
    url: '',
    givenName: d.first_name || '',
    familyName: d.last_name || '',
    dateOfBirth: '',
    nationality: '',
    countryCode: d.country_code || undefined,
    teamName: d.team_name || undefined,
    teamColour: d.team_colour?.replace(/^#/, '') || undefined,
    broadcastName: d.broadcast_name || undefined,
    fullName: d.full_name || undefined,
    nameAcronym: d.name_acronym || undefined,
    driver_number: d.driver_number,
  }));
}

export async function fetchOpenF1Laps(sessionKey: number, driverNumber?: number): Promise<Lap[]> {
  try {
    const params: any = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    const res = await openf1Api.get('/laps', { params });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1CarData(sessionKey: number, driverNumber: number): Promise<CarData[]> {
  try {
    const res = await openf1Api.get('/car_data', { params: { session_key: sessionKey, driver_number: driverNumber } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1Position(sessionKey: number): Promise<Position[]> {
  try {
    const res = await openf1Api.get('/position', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1Intervals(sessionKey: number): Promise<Interval[]> {
  try {
    const res = await openf1Api.get('/intervals', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1Stints(sessionKey: number): Promise<Stint[]> {
  try {
    const res = await openf1Api.get('/stints', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1PitStops(sessionKey: number): Promise<PitStop[]> {
  try {
    const res = await openf1Api.get('/pit', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1Weather(sessionKey: number): Promise<Weather[]> {
  try {
    const res = await openf1Api.get('/weather', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1RaceControl(sessionKey: number): Promise<RaceControlMessage[]> {
  try {
    const res = await openf1Api.get('/race_control', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

export async function fetchOpenF1SessionResult(sessionKey: number): Promise<SessionResult[]> {
  try {
    const res = await openf1Api.get('/session_result', { params: { session_key: sessionKey } });
    return res.data;
  } catch (error) {
    throw error;
  }
}

// ==================== Mock Data Generators (2026 Season) ====================
const TEAMS_2026 = [
  { id: 'redbull', name: 'Red Bull Racing', color: '#0600EF', principal: 'Christian Horner', engineer: 'Pierre Waché', mechanic: 'Lee Stevenson', chassis: 'RB20', powerUnit: 'Honda RBPT', analysis: 'Kings of aero efficiency. RB20\'s floor philosophy dominates high-speed corners. DRS optimization unmatched.' },
  { id: 'ferrari', name: 'Ferrari', color: '#DC0000', principal: 'Fred Vasseur', engineer: 'Enrico Cardile', mechanic: 'Antonio Spagnolo', chassis: 'SF-26', powerUnit: 'Ferrari 066/12', analysis: 'SF-26 tire management supreme. Low-speed traction advantage. Strategic flexibility with tire offsets.' },
  { id: 'mercedes', name: 'Mercedes', color: '#00D2BE', principal: 'Toto Wolff', engineer: 'James Allison', mechanic: 'Ron Meadows', chassis: 'W17', powerUnit: 'Mercedes M15', analysis: 'W17 solved porpoising. Strong race pace. Rear stability in high-speed a hallmark.' },
  { id: 'mclaren', name: 'McLaren', color: '#FF8700', principal: 'Andrea Stella', engineer: 'Rob Marshall', mechanic: 'Tom Stallard', chassis: 'MCL38', powerUnit: 'Mercedes M15', analysis: 'MCL38 aero balance excellent. Qualifying monster. Race degradation improved massively.' },
  { id: 'aston', name: 'Aston Martin', color: '#006F62', principal: 'Mike Krack', engineer: 'Dan Fallows', mechanic: 'Richard Hopkirk', chassis: 'AMR26', powerUnit: 'Honda RBPT', analysis: 'AMR26 high-downforce specialist. Street circuit king. Tire warm-up best in class.' },
  { id: 'alpine', name: 'Alpine', color: '#0090FF', principal: 'Oliver Oakes', engineer: 'David Sanchez', mechanic: 'Mauro Piccoli', chassis: 'A526', powerUnit: 'Renault E-Tech', analysis: 'A526 mechanical grip focus. Wet weather weapon. Undercut strategy enablers.' },
  { id: 'williams', name: 'Williams', color: '#005AFF', principal: 'James Vowles', engineer: 'Dave Robson', mechanic: 'Kenny Bates', chassis: 'FW47', powerUnit: 'Mercedes M15', analysis: 'FW47 low-drag efficiency. Straight-line speed demon. DRS train breaker.' },
  { id: 'rb', name: 'RB', color: '#1E41FF', principal: 'Laurent Mekies', engineer: 'Jody Egginton', mechanic: 'Jonathan Eddolls', chassis: 'VCARB02', powerUnit: 'Honda RBPT', analysis: 'VCARB02 shares Red Bull DNA. Cost-cap miracles. Midfield benchmark.' },
  { id: 'sauber', name: 'Kick Sauber', color: '#52E252', principal: 'Alessandro Alunni Bravi', engineer: 'Simone Resta', mechanic: 'Xevi Pujolar', chassis: 'C46', powerUnit: 'Ferrari 066/12', analysis: 'C46 transition year. Audi 2026 prep underway. Development curve steep.' },
  { id: 'haas', name: 'Haas F1 Team', color: '#B6BABD', principal: 'Ayao Komatsu', engineer: 'Andrea De Zordo', mechanic: 'Mark Slade', chassis: 'VF-26', powerUnit: 'Ferrari 066/12', analysis: 'VF-26 Ferrari customer aero. Race day tire life strong. Points scavenger.' },
];

const DRIVERS_2026 = [
  { number: 1, name: 'Max Verstappen', code: 'VER', team: 'Red Bull Racing', nationality: 'Dutch', color: '#0600EF', perf: 1.00 },
  { number: 11, name: 'Sergio Perez', code: 'PER', team: 'Red Bull Racing', nationality: 'Mexican', color: '#0600EF', perf: 0.97 },
  { number: 16, name: 'Charles Leclerc', code: 'LEC', team: 'Ferrari', nationality: 'Monégasque', color: '#DC0000', perf: 0.99 },
  { number: 55, name: 'Carlos Sainz', code: 'SAI', team: 'Ferrari', nationality: 'Spanish', color: '#DC0000', perf: 0.98 },
  { number: 44, name: 'Lewis Hamilton', code: 'HAM', team: 'Mercedes', nationality: 'British', color: '#00D2BE', perf: 0.98 },
  { number: 63, name: 'George Russell', code: 'RUS', team: 'Mercedes', nationality: 'British', color: '#00D2BE', perf: 0.98 },
  { number: 4, name: 'Lando Norris', code: 'NOR', team: 'McLaren', nationality: 'British', color: '#FF8700', perf: 0.99 },
  { number: 81, name: 'Oscar Piastri', code: 'PIA', team: 'McLaren', nationality: 'Australian', color: '#FF8700', perf: 0.97 },
  { number: 14, name: 'Fernando Alonso', code: 'ALO', team: 'Aston Martin', nationality: 'Spanish', color: '#006F62', perf: 0.97 },
  { number: 18, name: 'Lance Stroll', code: 'STR', team: 'Aston Martin', nationality: 'Canadian', color: '#006F62', perf: 0.94 },
  { number: 10, name: 'Pierre Gasly', code: 'GAS', team: 'Alpine', nationality: 'French', color: '#0090FF', perf: 0.96 },
  { number: 31, name: 'Esteban Ocon', code: 'OCO', team: 'Alpine', nationality: 'French', color: '#0090FF', perf: 0.95 },
  { number: 23, name: 'Alexander Albon', code: 'ALB', team: 'Williams', nationality: 'Thai', color: '#005AFF', perf: 0.96 },
  { number: 2, name: 'Logan Sargeant', code: 'SAR', team: 'Williams', nationality: 'American', color: '#005AFF', perf: 0.92 },
  { number: 3, name: 'Daniel Ricciardo', code: 'RIC', team: 'RB', nationality: 'Australian', color: '#1E41FF', perf: 0.96 },
  { number: 22, name: 'Yuki Tsunoda', code: 'TSU', team: 'RB', nationality: 'Japanese', color: '#1E41FF', perf: 0.95 },
  { number: 27, name: 'Nico Hulkenberg', code: 'HUL', team: 'Kick Sauber', nationality: 'German', color: '#52E252', perf: 0.94 },
  { number: 77, name: 'Valtteri Bottas', code: 'BOT', team: 'Kick Sauber', nationality: 'Finnish', color: '#52E252', perf: 0.93 },
  { number: 20, name: 'Kevin Magnussen', code: 'MAG', team: 'Haas F1 Team', nationality: 'Danish', color: '#B6BABD', perf: 0.94 },
  { number: 24, name: 'Guanyu Zhou', code: 'ZHO', team: 'Haas F1 Team', nationality: 'Chinese', color: '#B6BABD', perf: 0.92 },
];

const CIRCUITS_2026: CircuitData[] = [
  { id: 'bahrain', name: 'Bahrain International Circuit', country: 'Bahrain', length: 5.412, turns: 15, lapRecord: '1:31.447', lapRecordHolder: 'Pedro de la Rosa', lapRecordYear: 2005, svgPath: 'M100,300 Q200,100 300,150 Q400,200 350,300 Q300,400 200,350 Q100,300 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'jeddah', name: 'Jeddah Corniche Circuit', country: 'Saudi Arabia', length: 6.174, turns: 27, lapRecord: '1:30.734', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021, svgPath: 'M50,250 Q150,150 250,200 Q350,250 300,350 Q250,450 150,400 Q50,350 50,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'melbourne', name: 'Albert Park Circuit', country: 'Australia', length: 5.278, turns: 16, lapRecord: '1:19.813', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2024, svgPath: 'M100,200 Q200,100 300,120 Q400,150 380,250 Q350,350 250,380 Q150,350 120,280 Q80,200 100,200', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'suzuka', name: 'Suzuka International Racing Course', country: 'Japan', length: 5.807, turns: 18, lapRecord: '1:30.983', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2019, svgPath: 'M100,300 Q200,200 300,250 Q400,300 450,250 Q500,200 480,150 Q450,100 350,120 Q250,140 200,100 Q150,60 100,150 Q80,200 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'shanghai', name: 'Shanghai International Circuit', country: 'China', length: 5.451, turns: 16, lapRecord: '1:31.095', lapRecordHolder: 'Michael Schumacher', lapRecordYear: 2004, svgPath: 'M100,400 Q150,300 250,350 Q350,400 300,300 Q250,200 350,150 Q450,100 400,200 Q350,300 250,250 Q150,200 100,300 Q80,350 100,400', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'miami', name: 'Miami International Autodrome', country: 'USA', length: 5.412, turns: 19, lapRecord: '1:29.708', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023, svgPath: 'M100,200 Q200,100 350,150 Q500,200 450,300 Q400,400 250,380 Q100,350 100,250 Q100,150 100,200', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'imola', name: 'Imola', country: 'Italy', length: 4.909, turns: 19, lapRecord: '1:15.484', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2020, svgPath: 'M100,300 Q200,200 300,220 Q400,250 380,350 Q350,450 250,420 Q150,380 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'monaco', name: 'Circuit de Monaco', country: 'Monaco', length: 3.337, turns: 19, lapRecord: '1:12.909', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021, svgPath: 'M100,250 Q150,150 250,180 Q350,200 320,300 Q300,400 200,380 Q100,350 100,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'barcelona', name: 'Circuit de Barcelona-Catalunya', country: 'Spain', length: 4.675, turns: 16, lapRecord: '1:16.330', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023, svgPath: 'M100,300 Q200,200 300,220 Q400,250 380,350 Q350,450 250,420 Q150,380 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'montreal', name: 'Circuit Gilles Villeneuve', country: 'Canada', length: 4.361, turns: 14, lapRecord: '1:13.078', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2019, svgPath: 'M100,200 Q200,100 300,150 Q400,200 350,300 Q300,400 200,350 Q100,300 100,200', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'silverstone', name: 'Silverstone Circuit', country: 'UK', length: 5.891, turns: 18, lapRecord: '1:27.097', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2020, svgPath: 'M100,300 Q200,200 350,250 Q500,300 450,400 Q400,500 250,450 Q100,400 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'budapest', name: 'Hungaroring', country: 'Hungary', length: 4.381, turns: 14, lapRecord: '1:16.627', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2020, svgPath: 'M100,250 Q150,150 250,180 Q350,200 320,300 Q300,400 200,380 Q100,350 100,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'spa', name: 'Circuit de Spa-Francorchamps', country: 'Belgium', length: 7.004, turns: 19, lapRecord: '1:41.252', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2018, svgPath: 'M50,200 Q150,100 300,150 Q450,200 400,300 Q350,400 200,350 Q50,300 50,200', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'zandvoort', name: 'Circuit Zandvoort', country: 'Netherlands', length: 4.259, turns: 14, lapRecord: '1:11.097', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021, svgPath: 'M100,250 Q150,150 250,180 Q350,200 320,300 Q300,400 200,380 Q100,350 100,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'monza', name: 'Monza', country: 'Italy', length: 5.793, turns: 11, lapRecord: '1:21.046', lapRecordHolder: 'Rubens Barrichello', lapRecordYear: 2004, svgPath: 'M100,300 Q200,200 350,250 Q500,300 450,400 Q400,500 250,450 Q100,400 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'baku', name: 'Baku City Circuit', country: 'Azerbaijan', length: 6.003, turns: 20, lapRecord: '1:43.009', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2019, svgPath: 'M50,300 Q150,200 300,250 Q450,300 400,400 Q350,500 200,450 Q50,400 50,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'singapore', name: 'Marina Bay Street Circuit', country: 'Singapore', length: 5.063, turns: 23, lapRecord: '1:34.486', lapRecordHolder: 'Kevin Magnussen', lapRecordYear: 2022, svgPath: 'M100,200 Q150,100 250,150 Q350,200 300,300 Q250,400 150,350 Q50,300 100,200', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'austin', name: 'Circuit of the Americas', country: 'USA', length: 5.513, turns: 20, lapRecord: '1:36.169', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2019, svgPath: 'M100,300 Q200,200 350,250 Q500,300 450,400 Q400,500 250,450 Q100,400 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'mexico', name: 'Autodromo Hermanos Rodriguez', country: 'Mexico', length: 4.304, turns: 17, lapRecord: '1:17.774', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2021, svgPath: 'M100,250 Q150,150 250,180 Q350,200 320,300 Q300,400 200,380 Q100,350 100,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'sao-paulo', name: 'Interlagos', country: 'Brazil', length: 4.309, turns: 15, lapRecord: '1:10.540', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2018, svgPath: 'M100,250 Q150,150 250,180 Q350,200 320,300 Q300,400 200,380 Q100,350 100,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'las-vegas', name: 'Las Vegas Strip Circuit', country: 'USA', length: 6.12, turns: 17, lapRecord: '1:35.490', lapRecordHolder: 'Oscar Piastri', lapRecordYear: 2023, svgPath: 'M50,200 Q150,100 300,150 Q450,200 400,300 Q350,400 200,350 Q50,300 50,200', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'qatar', name: 'Lusail International Circuit', country: 'Qatar', length: 5.38, turns: 16, lapRecord: '1:23.196', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023, svgPath: 'M100,250 Q150,150 250,180 Q350,200 320,300 Q300,400 200,380 Q100,350 100,250', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
  { id: 'abu-dhabi', name: 'Yas Marina Circuit', country: 'UAE', length: 5.281, turns: 16, lapRecord: '1:26.103', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2021, svgPath: 'M100,300 Q200,200 350,250 Q500,300 450,400 Q400,500 250,450 Q100,400 100,300', sectors: [{number:1,startPercent:0,endPercent:33,color:'#E10600'},{number:2,startPercent:33,endPercent:66,color:'#FFD700'},{number:3,startPercent:66,endPercent:100,color:'#9B51E0'}] },
];

export function generateMockTelemetryDataset(
  circuitId: string,
  drivers: Array<{ number: number; name: string; team: string; color: string; performance: number }>
): MockTelemetryDataset[] {
  const circuit = CIRCUITS_2026.find(c => c.id === circuitId) || CIRCUITS_2026[0];
  const lapCount = 3;
  const pointsPerLap = 100;
  
  return drivers.map((driver, dIdx) => {
    const basePerf = driver.performance || (1.0 - dIdx * 0.02);
    const laps = [];
    
    for (let lap = 0; lap < lapCount; lap++) {
      const points: TelemetryPoint[] = [];
      const lapTimeBase = 85000 + (1 - basePerf) * 3000;
      const lapTimeVariation = (Math.random() - 0.5) * 1000;
      
      for (let i = 0; i < pointsPerLap; i++) {
        const progress = i / pointsPerLap;
        const sector = progress < 0.33 ? 1 : progress < 0.66 ? 2 : 3;
        
        // Speed profile based on sector
        let baseSpeed = 250;
        if (sector === 1) baseSpeed = 280;
        else if (sector === 2) baseSpeed = 220;
        else baseSpeed = 300;
        
        const speed = baseSpeed * basePerf + (Math.random() - 0.5) * 30;
        const rpm = (speed / 350) * 15000 * (0.8 + Math.random() * 0.3);
        const gear = Math.min(8, Math.max(1, Math.floor(speed / 50)));
        const throttle = sector === 1 ? 0.95 : sector === 2 ? 0.7 : 1.0;
        const brake = sector === 2 ? 0.8 : 0.0;
        const drs = (sector === 1 || sector === 3) && speed > 280 ? 1 : 0;
        
        points.push({
          date: new Date(Date.now() + i * 10).toISOString(),
          driver_number: driver.number,
          session_key: 1,
          speed: Math.round(Math.max(0, speed)),
          rpm: Math.round(Math.max(0, rpm)),
          n_gear: gear,
          throttle: Math.max(0, Math.min(1, throttle + (Math.random() - 0.5) * 0.1)),
          brake: Math.max(0, Math.min(1, brake + (Math.random() - 0.5) * 0.1)),
          drs,
          distance: progress * circuit.length * 1000,
          x: 400 + Math.sin(progress * Math.PI * 2) * 300,
          y: 300 + Math.cos(progress * Math.PI * 2) * 200,
        });
      }
      
      laps.push({
        lapNumber: lap + 1,
        lapTime: Math.round(lapTimeBase + lapTimeVariation - lap * 200),
        points,
      });
    }
    
    return {
      driverNumber: driver.number,
      driverName: driver.name,
      team: driver.team,
      teamColor: driver.color,
      performance: basePerf,
      laps,
    };
  });
}

export function generateMockLaps(driverNumber: number, count: number = 50) {
  return Array.from({ length: count }, (_, i) => {
    const baseTime = 85000 + Math.random() * 3000;
    const degradation = i * 80;
    const noise = (Math.random() - 0.5) * 300;
    const pitStop = i > 0 && i % 18 === 0;
    
    return {
      lap_number: i + 1,
      driver_number: driverNumber,
      lap_duration: Math.round(baseTime + degradation + noise + (pitStop ? 25000 : 0)),
      duration_sector_1: Math.round(25000 + degradation/3 + (Math.random()-0.5)*100),
      duration_sector_2: Math.round(30000 + degradation/3 + (Math.random()-0.5)*100),
      duration_sector_3: Math.round(30000 + degradation/3 + (Math.random()-0.5)*100),
      is_pit_out_lap: pitStop && i > 0,
      is_pit_in_lap: pitStop && i < count - 1,
      tire_compound: i < 18 ? 'SOFT' : i < 36 ? 'MEDIUM' : 'HARD',
      tire_age: pitStop ? 1 : (i % 18) + 1,
      date_start: new Date(Date.now() + i * 90000).toISOString(),
    };
  });
}

export function generateMockStints(driverNumber: number, totalLaps: number = 50) {
  const stints = [];
  let currentLap = 1;
  const compounds = ['SOFT', 'MEDIUM', 'HARD'];
  let compoundIdx = 0;
  
  while (currentLap <= totalLaps) {
    const stintLength = Math.min(18 + Math.floor(Math.random() * 5), totalLaps - currentLap + 1);
    stints.push({
      driver_number: driverNumber,
      session_key: 1,
      stint_number: stints.length + 1,
      lap_start: currentLap,
      lap_end: currentLap + stintLength - 1,
      compound: compounds[compoundIdx % compounds.length],
      tyre_age_start: 1,
      tyre_age_end: stintLength,
    });
    currentLap += stintLength;
    compoundIdx++;
  }
  
  return stints;
}

export function generateMockPitStops(driverNumber: number, stintCount: number) {
  const stops = [];
  let cumulativeLaps = 0;
  
  for (let i = 0; i < stintCount - 1; i++) {
    const stintLength = 18 + Math.floor(Math.random() * 5);
    cumulativeLaps += stintLength;
    stops.push({
      driver_number: driverNumber,
      session_key: 1,
      lap_number: cumulativeLaps,
      pit_duration: 22000 + Math.random() * 3000,
      date: new Date(Date.now() + cumulativeLaps * 90000).toISOString(),
    });
  }
  
  return stops;
}

export function generateMockPositions(driverNumbers: number[]) {
  return driverNumbers.map((num, i) => ({
    date: new Date().toISOString(),
    driver_number: num,
    session_key: 1,
    position: i + 1,
  }));
}

export function generateMockIntervals(driverNumbers: number[]) {
  return driverNumbers.map((num, i) => ({
    date: new Date().toISOString(),
    driver_number: num,
    session_key: 1,
    gap_to_leader: i === 0 ? 0 : (i * 1.5 + Math.random() * 2) * 1000,
    interval: i === 0 ? 0 : (1.5 + Math.random() * 1) * 1000,
    predicted_lap_time: 85000 + Math.random() * 2000,
  }));
}

export function generateMockWeather() {
  return [{
    session_key: 1,
    date: new Date().toISOString(),
    air_temperature: 28 + Math.random() * 8,
    track_temperature: 42 + Math.random() * 12,
    humidity: 55 + Math.random() * 25,
    wind_speed: 5 + Math.random() * 10,
    wind_direction: Math.random() * 360,
    pressure: 1013 + Math.random() * 10,
    rainfall: 0,
  }];
}

export function generateMockRaceControl() {
  const messages = [
    { category: 'Flag', message: 'GREEN FLAG - Race started', flag: 'GREEN', scope: 'Race' },
    { category: 'SafetyCar', message: 'Safety Car deployed', flag: 'YELLOW', scope: 'Race' },
    { category: 'Flag', message: 'YELLOW FLAG - Sector 2', flag: 'YELLOW', scope: 'Sector 2' },
    { category: 'Penalty', message: '5s penalty for Driver 44 - Track limits', flag: 'BLACK_WHITE', scope: 'Driver 44' },
    { category: 'Flag', message: 'GREEN FLAG - Racing resumed', flag: 'GREEN', scope: 'Race' },
    { category: 'Info', message: 'Fastest lap: Driver 1 - 1:29.708', flag: 'CHEQUERED', scope: 'Race' },
  ];
  
  return messages.map((m, i) => ({
    session_key: 1,
    date: new Date(Date.now() + i * 300000).toISOString(),
    ...m,
  }));
}

// ==================== 2026 Season Data ====================
export function get2026Meetings(): Meeting[] {
  const meetings: Meeting[] = [
    { meeting_key: 1, meeting_name: 'Bahrain Grand Prix', meeting_official_name: 'Formula 1 Gulf Air Bahrain Grand Prix 2026', location: 'Sakhir', country_name: 'Bahrain', country_code: 'BHR', circuit_short_name: 'Bahrain', gmt_offset: '+03:00', date_start: '2026-03-06T12:30:00Z', date_end: '2026-03-08T15:00:00Z', year: 2026 },
    { meeting_key: 2, meeting_name: 'Saudi Arabian Grand Prix', meeting_official_name: 'Formula 1 STC Saudi Arabian Grand Prix 2026', location: 'Jeddah', country_name: 'Saudi Arabia', country_code: 'SAU', circuit_short_name: 'Jeddah', gmt_offset: '+03:00', date_start: '2026-03-20T15:30:00Z', date_end: '2026-03-22T18:00:00Z', year: 2026 },
    { meeting_key: 3, meeting_name: 'Australian Grand Prix', meeting_official_name: 'Formula 1 Rolex Australian Grand Prix 2026', location: 'Melbourne', country_name: 'Australia', country_code: 'AUS', circuit_short_name: 'Melbourne', gmt_offset: '+11:00', date_start: '2026-04-03T02:30:00Z', date_end: '2026-04-05T05:00:00Z', year: 2026 },
    { meeting_key: 4, meeting_name: 'Japanese Grand Prix', meeting_official_name: 'Formula 1 MSC Cruises Japanese Grand Prix 2026', location: 'Suzuka', country_name: 'Japan', country_code: 'JPN', circuit_short_name: 'Suzuka', gmt_offset: '+09:00', date_start: '2026-04-17T03:30:00Z', date_end: '2026-04-19T06:00:00Z', year: 2026 },
    { meeting_key: 5, meeting_name: 'Chinese Grand Prix', meeting_official_name: 'Formula 1 Lenovo Chinese Grand Prix 2026', location: 'Shanghai', country_name: 'China', country_code: 'CHN', circuit_short_name: 'Shanghai', gmt_offset: '+08:00', date_start: '2026-04-24T03:30:00Z', date_end: '2026-04-26T06:00:00Z', year: 2026 },
    { meeting_key: 6, meeting_name: 'Miami Grand Prix', meeting_official_name: 'Formula 1 Crypto.com Miami Grand Prix 2026', location: 'Miami', country_name: 'United States', country_code: 'USA', circuit_short_name: 'Miami', gmt_offset: '-04:00', date_start: '2026-05-08T17:30:00Z', date_end: '2026-05-10T20:00:00Z', year: 2026 },
    { meeting_key: 7, meeting_name: 'Emilia-Romagna Grand Prix', meeting_official_name: 'Formula 1 AWS Emilia-Romagna Grand Prix 2026', location: 'Imola', country_name: 'Italy', country_code: 'ITA', circuit_short_name: 'Imola', gmt_offset: '+02:00', date_start: '2026-05-22T11:30:00Z', date_end: '2026-05-24T14:00:00Z', year: 2026 },
    { meeting_key: 8, meeting_name: 'Monaco Grand Prix', meeting_official_name: 'Formula 1 Tag Heuer Monaco Grand Prix 2026', location: 'Monte Carlo', country_name: 'Monaco', country_code: 'MCO', circuit_short_name: 'Monaco', gmt_offset: '+02:00', date_start: '2026-05-29T11:30:00Z', date_end: '2026-05-31T14:00:00Z', year: 2026 },
    { meeting_key: 9, meeting_name: 'Spanish Grand Prix', meeting_official_name: 'Formula 1 Aramco Spanish Grand Prix 2026', location: 'Barcelona', country_name: 'Spain', country_code: 'ESP', circuit_short_name: 'Barcelona', gmt_offset: '+02:00', date_start: '2026-06-19T11:30:00Z', date_end: '2026-06-21T14:00:00Z', year: 2026 },
    { meeting_key: 10, meeting_name: 'Canadian Grand Prix', meeting_official_name: 'Formula 1 AWS Canadian Grand Prix 2026', location: 'Montreal', country_name: 'Canada', country_code: 'CAN', circuit_short_name: 'Montreal', gmt_offset: '-04:00', date_start: '2026-06-26T15:30:00Z', date_end: '2026-06-28T18:00:00Z', year: 2026 },
    { meeting_key: 11, meeting_name: 'British Grand Prix', meeting_official_name: 'Formula 1 Qatar Airways British Grand Prix 2026', location: 'Silverstone', country_name: 'United Kingdom', country_code: 'GBR', circuit_short_name: 'Silverstone', gmt_offset: '+01:00', date_start: '2026-07-10T11:30:00Z', date_end: '2026-07-12T14:00:00Z', year: 2026 },
    { meeting_key: 12, meeting_name: 'Hungarian Grand Prix', meeting_official_name: 'Formula 1 Lenovo Hungarian Grand Prix 2026', location: 'Budapest', country_name: 'Hungary', country_code: 'HUN', circuit_short_name: 'Budapest', gmt_offset: '+02:00', date_start: '2026-07-24T11:30:00Z', date_end: '2026-07-26T14:00:00Z', year: 2026 },
    { meeting_key: 13, meeting_name: 'Belgian Grand Prix', meeting_official_name: 'Formula 1 Rolex Belgian Grand Prix 2026', location: 'Spa-Francorchamps', country_name: 'Belgium', country_code: 'BEL', circuit_short_name: 'Spa', gmt_offset: '+02:00', date_start: '2026-08-28T11:30:00Z', date_end: '2026-08-30T14:00:00Z', year: 2026 },
    { meeting_key: 14, meeting_name: 'Dutch Grand Prix', meeting_official_name: 'Formula 1 Heineken Dutch Grand Prix 2026', location: 'Zandvoort', country_name: 'Netherlands', country_code: 'NLD', circuit_short_name: 'Zandvoort', gmt_offset: '+02:00', date_start: '2026-09-04T11:30:00Z', date_end: '2026-09-06T14:00:00Z', year: 2026 },
    { meeting_key: 15, meeting_name: 'Italian Grand Prix', meeting_official_name: 'Formula 1 Pirelli Italian Grand Prix 2026', location: 'Monza', country_name: 'Italy', country_code: 'ITA', circuit_short_name: 'Monza', gmt_offset: '+02:00', date_start: '2026-09-11T11:30:00Z', date_end: '2026-09-13T14:00:00Z', year: 2026 },
    { meeting_key: 16, meeting_name: 'Azerbaijan Grand Prix', meeting_official_name: 'Formula 1 Qatar Airways Azerbaijan Grand Prix 2026', location: 'Baku', country_name: 'Azerbaijan', country_code: 'AZE', circuit_short_name: 'Baku', gmt_offset: '+04:00', date_start: '2026-09-25T10:30:00Z', date_end: '2026-09-27T13:00:00Z', year: 2026 },
    { meeting_key: 17, meeting_name: 'Singapore Grand Prix', meeting_official_name: 'Formula 1 Singapore Airlines Singapore Grand Prix 2026', location: 'Singapore', country_name: 'Singapore', country_code: 'SGP', circuit_short_name: 'Singapore', gmt_offset: '+08:00', date_start: '2026-10-02T11:30:00Z', date_end: '2026-10-04T14:00:00Z', year: 2026 },
    { meeting_key: 18, meeting_name: 'United States Grand Prix', meeting_official_name: 'Formula 1 Lenovo United States Grand Prix 2026', location: 'Austin', country_name: 'United States', country_code: 'USA', circuit_short_name: 'Austin', gmt_offset: '-05:00', date_start: '2026-10-23T17:30:00Z', date_end: '2026-10-25T20:00:00Z', year: 2026 },
    { meeting_key: 19, meeting_name: 'Mexico City Grand Prix', meeting_official_name: 'Formula 1 Gran Premio de la Ciudad de México 2026', location: 'Mexico City', country_name: 'Mexico', country_code: 'MEX', circuit_short_name: 'Mexico', gmt_offset: '-06:00', date_start: '2026-10-30T18:30:00Z', date_end: '2026-11-01T21:00:00Z', year: 2026 },
    { meeting_key: 20, meeting_name: 'São Paulo Grand Prix', meeting_official_name: 'Formula 1 Rolex São Paulo Grand Prix 2026', location: 'São Paulo', country_name: 'Brazil', country_code: 'BRA', circuit_short_name: 'Interlagos', gmt_offset: '-03:00', date_start: '2026-11-13T14:30:00Z', date_end: '2026-11-15T17:00:00Z', year: 2026 },
    { meeting_key: 21, meeting_name: 'Las Vegas Grand Prix', meeting_official_name: 'Formula 1 Heineken Las Vegas Grand Prix 2026', location: 'Las Vegas', country_name: 'United States', country_code: 'USA', circuit_short_name: 'Las Vegas', gmt_offset: '-08:00', date_start: '2026-11-20T05:30:00Z', date_end: '2026-11-22T08:00:00Z', year: 2026 },
    { meeting_key: 22, meeting_name: 'Qatar Grand Prix', meeting_official_name: 'Formula 1 Qatar Airways Qatar Grand Prix 2026', location: 'Lusail', country_name: 'Qatar', country_code: 'QAT', circuit_short_name: 'Qatar', gmt_offset: '+03:00', date_start: '2026-11-27T14:30:00Z', date_end: '2026-11-29T17:00:00Z', year: 2026 },
    { meeting_key: 23, meeting_name: 'Abu Dhabi Grand Prix', meeting_official_name: 'Formula 1 Etihad Airways Abu Dhabi Grand Prix 2026', location: 'Abu Dhabi', country_name: 'United Arab Emirates', country_code: 'ARE', circuit_short_name: 'Abu Dhabi', gmt_offset: '+04:00', date_start: '2026-12-04T12:30:00Z', date_end: '2026-12-06T15:00:00Z', year: 2026 },
  ];
  return meetings;
}

export function get2026Sessions(meetingKey: number): Session[] {
  const baseKey = meetingKey * 10;
  return [
    { session_key: baseKey + 1, meeting_key: meetingKey, session_name: 'Practice 1', session_type: 'Practice', date_start: '', date_end: '', gmt_offset: '' },
    { session_key: baseKey + 2, meeting_key: meetingKey, session_name: 'Practice 2', session_type: 'Practice', date_start: '', date_end: '', gmt_offset: '' },
    { session_key: baseKey + 3, meeting_key: meetingKey, session_name: 'Practice 3', session_type: 'Practice', date_start: '', date_end: '', gmt_offset: '' },
    { session_key: baseKey + 4, meeting_key: meetingKey, session_name: 'Qualifying', session_type: 'Qualifying', date_start: '', date_end: '', gmt_offset: '' },
    { session_key: baseKey + 5, meeting_key: meetingKey, session_name: 'Race', session_type: 'Race', date_start: '', date_end: '', gmt_offset: '' },
  ];
}

export function get2026Drivers(): Driver[] {
  return DRIVERS_2026.map(d => ({
    driverId: d.code.toLowerCase(),
    permanentNumber: d.number.toString(),
    code: d.code,
    url: '',
    givenName: d.name.split(' ')[0],
    familyName: d.name.split(' ').slice(1).join(' '),
    dateOfBirth: '',
    nationality: d.nationality,
    teamId: d.team.toLowerCase().replace(' ', '-'),
    teamName: d.team,
    teamColour: d.color.replace('#', ''),
    broadcastName: d.code,
    fullName: d.name,
    nameAcronym: d.code,
    driver_number: d.number,
  }));
}

export function get2026Constructors(): Constructor[] {
  return TEAMS_2026.map(t => ({
    constructorId: t.id,
    url: '',
    name: t.name,
    nationality: 'International',
    teamPrincipal: t.principal,
    chiefEngineer: t.engineer,
    headMechanic: t.mechanic,
    chassis: t.chassis,
    powerUnit: t.powerUnit,
    techAnalysis: t.analysis,
    logo: '',
    color: t.color,
  }));
}

export function get2026TeamProfiles(): Record<string, TeamProfile> {
  const profiles: Record<string, TeamProfile> = {};
  TEAMS_2026.forEach((t, i) => {
    const teamDrivers = DRIVERS_2026.filter(d => d.team === t.name);
    profiles[t.id] = {
      team_id: t.id,
      name: t.name,
      full_name: t.name + ' Formula 1 Team',
      base: 'United Kingdom',
      team_principal: t.principal,
      chief_engineer: t.engineer,
      head_mechanic: t.mechanic,
      chassis: t.chassis,
      power_unit: t.powerUnit,
      tech_analysis: t.analysis,
      founded: 2005 + i * 2,
      championships_won: Math.floor(Math.random() * 8),
      race_wins: Math.floor(Math.random() * 120),
      pole_positions: Math.floor(Math.random() * 100),
      fastest_laps: Math.floor(Math.random() * 80),
      total_points: Math.floor(Math.random() * 5000),
      logo: '',
      color: t.color,
      drivers: teamDrivers.map(d => ({
        driver_number: d.number,
        broadcast_name: d.code,
        full_name: d.name,
        nationality: d.nationality,
      })),
    };
  });
  return profiles;
}

export function getCircuitData(circuitId: string): CircuitData | undefined {
  return CIRCUITS_2026.find(c => c.id === circuitId);
}

export function getAllCircuits(): CircuitData[] {
  return CIRCUITS_2026;
}