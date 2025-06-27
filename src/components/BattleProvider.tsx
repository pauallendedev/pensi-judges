'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface BattleContextType {
  currentRoundIndex: number;
  setCurrentRoundIndex: (index: number) => void;
}

const BattleContext = createContext<BattleContextType | null>(null);

export const useBattle = () => {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error('BattleContext must be used inside a BattleProvider');
  return ctx;
};

export const BattleProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  return (
    <BattleContext.Provider value={{ currentRoundIndex, setCurrentRoundIndex }}>
      {children}
    </BattleContext.Provider>
  );
};
