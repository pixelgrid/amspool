import {useEffect} from 'react';
import { extractDataFromHTML } from '../utils/extract-match-details-from-html.js'
import { useMatchUpdates } from '../context/match-context.jsx';
const URL_PROXY_BASE64 = 'aHR0cHM6Ly9jb3JzLXByb3h5LW5pbmUtdmlyaWQudmVyY2VsLmFwcC9wcm94eT91cmw9'
const decodeBase64 = (value) =>
  typeof globalThis.atob === 'function'
    ? globalThis.atob(value)
    : globalThis.Buffer.from(value, 'base64').toString('utf-8')

export function useIndividualMatchData(shouldFetch, tournamentId, matchId){
  const { matchUpdates, individualMatches, storeIndividualMatches } = useMatchUpdates();
  const matches = (individualMatches[matchId] || []).map(match => ({
    ...match,
    ...(matchUpdates[match.matchId] || {})
  }));

  useEffect(() => {
    const fetchHtml = async (tournamentId, matchId) => {
        const proxyUrl = decodeBase64(URL_PROXY_BASE64)
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`${proxyUrl}${encoded}`);
        const html = await res.text();
        const parser = new DOMParser();
        const htmlTree = parser.parseFromString(html, 'text/html');
        storeIndividualMatches(matchId, extractDataFromHTML(htmlTree))
    }
    if(shouldFetch && !individualMatches[matchId]){
      fetchHtml(tournamentId, matchId);
    }
  }, [shouldFetch, tournamentId, matchId, individualMatches, storeIndividualMatches]);
  return matches;
}