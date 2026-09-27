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

  const updateMatch = useCallback((matchId, scoreA, scoreB, status, winner, teams = {}, shouldNotify = true) => {
    const matchKey = String(matchId);
    const fixtureEntry = Object.entries(individualMatchesRef.current).find(([, matches]) =>
      matches.some(match => String(match.matchId) === matchKey)
    );

    setMatchUpdates(prev => ({
      ...prev,
      [matchKey]: { scoreA, scoreB, status, winner }
    }));

    setIndividualMatches(prev => {
      let changed = false;
      const next = {};

      for (const [fixtureId, matches] of Object.entries(prev)) {
        next[fixtureId] = matches.map(match => {
          if (String(match.matchId) !== matchKey)
            return match;

          changed = true;
          return { ...match, scoreA, scoreB, status, winner };
        });
      }

      return changed ? next : prev;
    });

    if (fixtureEntry && shouldNotify) {
      const [fixtureId, fixtureMatches] = fixtureEntry;
      const updatedMatches = fixtureMatches.map(match => {
        if (String(match.matchId) !== matchKey) return match;
        return { ...match, scoreA, scoreB, status, winner };
      });
      const gameScore = updatedMatches.reduce((score, match) => {
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
      const updatedMatch = updatedMatches.find(match => String(match.matchId) === matchKey);

      setNotifications(prev => [...prev, {
        id: ++notificationIdRef.current,
        gameScore,
        scoreA,
        scoreB,
        status,
        winner,
        discipline: updatedMatch.discipline,
        raceTo: updatedMatch.raceTo,
        playerA: updatedMatch.playerA,
        playerB: updatedMatch.playerB,
        teamA: teams.teamA || '',
        teamB: teams.teamB || '',
        fixtureId,
      }]);
    }
  }, []);

  const storeIndividualMatches = useCallback((fixtureId, matches) => {
    setIndividualMatches(prev => ({ ...prev, [fixtureId]: matches }));
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