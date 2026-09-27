import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const MatchContext = createContext();

export function MatchProvider({ children }) {
  const [matchUpdates, setMatchUpdates] = useState({});
  const [individualMatches, setIndividualMatches] = useState({});
  const [notifications, setNotifications] = useState([]);
  const matchUpdatesRef = useRef(matchUpdates);
  const individualMatchesRef = useRef(individualMatches);
  const notificationIdRef = useRef(0);
  matchUpdatesRef.current = matchUpdates;
  individualMatchesRef.current = individualMatches;

  const updateMatch = useCallback((matchId, scoreA, scoreB, status, winner, details = {}, shouldNotify = true) => {
    const matchKey = String(matchId);
    const fixtureEntry = Object.entries(individualMatchesRef.current).find(([, matches]) =>
      matches.some(match => String(match.matchId) === matchKey)
    );

    const matchUpdate = { scoreA, scoreB, status, winner };
    const nextMatchUpdates = { ...matchUpdatesRef.current, [matchKey]: matchUpdate };
    matchUpdatesRef.current = nextMatchUpdates;
    setMatchUpdates(nextMatchUpdates);

    let individualMatchesChanged = false;
    const nextIndividualMatches = {};
    for (const [fixtureId, matches] of Object.entries(individualMatchesRef.current)) {
      nextIndividualMatches[fixtureId] = matches.map(match => {
        if (String(match.matchId) !== matchKey) return match;
        individualMatchesChanged = true;
        return { ...match, ...matchUpdate };
      });
    }
    if (individualMatchesChanged) {
      individualMatchesRef.current = nextIndividualMatches;
      setIndividualMatches(nextIndividualMatches);
    }

    if (shouldNotify) {
      const [fixtureId, fixtureMatches = []] = fixtureEntry || [details.parentId, []];
      const gameScore = fixtureMatches.reduce((score, match) => {
        const latest = matchUpdatesRef.current[String(match.matchId)];
        const current = String(match.matchId) === matchKey
          ? { ...match, scoreA, scoreB, status, winner }
          : { ...match, ...latest };
        const currentWinner = current.winner || (
          current.status === 'finished'
            ? Number(current.scoreA) > Number(current.scoreB) ? 1 : Number(current.scoreB) > Number(current.scoreA) ? 2 : 0
            : 0
        );
        if (currentWinner === 1) score.scoreA++;
        if (currentWinner === 2) score.scoreB++;
        return score;
      }, { scoreA: 0, scoreB: 0 });
      const cachedMatch = fixtureMatches.find(match => String(match.matchId) === matchKey);

      const playerA = cachedMatch?.playerA || details.playerA || '';
      const playerB = cachedMatch?.playerB || details.playerB || '';
      if (details.teamA && details.teamB && playerA && playerB) {
        setNotifications(prev => [...prev, {
        id: ++notificationIdRef.current,
        gameScore,
        scoreA,
        scoreB,
        status,
        winner,
        discipline: cachedMatch?.discipline ?? details.disciplineId ?? details.discipline ?? '',
        raceTo: cachedMatch?.raceTo ?? details.raceTo ?? '',
        playerA,
        playerB,
        teamA: details.teamA || '',
        teamB: details.teamB || '',
        fixtureId: fixtureId || '',
        }]);
      }
    }
  }, []);

  const storeIndividualMatches = useCallback((fixtureId, matches) => {
    const next = { ...individualMatchesRef.current, [fixtureId]: matches };
    individualMatchesRef.current = next;
    setIndividualMatches(next);
  }, []);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  return (
    <MatchContext.Provider value={{ matchUpdates, updateMatch, individualMatches, storeIndividualMatches, notifications, dismissNotification, clearNotifications }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatchUpdates() {
  return useContext(MatchContext);
}