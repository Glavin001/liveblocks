"use client";

import React, { useRef } from "react";
import { useStorage } from "@liveblocks/react/suspense";
import { CanvasComponent } from "./CanvasComponent";
import LiveCursors from "./LiveCursors";
import { useGlobalCanvasCamera } from "../../hooks/useCanvasCameraContext";

export function InfiniteCanvas() {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/b6e58eb4-79e7-400a-b0ef-45b913a69f7f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'InfiniteCanvas.tsx:10',message:'InfiniteCanvas entry',timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const { camera, onWheel } = useGlobalCanvasCamera();
  const components = useStorage((root) => root.components);
  const componentOrder = useStorage((root) => root.componentOrder);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-neutral-100"
      onWheel={onWheel}
    >
      {/* Grid background moved back outside but to the top of DOM (so it's behind) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: `${40 * camera.zoom}px ${40 * camera.zoom}px`,
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
      />

      <div
        className="absolute inset-0 transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Render components in their Z-order */}
        {componentOrder.map((id) => {
          const component = components.get(id);
          if (!component) return null;
          return (
            <CanvasComponent
              key={id}
              id={id}
              component={component}
            />
          );
        })}

        {/* Cursors on top of components */}
        <LiveCursors cursorPanel={containerRef} camera={camera} />
      </div>
    </div>
  );
}

