import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

/**
 * A component on the infinite canvas
 */
export type CanvasComponent = {
  id: string;
  type: "whiteboard" | "document" | "video";
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  videoUrl?: string; // Only for video type
};

export type Color = {
  r: number;
  g: number;
  b: number;
};

export enum LayerType {
  Rectangle,
  Ellipse,
  Path,
}

export type RectangleLayer = {
  type: LayerType.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
};

export type EllipseLayer = {
  type: LayerType.Ellipse;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
};

export type PathLayer = {
  type: LayerType.Path;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: Color;
  points: number[][];
};

export type Layer = RectangleLayer | EllipseLayer | PathLayer;

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      selectedComponentId: string | null;
      // For whiteboard: which layers are selected within a whiteboard
      whiteboardSelection: { componentId: string; layerIds: string[] } | null;
      pencilDraft: [x: number, y: number, pressure: number][] | null;
      penColor: Color | null;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // The shared chat ID for the room's AI Copilot
      chatId: string;

      // The canvas layout - positions of all blocks
      components: LiveMap<string, LiveObject<CanvasComponent>>;
      componentOrder: LiveList<string>; // Z-index ordering

      // Whiteboard data - keyed by component ID
      // Each whiteboard has its own layers and layer ordering
      whiteboardData: LiveMap<string, LiveObject<{
        layers: LiveMap<string, LiveObject<Layer>>;
        layerIds: LiveList<string>;
      }>>;

      // Document data is handled by Yjs via the `field` option
      // Each document uses field: `doc-${componentId}` in useLiveblocksExtension
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events sent with useBroadcastEvent and useEventListener
    RoomEvent: {
      type: "SHARE_DIALOG_OPENED";
    };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      componentId: string;        // Which block this comment is on
      // For whiteboards: position within the canvas
      x?: number;
      y?: number;
      // For videos: timestamp
      time?: number;
      timePercentage?: number;
      // For documents: handled by Tiptap's AnchoredThreads automatically
    };
  }
}

export { };

