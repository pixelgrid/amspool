import React, { createContext, useCallback, useContext, useState } from 'react';

const MatchContext = createContext();

export function MatchProvider({ children }) {
  const [matchUpdates, setMatchUpdates] = useState({});
  const [individualMatches, setIndividualMatches] = useState({});

  const updateMatch = useCallback((matchId, scoreA, scoreB, status, winner) => {
    setMatchUpdates(prev => ({
      ...prev,
      [matchId]: { scoreA, scoreB, status, winner }
    }));

    setIndividualMatches(prev => {
      let changed = false;
      const next = {};

      for (const [fixtureId, matches] of Object.entries(prev)) {
        next[fixtureId] = matches.map(match => {
          if (String(match.matchId) !== String(matchId))
            return match;

          changed = true;
          return { ...match, scoreA, scoreB, status, winner };
        });
      }

      return changed ? next : prev;
    });
  }, []);

  const storeIndividualMatches = useCallback((fixtureId, matches) => {
    setIndividualMatches(prev => ({ ...prev, [fixtureId]: matches }));
  }, []);

  return (
    <MatchContext.Provider value={{ matchUpdates, updateMatch, individualMatches, storeIndividualMatches }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatchUpdates() {
  return useContext(MatchContext);
}