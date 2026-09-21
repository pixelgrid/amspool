import {useEffect, useRef} from 'react';
import { extractDataFromHTML } from '../utils/extract-match-details-from-html.js'
import { normalizeSubMatch, teamFileName } from '../utils/normalize-sub-match.js'
import { useMatchUpdates } from '../context/match-context.jsx';
const URL_PROXY_BASE64 = 'aHR0cHM6Ly9jb3JzLXByb3h5LW5pbmUtdmlyaWQudmVyY2VsLmFwcC9wcm94eT91cmw9'
const decodeBase64 = (value) =>
  typeof globalThis.atob === 'function'
    ? globalThis.atob(value)
    : globalThis.Buffer.from(value, 'base64').toString('utf-8')
const TOURNAMENT_MATCH_CACHE_TTL = 60 * 1000;
const tournamentMatchRequests = new Map();

function fetchTournamentMatches(tournamentId) {
  const cacheKey = String(tournamentId);
  const cachedRequest = tournamentMatchRequests.get(cacheKey);
  if (cachedRequest && Date.now() - cachedRequest.createdAt < TOURNAMENT_MATCH_CACHE_TTL) {
    return cachedRequest.request;
  }

  const proxyUrl = decodeBase64(URL_PROXY_BASE64);
  const encoded = encodeURIComponent(`https://api.cuescore.com/match/sub/all/?tournamentId=${tournamentId}`)
  const request = fetch(`${proxyUrl}${encoded}`).then(async response => {
    if (!response.ok) throw new Error(`Unable to fetch tournament matches: ${response.status}`);
    return response.json();
  });

  tournamentMatchRequests.set(cacheKey, { request, createdAt: Date.now() });
  request.catch(() => {
    if (tournamentMatchRequests.get(cacheKey)?.request === request) {
      tournamentMatchRequests.delete(cacheKey);
    }
  });
  return request;
}

export function useIndividualMatchData(shouldFetch, tournamentId, matchId, teamA, teamB, forceLive = false){
  const { matchUpdates, individualMatches, storeIndividualMatches } = useMatchUpdates();
  const liveFetchKey = useRef(null);
  const matches = (individualMatches[matchId] || []).map(match => ({
    ...match,
    ...(matchUpdates[match.matchId] || {})
  }));

  useEffect(() => {
    const fetchFromApi = async (tournamentId, matchId) => {
      const matches = await fetchTournamentMatches(tournamentId);
        storeIndividualMatches(matchId, matches
          .filter(match => String(match.parentId) === String(matchId))
          .map(normalizeSubMatch));
    }

    const fetchHtml = async (tournamentId, matchId) => {
        const proxyUrl = decodeBase64(URL_PROXY_BASE64)
        const encoded = encodeURIComponent(`https://cuescore.com/ajax/match/matchDetails.php?tournamentId=${tournamentId}&id=${matchId}`)
        const res = await fetch(`${proxyUrl}${encoded}`);
        const html = await res.text();
        const parser = new DOMParser();
        const htmlTree = parser.parseFromString(html, 'text/html');
        storeIndividualMatches(matchId, extractDataFromHTML(htmlTree))
    }

    const fetchStaticTeamData = async (teamName) => {
        if (!teamName) return [];
        const url = `${import.meta.env.BASE_URL}match-data/${tournamentId}/${teamFileName(teamName)}.json`;
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
    }

    const fetchData = async () => {
      try {
        if (!forceLive) {
          const staticMatches = Array.from(new Map(
            (await Promise.all([teamA, teamB].map(fetchStaticTeamData)))
              .flat()
              .filter(match => String(match.parentId) === String(matchId))
              .map(match => [String(match.matchId), normalizeSubMatch(match)])
          ).values());
          if (staticMatches.length) {
            storeIndividualMatches(matchId, staticMatches);
            return;
          }
        }
        await fetchFromApi(tournamentId, matchId);
      } catch {
        await fetchHtml(tournamentId, matchId);
      }
    }

    const currentMatchKey = `${tournamentId}:${matchId}`;
    if (forceLive && liveFetchKey.current !== currentMatchKey) {
      liveFetchKey.current = currentMatchKey;
      fetchData();
    } else if(shouldFetch && !individualMatches[matchId]){
      fetchData();
    }

    if (forceLive) {
      const refreshInterval = setInterval(fetchData, TOURNAMENT_MATCH_CACHE_TTL);
      return () => clearInterval(refreshInterval);
    }
  }, [shouldFetch, tournamentId, matchId, teamA, teamB, forceLive, individualMatches, storeIndividualMatches]);
  return matches;
}