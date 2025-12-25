import React, { createContext, useContext } from "react";

type WhiteboardContextType = {
  componentId: string;
};

const WhiteboardContext = createContext<WhiteboardContextType | null>(null);

export function WhiteboardProvider({
  componentId,
  children,
}: {
  componentId: string;
  children: React.ReactNode;
}) {
  return (
    <WhiteboardContext.Provider value={{ componentId }}>
      {children}
    </WhiteboardContext.Provider>
  );
}

export function useWhiteboardContext() {
  const context = useContext(WhiteboardContext);
  if (!context) {
    throw new Error("useWhiteboardContext must be used within a WhiteboardProvider");
  }
  return context;
}

