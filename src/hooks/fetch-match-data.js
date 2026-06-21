import {useState, useEffect} from 'react';
import { extractDataFromHTML } from '../utils/extract-match-details-from-html.js'
const URL_PROXY_BASE64 = 'aHR0cHM6Ly9jb3JzLXByb3h5LW5pbmUtdmlyaWQudmVyY2VsLmFwcC9wcm94eT91cmw9'
const decodeBase64 = (value) =>
  typeof globalThis.atob === 'function'
    ? globalThis.atob(value)
    : Buffer.from(value, 'base64').toString('utf-8')

export function useIndividualMatchData(shouldFetch, tournamentId, matchId){
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchHtml = async (tournamentId, matchId) => {
        const proxyUrl = decodeBase64(URL_PROXY_BASE64)
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`${proxyUrl}${encoded}`);
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