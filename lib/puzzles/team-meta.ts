 export type TeamMeta = {
  id: number;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
  conference: "East" | "West";
  division: string;
};

export const NBA_TEAMS: TeamMeta[] = [
  { id: 1, city: "Atlanta", name: "Hawks", full_name: "Atlanta Hawks", abbreviation: "ATL", conference: "East", division: "Southeast" },
  { id: 2, city: "Boston", name: "Celtics", full_name: "Boston Celtics", abbreviation: "BOS", conference: "East", division: "Atlantic" },
  { id: 3, city: "Brooklyn", name: "Nets", full_name: "Brooklyn Nets", abbreviation: "BKN", conference: "East", division: "Atlantic" },
  { id: 4, city: "Charlotte", name: "Hornets", full_name: "Charlotte Hornets", abbreviation: "CHA", conference: "East", division: "Southeast" },
  { id: 5, city: "Chicago", name: "Bulls", full_name: "Chicago Bulls", abbreviation: "CHI", conference: "East", division: "Central" },
  { id: 6, city: "Cleveland", name: "Cavaliers", full_name: "Cleveland Cavaliers", abbreviation: "CLE", conference: "East", division: "Central" },
  { id: 7, city: "Dallas", name: "Mavericks", full_name: "Dallas Mavericks", abbreviation: "DAL", conference: "West", division: "Southwest" },
  { id: 8, city: "Denver", name: "Nuggets", full_name: "Denver Nuggets", abbreviation: "DEN", conference: "West", division: "Northwest" },
  { id: 9, city: "Detroit", name: "Pistons", full_name: "Detroit Pistons", abbreviation: "DET", conference: "East", division: "Central" },
  { id: 10, city: "Golden State", name: "Warriors", full_name: "Golden State Warriors", abbreviation: "GSW", conference: "West", division: "Pacific" },
  { id: 11, city: "Houston", name: "Rockets", full_name: "Houston Rockets", abbreviation: "HOU", conference: "West", division: "Southwest" },
  { id: 12, city: "Indiana", name: "Pacers", full_name: "Indiana Pacers", abbreviation: "IND", conference: "East", division: "Central" },
  { id: 13, city: "LA", name: "Clippers", full_name: "LA Clippers", abbreviation: "LAC", conference: "West", division: "Pacific" },
  { id: 14, city: "LA", name: "Lakers", full_name: "Los Angeles Lakers", abbreviation: "LAL", conference: "West", division: "Pacific" },
  { id: 15, city: "Memphis", name: "Grizzlies", full_name: "Memphis Grizzlies", abbreviation: "MEM", conference: "West", division: "Southwest" },
  { id: 16, city: "Miami", name: "Heat", full_name: "Miami Heat", abbreviation: "MIA", conference: "East", division: "Southeast" },
  { id: 17, city: "Milwaukee", name: "Bucks", full_name: "Milwaukee Bucks", abbreviation: "MIL", conference: "East", division: "Central" },
  { id: 18, city: "Minnesota", name: "Timberwolves", full_name: "Minnesota Timberwolves", abbreviation: "MIN", conference: "West", division: "Northwest" },
  { id: 19, city: "New Orleans", name: "Pelicans", full_name: "New Orleans Pelicans", abbreviation: "NOP", conference: "West", division: "Southwest" },
  { id: 20, city: "New York", name: "Knicks", full_name: "New York Knicks", abbreviation: "NYK", conference: "East", division: "Atlantic" },
  { id: 21, city: "Oklahoma City", name: "Thunder", full_name: "Oklahoma City Thunder", abbreviation: "OKC", conference: "West", division: "Northwest" },
  { id: 22, city: "Orlando", name: "Magic", full_name: "Orlando Magic", abbreviation: "ORL", conference: "East", division: "Southeast" },
  { id: 23, city: "Philadelphia", name: "76ers", full_name: "Philadelphia 76ers", abbreviation: "PHI", conference: "East", division: "Atlantic" },
  { id: 24, city: "Phoenix", name: "Suns", full_name: "Phoenix Suns", abbreviation: "PHX", conference: "West", division: "Pacific" },
  { id: 25, city: "Portland", name: "Trail Blazers", full_name: "Portland Trail Blazers", abbreviation: "POR", conference: "West", division: "Northwest" },
  { id: 26, city: "Sacramento", name: "Kings", full_name: "Sacramento Kings", abbreviation: "SAC", conference: "West", division: "Pacific" },
  { id: 27, city: "San Antonio", name: "Spurs", full_name: "San Antonio Spurs", abbreviation: "SAS", conference: "West", division: "Southwest" },
  { id: 28, city: "Toronto", name: "Raptors", full_name: "Toronto Raptors", abbreviation: "TOR", conference: "East", division: "Atlantic" },
  { id: 29, city: "Utah", name: "Jazz", full_name: "Utah Jazz", abbreviation: "UTA", conference: "West", division: "Northwest" },
  { id: 30, city: "Washington", name: "Wizards", full_name: "Washington Wizards", abbreviation: "WAS", conference: "East", division: "Southeast" },
];

export function chooseDistractorTeams(answer: string, count = 3) {
  const answerTeam = NBA_TEAMS.find((team) => team.full_name === answer);
  const candidates = NBA_TEAMS.filter((team) => team.full_name !== answer);
  const sameConference = answerTeam 
    ? candidates.filter((team) => team.conference === answerTeam.conference)
    : [];
  const pool = sameConference.length >= count ? sameConference : candidates;
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((team) => team.full_name);
}
