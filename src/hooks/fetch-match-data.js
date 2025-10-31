import {useState, useEffect} from 'react';
import { extractDataFromHTML } from '../utils/extract-match-details-from-html.js'
export function useIndividualMatchData(today, tournamentId, matchId){
  const [matches, setMatches] = useState([]);
  // hacky way to find if time in amsterdam is past 20:00
  // const isTournametStartTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Amsterdam"}).includes(" 20:");

 
  useEffect(() => {
    if(!today /*|| !isTournametStartTime*/)
      return
    const fetchHtml = async (tournamentId, matchId) => {
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`);
        const html = await res.text();
        setMatches(extractDataFromHTML(html))
    }
    fetchHtml(tournamentId, matchId);
  }, [])
  return matches;
}