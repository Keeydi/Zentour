import React, { createContext, useContext } from 'react';

interface JeepneyContextType {
  selectedJeepney: string | null;
  setSelectedJeepney: (id: string | null) => void;
}

export const JeepneyContext = createContext<JeepneyContextType>({
  selectedJeepney: null,
  setSelectedJeepney: () => {},
});

export const useJeepney = () => useContext(JeepneyContext);

