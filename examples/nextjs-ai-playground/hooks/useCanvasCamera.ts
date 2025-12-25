import { useState, useCallback } from "react";

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export function useCanvasCamera() {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
      zoom: camera.zoom, // Zoom is harder to implement correctly, sticking to pan for now
    }));
  }, []);

  return { camera, setCamera, onWheel };
}

