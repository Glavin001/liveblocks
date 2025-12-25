"use client";

import { useThreads, useCreateThread } from "@liveblocks/react/suspense";
import { Composer, Thread } from "@liveblocks/react-ui";
import { useState, useCallback } from "react";
import { useWhiteboardContext } from "./WhiteboardContext";

export function WhiteboardComments() {
  const { componentId } = useWhiteboardContext();
  const { threads } = useThreads({
    query: {
      metadata: {
        componentId,
      },
    },
  });

  const [composerCoords, setComposerCoords] = useState<{ x: number; y: number } | null>(null);
  const createThread = useCreateThread();

  const onCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    setComposerCoords({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const onComposerSubmit = useCallback(
    ({ body }: any, event: any) => {
      event.preventDefault();
      if (!composerCoords) return;

      createThread({
        body,
        metadata: {
          componentId,
          x: composerCoords.x,
          y: composerCoords.y,
        },
      });

      setComposerCoords(null);
    },
    [composerCoords, componentId, createThread]
  );

  return (
    <div 
      className="absolute inset-0 pointer-events-auto" 
      onClick={onCanvasClick}
    >
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="absolute"
          style={{
            left: thread.metadata.x as number,
            top: thread.metadata.y as number,
          }}
        >
          <div className="bg-white rounded-full p-1 shadow-md border cursor-pointer hover:scale-110 transition-transform">
            💬
          </div>
          {/* We could show the thread on hover or click */}
        </div>
      ))}

      {composerCoords && (
        <div
          className="absolute z-50"
          style={{ left: composerCoords.x, top: composerCoords.y }}
        >
          <Composer onComposerSubmit={onComposerSubmit} />
        </div>
      )}
    </div>
  );
}

