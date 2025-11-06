import {useState, useEffect} from 'react';
import { extractDataFromHTML } from '../utils/extract-match-details-from-html.js'
export function useIndividualMatchData(shouldFetch, tournamentId, matchId){
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchHtml = async (tournamentId, matchId) => {
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encoded}`);
        const html = await res.text();
        const parser = new DOMParser();
        const htmlTree = parser.parseFromString(html, 'text/html');
        setMatches(extractDataFromHTML(htmlTree))
    }
    if(shouldFetch){
      fetchHtml(tournamentId, matchId);
    }
  }, []);
  return matches;
}