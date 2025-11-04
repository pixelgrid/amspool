import {useState, useEffect} from 'react';
import { extractDataFromHTML } from '../utils/extract-match-details-from-html.js'
export function useIndividualMatchData(today, tournamentId, matchId){
  const [matches, setMatches] = useState([]);
  // hacky way to find if time in amsterdam is past 20:00
  // const isTournametStartTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Amsterdam"}).includes(" 20:");

 
  useEffect(() => {
    const fetchStaticData = async (tournamentId, matchId) => {
      const res = await fetch(`/amspool/match_data/${tournamentId}_${matchId}.json`);
      const matchData = await res.json();
      setMatches(matchData);
    }
    const fetchHtml = async (tournamentId, matchId) => {
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`);
        const html = await res.text();
        const parser = new DOMParser();
        const htmlTree = parser.parseFromString(html, 'text/html');
        setMatches(extractDataFromHTML(htmlTree))
    }
    if(!today){
      fetchStaticData(tournamentId, matchId);
    } else {
      fetchHtml(tournamentId, matchId);
    }
  }, [])
  return matches;
}