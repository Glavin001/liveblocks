"use client";

import React, { useState, useCallback } from "react";
import { CanvasComponent as CanvasComponentType } from "../../liveblocks.config";
import { useDragComponent } from "../../hooks/useDragComponent";
import { useResizeComponent } from "../../hooks/useResizeComponent";
import { useMutation, useMyPresence } from "@liveblocks/react/suspense";
import { cn } from "../../lib/utils";

// Placeholders for actual blocks
import { WhiteboardBlock } from "../blocks/whiteboard/WhiteboardBlock";
import { DocumentBlock } from "../blocks/document/DocumentBlock";
import { VideoBlock } from "../blocks/video/VideoBlock";
import { TodoListBlock } from "../blocks/todo/TodoListBlock";
import { CalendarBlock } from "../blocks/calendar/CalendarBlock";

import { Trash2, Maximize2 } from "lucide-react";

type Props = {
  id: string;
  component: CanvasComponentType;
};

export function CanvasComponent({ id, component }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const onDrag = useDragComponent(id);
  const [presence, setMyPresence] = useMyPresence();
  const isSelected = presence.selectedComponentId === id;

  const bringToFront = useMutation(({ storage }) => {
    const order = storage.get("componentOrder");
    const index = order.indexOf(id);
    if (index !== -1) {
      order.move(index, order.length - 1);
    }
  }, [id]);

  const deleteComponent = useMutation(({ storage }) => {
    storage.get("components").delete(id);
    const order = storage.get("componentOrder");
    const index = order.indexOf(id);
    if (index !== -1) {
      order.delete(index);
    }
    storage.get("whiteboardData").delete(id);
    setMyPresence({ selectedComponentId: null });
  }, [id, setMyPresence]);

  const onPointerDownTitleBar = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    bringToFront();
    setMyPresence({ selectedComponentId: id }); // Select the block for management
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [id, setMyPresence, bringToFront]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    onDrag({ x: e.movementX, y: e.movementY });
  }, [isDragging, onDrag]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      className={cn(
        "absolute bg-white shadow-lg border-2 rounded-xl overflow-hidden flex flex-col",
        isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-neutral-200"
      )}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
      }}
      onPointerDown={() => {
        bringToFront();
        // We no longer automatically select the component for deletion here
        // only when the title bar is clicked.
      }}
    >
      {/* Title Bar / Drag Handle */}
      <div 
        className="h-10 bg-neutral-50 border-b border-neutral-100 flex items-center px-4 cursor-grab active:cursor-grabbing select-none shrink-0 group"
        onPointerDown={onPointerDownTitleBar}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-sm font-semibold text-neutral-600 truncate flex-1">
          {component.title}
        </span>
        <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              bringToFront();
            }}
            className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-500 transition-colors"
            title="Bring to Front"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this block?")) {
                deleteComponent();
              }
            }}
            className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded-md text-neutral-500 transition-colors"
            title="Delete Block"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Block Content */}
      <div 
        className="flex-1 overflow-hidden relative pointer-events-auto"
        onPointerDown={() => {
          // When clicking inside the content area, deselect the block from "management mode"
          // so that global Delete key affects content (like shapes or text) instead of the block.
          if (isSelected) {
            setMyPresence({ selectedComponentId: null });
          }
        }}
      >
        {component.type === "whiteboard" && <WhiteboardBlock componentId={id} />}
        {component.type === "document" && <DocumentBlock componentId={id} />}
        {component.type === "video" && (
          <VideoBlock componentId={id} url={component.videoUrl} />
        )}
        {component.type === "todo" && <TodoListBlock componentId={id} />}
        {component.type === "calendar" && <CalendarBlock componentId={id} />}
      </div>

      {/* Resize Handle - bottom right */}
      <ResizeHandle id={id} />
    </div>
  );
}

function ResizeHandle({ id }: { id: string }) {
  const onResizeDelta = useMutation(({ storage }, delta: { x: number; y: number }) => {
    const component = storage.get("components").get(id);
    if (component && typeof (component as any).update === 'function') {
      (component as any).update({
        width: Math.max(300, (component as any).get("width") + delta.x),
        height: Math.max(200, (component as any).get("height") + delta.y),
      });
    }
  }, [id]);
  
  const [isResizing, setIsResizing] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    onResizeDelta({ x: e.movementX, y: e.movementY });
  };

  return (
    <div
      className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-neutral-300 rounded-tl-sm hover:bg-blue-500 transition-colors"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setIsResizing(false)}
    />
  );
}

