"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Camera, useCanvasCamera } from "./useCanvasCamera";

type CanvasCameraContextType = {
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  onWheel: (e: React.WheelEvent) => void;
};

const CanvasCameraContext = createContext<CanvasCameraContextType | null>(null);

export function CanvasCameraProvider({ children }: { children: ReactNode }) {
  const cameraState = useCanvasCamera();
  return (
    <CanvasCameraContext.Provider value={cameraState}>
      {children}
    </CanvasCameraContext.Provider>
  );
}

export function useGlobalCanvasCamera() {
  const context = useContext(CanvasCameraContext);
  if (!context) {
    throw new Error("useGlobalCanvasCamera must be used within a CanvasCameraProvider");
  }
  return context;
}

