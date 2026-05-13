import React, { createContext, useContext, useState, ReactNode } from 'react';

interface RuntimeContextType {
  runtimeId: string | null;
  setRuntimeId: (id: string | null) => void;
}

const RuntimeContext = createContext<RuntimeContextType | undefined>(undefined);

export const RuntimeProvider = ({ children }: { children: ReactNode }) => {
  const [runtimeId, setRuntimeId] = useState<string | null>(null);

  return (
    <RuntimeContext.Provider value={{ runtimeId, setRuntimeId }}>
      {children}
    </RuntimeContext.Provider>
  );
};

export const useRuntime = () => {
  const context = useContext(RuntimeContext);
  if (context === undefined) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  return context;
};
