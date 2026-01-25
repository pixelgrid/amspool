import React, { createContext, useContext, useState } from 'react';

const MatchContext = createContext();

export function MatchProvider({ children }) {
  const [matchUpdates, setMatchUpdates] = useState({});

  const updateMatch = (matchId, scoreA, scoreB, status, winner) => {
    setMatchUpdates(prev => ({
      ...prev,
      [matchId]: { scoreA, scoreB, status, winner }
    }));
  };

  return (
    <MatchContext.Provider value={{ matchUpdates, updateMatch }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatchUpdates() {
  return useContext(MatchContext);
}