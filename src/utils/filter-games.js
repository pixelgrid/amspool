import eerste_divisie from '../../league_data/generated/61204921_generated'
import tweede_divisie from '../../league_data/generated/61204927_generated'
import derde_divisie from '../../league_data/generated/61204939_generated'

import eerste_klasse from '../../league_data/generated/61204738_generated'
import tweede_klasse from '../../league_data/generated/61204744_generated'
import derde_klasse from '../../league_data/generated/61204750_generated'

const leagues_list = [eerste_divisie, tweede_divisie, derde_divisie, eerste_klasse, tweede_klasse, derde_klasse];
export function find_games_for_date(date){
  const todayDt = new Date();
  const targetDate = new Date(date).toISOString().split('T')[0]
  const results = [];
  for(let league of leagues_list){
    let league_games = [];
    for(let match of league){
      const startTimeDt = new Date(match.startTime);
      const startTime = startTimeDt.toISOString().split('T')[0]
      if(startTimeDt <= todayDt)
        match.shouldFetch = true;
      if (startTime === targetDate)
       league_games.push(match)
    }
    if(league_games.length > 0)
      results.push(league_games)
  }
  return [targetDate, results]
}

